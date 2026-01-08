<template>
  <article class="post glass" :class="{ 'menu-open': menuOpen }">
    <div class="post-header">
      <router-link :to="`/profile/${post.author.id}`" class="post-author">
        <img :src="authorAvatar" class="avatar" alt="" @error="handleAvatarError">
        <div class="author-info">
          <span class="author-name">{{ post.author.name }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </router-link>
      
      <div class="post-menu-wrap">
        <button @click.stop="toggleMenu" class="post-menu-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="18" r="1.5"/>
          </svg>
        </button>
        
        <Transition name="menu" @after-leave="menuOpen = false">
          <div v-if="showMenu" class="post-dropdown glass-modal" v-click-outside="closeMenu">
            <button class="dropdown-item" v-if="isOwner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 4v6l-2 4v2h10v-2l-2-4V4"/>
                <line x1="12" y1="16" x2="12" y2="21"/>
                <line x1="8" y1="4" x2="16" y2="4"/>
              </svg>
              Закрепить
            </button>
            <button class="dropdown-item" v-if="isOwner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M9 9h6"/>
              </svg>
              Отключить комментарии
            </button>
            <button @click="copyLink" class="dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Скопировать ссылку
            </button>
            
            <template v-if="isOwner">
              <div class="dropdown-divider"></div>
              <button class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 8v13H3V8"/>
                  <path d="M1 3h22v5H1z"/>
                  <path d="M10 12h4"/>
                </svg>
                Архивировать
              </button>
              <button @click="handleDelete" class="dropdown-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 6h18"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                </svg>
                Удалить
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <p v-if="post.content" class="post-content">{{ post.content }}</p>
    
    <div v-if="post.image" class="post-image-wrap">
      <img :src="postImage" class="post-image" alt="" @error="handleImageError" @load="imageLoaded = true">
      <div v-if="!imageLoaded" class="image-placeholder skeleton"></div>
    </div>

    <div class="post-stats" v-if="post.commentsCount">
      <span class="stat-item">{{ post.commentsCount }} комментариев</span>
    </div>

    <div class="post-actions">
      <button @click="handleLike" class="action-btn" :class="{ active: post.isLiked, pressed: likePressed }">
        <svg viewBox="0 0 24 24" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span v-if="post.likesCount" class="count">{{ formatCount(post.likesCount) }}</span>
      </button>
      
      <button @click="handleComment" class="action-btn" :class="{ active: showComments, pressed: commentPressed }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>

      <button @click="handleShare" class="action-btn" :class="{ pressed: sharePressed }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>

    <Transition name="comments">
      <div v-if="showComments" class="comments-section">
        <div v-if="loadingComments" class="comments-loading">
          <div class="spinner"></div>
        </div>
        
        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment">
            <router-link :to="`/profile/${comment.author.id}`">
              <img :src="getAvatarUrl(comment.author.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            </router-link>
            <div class="comment-body">
              <router-link :to="`/profile/${comment.author.id}`" class="comment-author">
                {{ comment.author.name }}
              </router-link>
              <p>{{ comment.content }}</p>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="addComment" class="comment-form">
          <input v-model="newComment" placeholder="Написать комментарий..." required>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="!newComment.trim()">
            Отправить
          </button>
        </form>
      </div>
    </Transition>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const props = defineProps({
  post: { type: Object, required: true }
})

const emit = defineEmits(['delete', 'update'])

const authStore = useAuthStore()
const showComments = ref(false)
const showMenu = ref(false)
const menuOpen = ref(false)
const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const imageLoaded = ref(false)
const likePressed = ref(false)
const commentPressed = ref(false)
const sharePressed = ref(false)

const isOwner = computed(() => authStore.user?.id === props.post.author.id)
const authorAvatar = computed(() => getAvatarUrl(props.post.author.avatar))
const postImage = computed(() => {
  const img = props.post.image
  if (!img) return null
  return img
})

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function handleImageError(e) { e.target.style.display = 'none' }

function toggleMenu() {
  if (!showMenu.value) {
    menuOpen.value = true
    showMenu.value = true
  } else {
    showMenu.value = false
  }
}

function closeMenu() {
  showMenu.value = false
}

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

function formatCount(num) {
  if (!num) return ''
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'М'
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'К'
  return num.toString()
}

function handleDelete() {
  showMenu.value = false
  emit('delete', props.post.id)
}

function copyLink() {
  const url = `${window.location.origin}/post/${props.post.id}`
  navigator.clipboard.writeText(url)
  showMenu.value = false
}

async function toggleLike() {
  try {
    const res = await api.post(`/posts/${props.post.id}/like`)
    emit('update', { ...props.post, isLiked: res.data.liked, likesCount: res.data.likesCount })
  } catch {}
}

async function handleLike() {
  likePressed.value = true
  setTimeout(() => likePressed.value = false, 150)
  await toggleLike()
}

function handleComment() {
  commentPressed.value = true
  setTimeout(() => commentPressed.value = false, 150)
  showComments.value = !showComments.value
}

function handleShare() {
  sharePressed.value = true
  setTimeout(() => sharePressed.value = false, 150)
}

async function loadComments() {
  loadingComments.value = true
  try {
    const res = await api.get(`/posts/${props.post.id}/comments`)
    comments.value = res.data
  } catch {}
  loadingComments.value = false
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

watch(showComments, (val) => {
  if (val && comments.value.length === 0) loadComments()
})

// Custom directive for click outside
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped>
.post {
  padding: 20px;
  position: relative;
  overflow: visible !important;
}

.post.menu-open {
  z-index: 60;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.post-author {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  font-size: 15px;
  transition: color var(--transition);
}

.post-author:hover .author-name {
  color: rgba(255, 255, 255, 0.7);
}

.post-time {
  font-size: 13px;
  color: var(--text-muted);
}

.post-menu-wrap {
  position: relative;
  z-index: 50;
}

.post-menu-btn {
  color: rgba(255, 255, 255, 0.4);
  padding: 8px;
  border-radius: 50%;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.post-menu-btn svg {
  width: 18px;
  height: 18px;
}

.post-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 200px;
  padding: 6px;
  z-index: 100;
  will-change: transform, opacity;
  transform: translateZ(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all var(--transition);
  text-align: left;
  justify-content: flex-start;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: rgba(255, 100, 100, 0.9);
}

.dropdown-item.danger:hover {
  color: #ff5555;
  background: rgba(255, 80, 80, 0.1);
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.dropdown-item:hover svg {
  color: rgba(255, 255, 255, 0.7);
}

.dropdown-item.danger svg {
  color: rgba(255, 100, 100, 0.7);
}

.dropdown-item.danger:hover svg {
  color: #ff5555;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 6px 0;
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 14px;
}

.post-image-wrap {
  position: relative;
  margin-bottom: 14px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  display: block;
}

.image-placeholder {
  width: 100%;
  height: 300px;
}

.post-stats {
  display: flex;
  gap: 16px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: var(--text-muted);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.action-btn:hover {
  color: var(--text-secondary);
}

.action-btn.active {
  color: var(--text-primary);
}

.action-btn.pressed {
  transform: scale(0.85);
}

.action-btn svg {
  width: 22px;
  height: 22px;
  transition: transform 0.15s ease;
}

.action-btn .count {
  font-size: 13px;
  color: inherit;
}

.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.comments-loading {
  display: flex;
  justify-content: center;
  padding: 20px;
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

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.comment {
  display: flex;
  gap: 10px;
}

.comment-body {
  background: transparent;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  flex: 1;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
  transition: color var(--transition);
}

.comment-author:hover {
  color: rgba(255, 255, 255, 0.7);
}

.comment-body p {
  font-size: 14px;
  margin-top: 4px;
  color: var(--text-secondary);
}

.comment-form {
  display: flex;
  gap: 10px;
}

.comment-form input {
  flex: 1;
  border-radius: var(--radius-full);
  padding: 10px 16px;
}

.menu-enter-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.menu-leave-active {
  transition: opacity 0.1s ease-in, transform 0.1s ease-in;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateZ(0) translateY(-4px) scale(0.98);
}

.comments-enter-active {
  transition: opacity 0.2s ease-out;
}

.comments-leave-active {
  transition: opacity 0.15s ease-in;
}

.comments-enter-from,
.comments-leave-to {
  opacity: 0;
}
</style>
