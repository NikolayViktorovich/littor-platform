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
        />
      </TransitionGroup>
      
      <div v-if="!loading && !posts.length" class="empty-state glass">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3>Пока нет записей</h3>
        <p>Напишите что-нибудь первым!</p>
      </div>
      
      <div v-if="hasMore" ref="loadMore" class="load-more">
        <div v-if="loading" class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const notifications = useNotificationsStore()
const posts = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const loadMore = ref(null)
let observer

async function fetchPosts() {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  try {
    const res = await api.get('/posts', { params: { page: page.value, limit: 10 } })
    posts.value.push(...res.data.posts)
    hasMore.value = res.data.hasMore
    page.value++
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}

function addPost(post) {
  posts.value.unshift(post)
}

async function deletePost(id) {
  try {
    await api.delete(`/posts/${id}`)
    posts.value = posts.value.filter(p => p.id !== id)
    notifications.success('Запись удалена')
  } catch (err) {
    notifications.error(err.message)
  }
}

function updatePost(updated) {
  const idx = posts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) posts.value[idx] = updated
}

onMounted(() => {
  fetchPosts()
  
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) fetchPosts()
  }, { threshold: 0.1 })
  
  if (loadMore.value) observer.observe(loadMore.value)
})

onUnmounted(() => observer?.disconnect())
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
  background: rgba(255, 255, 255, 0.08);
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
</style>
