<template>
  <div class="feed-page">
    <header class="feed-top-header">
      <div class="feed-top-header-inner">
        <div class="feed-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
          </svg>
        </div>
        <h1>{{ t('feed') }}</h1>
        <div class="feed-header-menu-wrap">
          <button class="feed-menu-btn" @click.stop="toggleMenu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/>
            </svg>
          </button>
          <Transition name="feed-menu">
            <div v-if="showMenu" class="feed-header-menu glass-modal" @click.stop>
              <router-link :to="`/profile/${authStore.user?.id}`" class="feed-menu-item" @click="showMenu = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
                <span>{{ t('profile') }}</span>
              </router-link>
              <router-link to="/settings" class="feed-menu-item" @click="showMenu = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>{{ t('settings') }}</span>
              </router-link>
              <button @click="logout" class="feed-menu-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M7 12h14m0 0l-3-3m3 3l-3 3"/></svg>
                <span>{{ t('logout') }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>
    <div class="feed-content">
      <CreatePost @created="onPostCreated" />
      
      <div v-if="loading && !posts.length" class="loading-state">
        <div class="spinner-lg"></div>
        <p>{{ t('loading') }}</p>
      </div>
      
      <TransitionGroup name="post" tag="div" class="posts-list">
        <PostCard 
          v-for="post in sortedPosts" 
          :key="post.id" 
          :id="'post-' + post.id"
          :post="post"
          :hide-pin="true"
          @delete="deletePost"
          @update="updatePost"
          @open-media="openMedia"
        />
      </TransitionGroup>
      
      <div v-if="!loading && !posts.length" class="empty-state glass">
        <h3>{{ t('noPosts') }}</h3>
        <p>{{ t('writeFirst') }}</p>
      </div>
      
      <div v-if="hasMore" ref="loadMore" class="load-more">
        <div v-if="loading" class="spinner"></div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMediaViewer" class="media-viewer-overlay" @click.self="closeMedia">
          <button class="viewer-close" @click="closeMedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
          <div class="viewer-content"><img v-if="mediaViewerType === 'image'" :src="mediaViewerSrc" alt=""><video v-else :src="mediaViewerSrc" controls autoplay></video></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../socket'
import { useI18n } from '../i18n'
import api from '../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notifications = useNotificationsStore()
const authStore = useAuthStore()
const { on, off } = useSocket()
const posts = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const loadMore = ref(null)
const lastFetchTime = ref(null)
const showMenu = ref(false)
let observer

const showMediaViewer = ref(false)
const mediaViewerSrc = ref('')
const mediaViewerType = ref('image')

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

function openMedia(src, type) { mediaViewerSrc.value = src; mediaViewerType.value = type; showMediaViewer.value = true }
function closeMedia() { showMediaViewer.value = false }

function toggleMenu() { showMenu.value = !showMenu.value }
function logout() { authStore.logout(); router.push('/login') }
function handleClickOutside(e) {
  if (showMenu.value && !e.target.closest('.feed-header-menu-wrap')) {
    showMenu.value = false
  }
}

function scrollToPost(postId) {
  nextTick(() => {
    const el = document.getElementById('post-' + postId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-post')
      setTimeout(() => el.classList.remove('highlight-post'), 2000)
    }
  })
}

async function fetchPosts(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return
  
  loading.value = true
  try {
    const currentPage = reset ? 1 : page.value
    const res = await api.get('/posts', { params: { page: currentPage, limit: 10 } })
    
    if (reset) {
      posts.value = res.data.posts
      page.value = 2
      lastFetchTime.value = new Date().toISOString()
    } else {
      posts.value.push(...res.data.posts)
      page.value++
    }
    hasMore.value = res.data.hasMore
  } catch (err) {
    console.log('Failed to fetch posts:', err)
  } finally {
    loading.value = false
  }
}

async function pollNewPosts() {
  if (!lastFetchTime.value) return
  try {
    const res = await api.get('/posts', { params: { since: lastFetchTime.value } })
    if (res.data.posts.length > 0) {
      res.data.posts.forEach(newPost => {
        const exists = posts.value.find(p => p.id === newPost.id)
        if (!exists) {
          posts.value.unshift(newPost)
        } else {
          const idx = posts.value.findIndex(p => p.id === newPost.id)
          if (idx !== -1) {
            Object.assign(posts.value[idx], newPost)
          }
        }
      })
      lastFetchTime.value = new Date().toISOString()
    }
  } catch {}
}

function onNewPost(post) {
  const exists = posts.value.find(p => p.id === post.id)
  if (!exists) {
    posts.value.unshift(post)
  }
}

function onPostCreated(post) {
  const exists = posts.value.find(p => p.id === post.id)
  if (!exists) {
    posts.value.unshift(post)
  }
}

async function deletePost(id) {
  try {
    await api.delete(`/posts/${id}`)
    posts.value = posts.value.filter(p => p.id !== id)
  } catch (err) {
    console.log('Failed to delete post:', err)
  }
}

function updatePost(updated) {
  const idx = posts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) {
    if (updated.isArchived) {
      posts.value.splice(idx, 1)
    } else {
      Object.assign(posts.value[idx], updated)
    }
  }
}

