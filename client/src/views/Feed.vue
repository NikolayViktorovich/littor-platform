<template>
  <div class="feed-page">
    <header class="feed-header mobile-only">
      <div class="user-info" @click="goToProfile">
        <img :src="userAvatar" class="user-avatar" alt="" @error="handleAvatarError">
        <h1 class="user-name">{{ authStore.user?.name || 'Главная' }}</h1>
      </div>
      
      <div class="header-actions">
        <button class="action-btn" @click="showCreatePostModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <div class="menu-wrap">
          <button class="action-btn" @click="showMenu = !showMenu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showMenu" class="dropdown-menu" @click.stop>
              <router-link :to="`/profile/${authStore.user?.id}`" class="dropdown-item" @click="showMenu = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>
                </svg>
                <span>{{ t('profile') }}</span>
              </router-link>
              <router-link to="/settings" class="dropdown-item" @click="showMenu = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>{{ t('settings') }}</span>
              </router-link>
              <button @click="logout" class="dropdown-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/>
                  <path d="M7 12h14m0 0l-3-3m3 3l-3 3"/>
                </svg>
                <span>{{ t('logout') }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <div class="stories-section mobile-only">
      <div class="stories-list">
        <div class="story-item my-story" @click="showStoriesModal = true">
          <div class="story-avatar">
            <img :src="userAvatar" alt="" @error="handleAvatarError">
            <div class="add-story-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
          </div>
          <span class="story-name">История</span>
        </div>
        
        <div v-for="story in mockStories" :key="story.id" class="story-item" @click="showStoriesModal = true">
          <div class="story-avatar has-story">
            <img :src="story.avatar" :alt="story.name">
          </div>
          <span class="story-name">{{ story.name }}</span>
        </div>
      </div>
    </div>

    <div class="stories-card desktop-only">
      <div class="stories-card-inner">
        <div class="stories-card-list">
          <div class="story-card my-story-card" @click="showStoriesModal = true">
            <div class="story-card-preview">
              <img :src="userAvatar" alt="" @error="handleAvatarError">
            </div>
            <div class="story-card-avatar">
              <img :src="userAvatar" alt="" @error="handleAvatarError">
              <div class="add-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            </div>
            <span class="story-card-name">История</span>
          </div>
          
          <div v-for="story in mockStories" :key="story.id" class="story-card" @click="showStoriesModal = true">
            <div class="story-card-preview">
              <img :src="story.preview || story.avatar" alt="">
            </div>
            <div class="story-card-avatar has-story">
              <img :src="story.avatar" :alt="story.name">
            </div>
            <span class="story-card-name">{{ story.name }}</span>
          </div>
        </div>
      </div>
      
      <div class="create-post-bar desktop-only" @click="focusCreatePost" style="display: none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Создать пост</span>
      </div>
    </div>
    
    <div class="feed-content">
      <CreatePost ref="createPostRef" @created="onPostCreated" />
      
      <div v-if="loading && !posts.length" class="loading-state">
        <div class="spinner-lg"></div>
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
        <CreatePostModal v-if="showCreatePostModal" @close="showCreatePostModal = false" @created="handlePostCreated" />
      </Transition>

      <Transition name="modal">
        <div v-if="showStoriesModal" class="modal-overlay" @click.self="showStoriesModal = false">
          <div class="modal glass-modal">
            <div class="modal-header">
              <h2>Истории</h2>
              <button @click="showStoriesModal = false" class="close-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-body center-text">
              <p>Не торопись, я пока разрабатываю это ;)</p>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showMediaViewer" class="media-viewer-overlay" @click.self="closeMedia">
          <button class="viewer-close" @click="closeMedia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="viewer-content">
            <img v-if="mediaViewerType === 'image'" :src="mediaViewerSrc" alt="">
            <video v-else :src="mediaViewerSrc" controls autoplay></video>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CreatePost from '../components/CreatePost.vue'
import CreatePostModal from '../components/CreatePostModal.vue'
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
const createPostRef = ref(null)
let observer

const showMediaViewer = ref(false)
const mediaViewerSrc = ref('')
const mediaViewerType = ref('image')
const showStoriesModal = ref(false)
const showCreatePostModal = ref(false)

const mockStories = ref([
  { id: 1, name: 'тсс..', avatar: '/default-avatar.svg', preview: '/default-avatar.svg' },
  { id: 2, name: 'скоро будет', avatar: '/default-avatar.svg', preview: '/default-avatar.svg' },
  { id: 3, name: 'подожди...', avatar: '/default-avatar.svg', preview: '/default-avatar.svg' },
  { id: 4, name: 'следи', avatar: '/default-avatar.svg', preview: '/default-avatar.svg' },
])

const userAvatar = computed(() => authStore.user?.avatar || '/default-avatar.svg')

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function goToProfile() { router.push(`/profile/${authStore.user?.id}`) }
function focusCreatePost() {
  if (createPostRef.value?.$el) {
    const textarea = createPostRef.value.$el.querySelector('textarea')
    if (textarea) textarea.focus()
  }
}

function openMedia(src, type) { mediaViewerSrc.value = src; mediaViewerType.value = type; showMediaViewer.value = true }
function closeMedia() { showMediaViewer.value = false }
function toggleMenu() { showMenu.value = !showMenu.value }
function closeMenu(e) { if (!e.target.closest('.menu-wrap')) showMenu.value = false }
function logout() { showMenu.value = false; authStore.logout(); router.push('/login') }

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
          if (idx !== -1) Object.assign(posts.value[idx], newPost)
        }
      })
      lastFetchTime.value = new Date().toISOString()
    }
  } catch {}
}

