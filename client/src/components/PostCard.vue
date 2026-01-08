<template>
  <article class="post card">
    <div class="post-header">
      <router-link :to="`/profile/${post.author.id}`" class="post-author">
        <img :src="post.author.avatar || '/default-avatar.svg'" class="avatar" alt="">
        <div>
          <span class="author-name">{{ post.author.name }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </router-link>
      <button v-if="isOwner" @click="$emit('delete', post.id)" class="post-menu">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    </div>

    <p class="post-content">{{ post.content }}</p>
    
    <img v-if="post.image" :src="post.image" class="post-image" alt="">

    <div class="post-actions">
      <button @click="toggleLike" class="action-btn" :class="{ liked: post.isLiked }">
        <svg viewBox="0 0 24 24" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span v-if="post.likesCount">{{ post.likesCount }}</span>
      </button>
      <button @click="showComments = !showComments" class="action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span v-if="post.commentsCount">{{ post.commentsCount }}</span>
      </button>
    </div>

    <div v-if="showComments" class="comments-section">
      <div v-for="comment in comments" :key="comment.id" class="comment">
        <router-link :to="`/profile/${comment.author.id}`">
          <img :src="comment.author.avatar || '/default-avatar.svg'" class="avatar avatar-sm" alt="">
        </router-link>
        <div class="comment-body">
          <router-link :to="`/profile/${comment.author.id}`" class="comment-author">
            {{ comment.author.name }}
          </router-link>
          <p>{{ comment.content }}</p>
        </div>
      </div>
      
      <form @submit.prevent="addComment" class="comment-form">
        <input v-model="newComment" placeholder="Написать комментарий..." required>
        <button type="submit" class="btn btn-primary btn-sm">Отправить</button>
      </form>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const props = defineProps({
  post: { type: Object, required: true }
})

const emit = defineEmits(['delete', 'update'])

const authStore = useAuthStore()
const showComments = ref(false)
const comments = ref([])
const newComment = ref('')

const isOwner = computed(() => authStore.user?.id === props.post.author.id)

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000

  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  if (diff < 604800) return `${Math.floor(diff / 86400)} д`
  
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

async function toggleLike() {
  try {
    const res = await api.post(`/posts/${props.post.id}/like`)
    emit('update', { ...props.post, isLiked: res.data.liked, likesCount: res.data.likesCount })
  } catch {}
}

async function loadComments() {
  try {
    const res = await api.get(`/posts/${props.post.id}/comments`)
    comments.value = res.data
  } catch {}
}

async function addComment() {
  if (!newComment.value.trim()) return
  try {
    const res = await api.post(`/posts/${props.post.id}/comments`, { content: newComment.value })
    comments.value.push(res.data)
    newComment.value = ''
    emit('update', { ...props.post, commentsCount: props.post.commentsCount + 1 })
  } catch {}
}

// Load comments when section opens
import { watch } from 'vue'
watch(showComments, (val) => {
  if (val && comments.value.length === 0) loadComments()
})
</script>

<style scoped>
.post {
  padding: 16px;
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-author {
  display: flex;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.author-name {
  font-weight: 500;
  display: block;
}

.post-time {
  font-size: 13px;
  color: var(--text-muted);
}

.post-menu {
  background: none;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
}

.post-menu:hover {
  background: var(--bg-hover);
  color: var(--danger);
}

.post-menu svg {
  width: 20px;
  height: 20px;
}

.post-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 12px;
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: var(--radius);
  margin-bottom: 12px;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.action-btn.liked {
  color: var(--danger);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.comment {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-body {
  background: var(--bg-hover);
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  flex: 1;
}

.comment-author {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-primary);
}

.comment-body p {
  font-size: 14px;
  margin-top: 2px;
}

.comment-form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.comment-form input {
  flex: 1;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