let pollInterval = null

onMounted(async () => {
  await fetchPosts(true)
  on('post:new', onNewPost)
  
  pollInterval = setInterval(pollNewPosts, 3000)
  
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) fetchPosts()
  }, { threshold: 0.1 })
  
  if (loadMore.value) observer.observe(loadMore.value)
  
  if (route.query.post) {
    scrollToPost(route.query.post)
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  observer?.disconnect()
  off('post:new', onNewPost)
  if (pollInterval) clearInterval(pollInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.feed-page {
  min-height: 100vh;
  padding: 20px;
  padding-top: 64px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.feed-top-header {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: 56px;
  background: var(--bg-primary);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feed-top-header-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 600px;
  width: 100%;
  padding: 0 20px;
}

.feed-logo {
  width: 32px;
  height: 32px;
  color: var(--text-primary);
  display: none;
}

.feed-logo svg {
  width: 100%;
  height: 100%;
}

.feed-top-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.feed-header-menu-wrap {
  display: none;
  position: relative;
  width: 32px;
}

.feed-menu-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  transition: all 0.1s;
}

.feed-menu-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.feed-menu-btn svg {
  width: 18px;
  height: 18px;
}

.feed-header-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  padding: 8px;
  z-index: 200;
}

.feed-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all 0.1s;
  text-decoration: none;
}

.feed-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.feed-menu-item.danger:hover {
  color: var(--danger);
}

.feed-menu-item svg {
  width: 18px;
  height: 18px;
}

.feed-menu-enter-active {
  animation: feed-menu-in 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.feed-menu-leave-active {
  animation: feed-menu-in 0.1s cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes feed-menu-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.feed-content {
  max-width: 600px;
  margin: 0 auto;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.spinner-lg {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 14px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.post-enter-active {
  animation: slideUp var(--transition-slow);
}

.post-leave-active {
  animation: fadeOut var(--transition);
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (max-width: 768px) {
  .feed-page {
    padding-left: 20px;
    padding-top: 76px;
  }
  
  .feed-top-header {
    left: 12px;
    right: 12px;
    top: 12px;
    height: 52px;
    background: rgba(28, 28, 30, 0.55);
    backdrop-filter: blur(50px) saturate(180%);
    -webkit-backdrop-filter: blur(50px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  
  .feed-top-header-inner {
    justify-content: space-between;
    padding: 0 12px;
    max-width: none;
  }
  
  .feed-logo {
    display: block;
    flex-shrink: 0;
  }
  
  .feed-top-header h1 {
    flex: 1;
    text-align: center;
    font-size: 16px;
  }
  
  .feed-header-menu-wrap {
    display: block;
    flex-shrink: 0;
  }
}

.media-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; display: flex; align-items: center; justify-content: center; }
.viewer-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; z-index: 10; }
.viewer-close:hover { background: rgba(255,255,255,0.1); }
.viewer-close svg { width: 24px; height: 24px; }
.viewer-content img, .viewer-content video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (hover: none) and (pointer: coarse) {
  .tab:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}

:deep(.highlight-post) {
  animation: highlightPost 2s ease-out;
}

@keyframes highlightPost {
  0%, 30% { box-shadow: 0 0 0 2px rgba(91, 154, 255, 0.6); }
  100% { box-shadow: none; }
}

[data-theme="light"] .empty-icon {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .spinner-lg {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .spinner {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .feed-top-header h1 {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  [data-theme="light"] .feed-top-header {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}
</style>
