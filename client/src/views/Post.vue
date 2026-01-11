<template>
  <div class="post-view">
    <header class="post-view-header glass">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>{{ t('post') }}</h1>
    </header>
    
    <main class="post-view-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadPost" class="retry-btn">{{ t('retry') }}</button>
      </div>
      
      <PostCard 
        v-else-if="post" 
        :post="post" 
        @delete="handleDelete"
        @update="handleUpdate"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../i18n'
import PostCard from '../components/PostCard.vue'
import api from '../api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const post = ref(null)
const loading = ref(true)
const error = ref(null)

async function loadPost() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/posts/${route.params.id}`)
    post.value = res.data
  } catch (err) {
    error.value = err.response?.data?.error || t('postNotFound')
  }
  loading.value = false
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function handleDelete() {
  router.push('/')
}

function handleUpdate(updatedPost) {
  post.value = updatedPost
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-left: var(--sidebar-width);
}

.post-view-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(20, 20, 22, 0.85);
  backdrop-filter: blur(50px) saturate(180%);
  -webkit-backdrop-filter: blur(50px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.post-view-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.back-btn:active {
  transform: scale(0.85);
  background: rgba(255, 255, 255, 0.15);
}

.back-btn svg {
  width: 20px;
  height: 20px;
  color: var(--text-primary);
}

.post-view-content {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-state p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.retry-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.retry-btn:active {
  transform: scale(0.95);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .post-view {
    padding-left: 0;
    padding-bottom: 80px;
  }
}

[data-theme="light"] .post-view-header {
  background: rgba(255, 255, 255, 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .back-btn {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .back-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .back-btn svg {
  color: var(--text-primary);
}
</style>
