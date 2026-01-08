<template>
  <div class="feed-page">
    <div class="feed-header">
      <div class="liquid-tabs">
        <button class="liquid-tab active">Для вас</button>
        <button class="liquid-tab">Подписки</button>
      </div>
    </div>

    <div class="feed-content">
      <CreatePost @created="addPost" />
      
      <div v-if="loading && !posts.length" class="loading-state">
        <div class="spinner-lg"></div>
        <p>Загрузка...</p>
      </div>
      
      <TransitionGroup name="post" tag="div" class="posts-list">
        <PostCard 
          v-for="post in posts" 
          :key="post.id" 
          :post="post"
          @delete="deletePost"
          @update="updatePost"
          @open-media="openMedia"
        />
      </TransitionGroup>
      
      <div v-if="!loading && !posts.length" class="empty-state glass">
        <h3>Пока нет записей</h3>
        <p>Напишите что-нибудь первым!</p>
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
import { ref, onMounted, onUnmounted } from 'vue'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import { useNotificationsStore } from '../stores/notifications'
import { cache } from '../stores/cache'
import api from '../api'

const notifications = useNotificationsStore()
const posts = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const loadMore = ref(null)
let observer
let pollInterval = null

const showMediaViewer = ref(false)
const mediaViewerSrc = ref('')
const mediaViewerType = ref('image')

function openMedia(src, type) { mediaViewerSrc.value = src; mediaViewerType.value = type; showMediaViewer.value = true }
function closeMedia() { showMediaViewer.value = false }

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
  try {
    const res = await api.get('/posts', { params: { page: 1, limit: 5 } })
    const newPosts = res.data.posts
    
    // Check for new posts that we don't have
    for (const newPost of newPosts) {
      const exists = posts.value.find(p => p.id === newPost.id)
      if (!exists) {
        posts.value.unshift(newPost)
      } else {
        // Update existing post (likes, comments count)
        const idx = posts.value.findIndex(p => p.id === newPost.id)
        if (idx !== -1) {
          posts.value[idx] = { ...posts.value[idx], likesCount: newPost.likesCount, commentsCount: newPost.commentsCount }
        }
      }
    }
  } catch {}
}

function addPost(post) {
  posts.value.unshift(post)
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
    posts.value[idx] = updated
  }
}

onMounted(() => {
  fetchPosts(true)
  
  // Poll for new posts every 5 seconds
  pollInterval = setInterval(pollNewPosts, 5000)
  
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) fetchPosts()
  }, { threshold: 0.1 })
  
  if (loadMore.value) observer.observe(loadMore.value)
})

onUnmounted(() => {
  observer?.disconnect()
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.feed-page {
  min-height: 100vh;
  padding: 20px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.feed-header {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  position: sticky;
  top: 20px;
  z-index: 50;
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
  }
}

.media-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; display: flex; align-items: center; justify-content: center; }
.viewer-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; z-index: 10; }
.viewer-close:hover { background: rgba(255,255,255,0.1); }
.viewer-close svg { width: 24px; height: 24px; }
.viewer-content img, .viewer-content video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