function onNewPost(post) {
  const exists = posts.value.find(p => p.id === post.id)
  if (!exists) posts.value.unshift(post)
}

function onPostCreated(post) {
  const exists = posts.value.find(p => p.id === post.id)
  if (!exists) posts.value.unshift(post)
}

function handlePostCreated(post) {
  onPostCreated(post)
  showCreatePostModal.value = false
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
    if (updated.isArchived) posts.value.splice(idx, 1)
    else Object.assign(posts.value[idx], updated)
  }
}

let pollInterval = null

onMounted(async () => {
  await fetchPosts(true)
  on('post:new', onNewPost)
  pollInterval = setInterval(pollNewPosts, 3000)
  document.addEventListener('click', closeMenu)
  
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) fetchPosts()
  }, { threshold: 0.1 })
  
  if (loadMore.value) observer.observe(loadMore.value)
  if (route.query.post) scrollToPost(route.query.post)
})

onUnmounted(() => {
  observer?.disconnect()
  off('post:new', onNewPost)
  document.removeEventListener('click', closeMenu)
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.feed-page {
  min-height: 100vh;
  padding-left: var(--sidebar-width);
  padding-bottom: 20px;
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg);
  color: var(--text-primary);
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.action-btn:active {
  transform: scale(0.85);
  background: var(--glass-bg-active);
}

.action-btn svg {
  width: 22px;
  height: 22px;
}

.menu-wrap {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: rgba(28, 28, 30, 0.92);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 6px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  color: var(--text-primary);
  transition: background var(--transition-fast);
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item svg {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.dropdown-item.danger {
  color: var(--danger);
}

.dropdown-item.danger svg {
  color: var(--danger);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.stories-section {
  padding: 0 0 16px;
  overflow: hidden;
  width: 100%;
}

.stories-list {
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%;
  justify-content: space-around;
}

.stories-list::-webkit-scrollbar {
  display: none;
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.story-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  padding: 3px;
  background: var(--glass-bg);
  position: relative;
  flex-shrink: 0;
}

.story-avatar.has-story {
  background: linear-gradient(135deg, #4a4a4a, #6a6a6a, #8a8a8a, #6a6a6a, #4a4a4a);
}

.story-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--bg-primary);
}

.my-story .story-avatar {
  background: var(--glass-bg);
}

.add-story-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary);
}

.add-story-btn svg {
  width: 12px;
  height: 12px;
  color: white;
}

.story-name {
  font-size: 11px;
  color: var(--text-secondary);
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.stories-card {
  max-width: 600px;
  margin: 0 auto 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.stories-card-inner {
  padding: 16px;
  overflow: hidden;
}

.stories-card-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.stories-card-list::-webkit-scrollbar {
  display: none;
}

.story-card {
  flex-shrink: 0;
  width: 100px;
  height: 160px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: var(--glass-bg);
}

.story-card-preview {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.story-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.3);
}

.story-card-avatar {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 2px;
  background: var(--glass-bg);
}

.story-card-avatar.has-story {
  background: linear-gradient(135deg, #4a4a4a, #6a6a6a, #8a8a8a, #6a6a6a, #4a4a4a);
}

.story-card-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bg-primary);
}

.my-story-card .story-card-avatar {
  background: var(--glass-bg);
}

.my-story-card .add-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-primary);
}

.my-story-card .add-btn svg {
  width: 10px;
  height: 10px;
  color: white;
}

.story-card-name {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-post-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-top: 1px solid var(--glass-border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.create-post-bar:hover {
  background: var(--glass-bg-hover);
}

.create-post-bar svg {
  width: 20px;
  height: 20px;
}

.create-post-bar span {
  font-size: 14px;
  font-weight: 500;
}

.feed-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner-lg {
  width: 32px;
  height: 32px;
  border: 2px solid var(--glass-border);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--glass-border);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-secondary);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.mobile-only {
  display: none;
}

.desktop-only {
  display: block;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 400px;
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background var(--transition-fast);
}

.close-btn:hover {
  background: var(--glass-bg-hover);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  color: var(--text-secondary);
}

.center-text {
  text-align: center;
  padding: 20px 0;
}

.media-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.viewer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.viewer-close svg {
  width: 24px;
  height: 24px;
}

.viewer-content {
  max-width: 90vw;
  max-height: 90vh;
}

.viewer-content img,
.viewer-content video {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .modal,
.modal-enter-active .glass-modal,
.modal-leave-active .modal,
.modal-leave-active .glass-modal {
  transition: transform 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-enter-from .glass-modal {
  transform: scale(0.95);
}

.modal-leave-to .modal,
.modal-leave-to .glass-modal {
  transform: scale(0.95);
}

.post-enter-active,
.post-leave-active {
  transition: all 0.15s ease;
}

.post-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.post-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.highlight-post {
  animation: highlight 2s ease;
}

@keyframes highlight {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 0 2px var(--link); }
}

@media (max-width: 768px) {
  .feed-page {
    padding-left: 0;
    padding-bottom: 80px;
  }

  .mobile-only {
    display: flex;
  }

  .desktop-only {
    display: none !important;
  }

  .feed-content {
    padding: 0 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }
}

[data-theme="light"] .feed-header {
  background: var(--bg-primary);
}

[data-theme="light"] .story-avatar img {
  border-color: var(--bg-primary);
}

[data-theme="light"] .story-card-avatar img {
  border-color: var(--bg-primary);
}

[data-theme="light"] .add-story-btn,
[data-theme="light"] .my-story-card .add-btn {
  border-color: var(--bg-primary);
}

[data-theme="light"] .modal-overlay {
  background: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .dropdown-menu {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

[data-theme="light"] .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>
