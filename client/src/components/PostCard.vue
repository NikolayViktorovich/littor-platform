<template>
  <article class="post glass" :class="{ 'menu-open': menuOpen, 'pinned': post.isPinned && !hidePin }">
    <div v-if="post.isPinned && !hidePin" class="pinned-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/>
      </svg>
      Закреплено
    </div>
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
            <button @click="handlePin" class="dropdown-item" v-if="isOwner && !hidePin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/>
              </svg>
              {{ post.isPinned ? 'Открепить' : 'Закрепить' }}
            </button>
            <button @click="handleToggleComments" class="dropdown-item" v-if="isOwner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M9 9h6"/>
              </svg>
              {{ post.commentsDisabled ? 'Включить комментарии' : 'Отключить комментарии' }}
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
              <button @click="handleArchive" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 8v13H3V8"/>
                  <path d="M1 3h22v5H1z"/>
                  <path d="M10 12h4"/>
                </svg>
                {{ post.isArchived ? 'Разархивировать' : 'Архивировать' }}
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
    
    <div v-if="post.image" class="post-image-wrap" @click="openMedia">
      <img :src="postImage" class="post-image" alt="" @error="handleImageError" @load="imageLoaded = true">
      <video v-if="isVideo" :src="postImage" class="post-image post-video" controls @click.stop></video>
      <div v-if="!imageLoaded && !isVideo" class="image-placeholder skeleton"></div>
    </div>

    <div class="post-actions">
      <button @click="handleLike" class="action-btn" :class="{ active: post.isLiked, pressed: likePressed }">
        <svg viewBox="0 0 24 24" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span v-if="post.likesCount" class="count">{{ formatCount(post.likesCount) }}</span>
      </button>
      
      <button @click="handleComment" class="action-btn" :class="{ active: showComments, pressed: commentPressed, disabled: post.commentsDisabled }" :disabled="post.commentsDisabled">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span v-if="post.commentsCount" class="count">{{ formatCount(post.commentsCount) }}</span>
      </button>

      <button @click="handleShare" class="action-btn" :class="{ pressed: sharePressed }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
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
            <router-link :to="`/profile/${comment.author.id}`" class="comment-avatar">
              <img :src="getAvatarUrl(comment.author.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            </router-link>
            <div class="comment-body">
              <div class="comment-header">
                <router-link :to="`/profile/${comment.author.id}`" class="comment-author">
                  {{ comment.author.name }}
                </router-link>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <button class="comment-action" :class="{ active: comment.isLiked }" @click="likeComment(comment)">
                  <svg viewBox="0 0 24 24" :fill="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  <span v-if="comment.likesCount">{{ formatCount(comment.likesCount) }}</span>
                </button>
                <button class="comment-action" @click="startReply(comment)">Ответить</button>
                <button v-if="canDeleteComment(comment)" class="comment-action delete" @click="deleteComment(comment)">Удалить</button>
              </div>
              
              <div v-if="comment.replies?.length" class="replies">
                <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
                  <router-link :to="`/profile/${reply.author.id}`" class="comment-avatar">
                    <img :src="getAvatarUrl(reply.author.avatar)" class="avatar avatar-xs" alt="" @error="handleAvatarError">
                  </router-link>
                  <div class="comment-body">
                    <div class="comment-header">
                      <router-link :to="`/profile/${reply.author.id}`" class="comment-author">
                        {{ reply.author.name }}
                      </router-link>
                      <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ reply.content }}</p>
                    <div class="comment-actions">
                      <button class="comment-action" :class="{ active: reply.isLiked }" @click="likeComment(reply)">
                        <svg viewBox="0 0 24 24" :fill="reply.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span v-if="reply.likesCount">{{ formatCount(reply.likesCount) }}</span>
                      </button>
                      <button class="comment-action" @click="startReply(reply, comment)">Ответить</button>
                      <button v-if="canDeleteComment(reply)" class="comment-action delete" @click="deleteReply(comment, reply)">Удалить</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="addComment" class="comment-form" :class="{ 'reply-mode': isReplyMode }">
          <div class="comment-input-wrap">
            <input v-model="newComment" :placeholder="replyingTo ? `Ответ для ${replyingTo.author.name}...` : 'Написать комментарий...'" required ref="commentInput">
            <EmojiPicker @select="insertCommentEmoji" class="comment-emoji" />
            <button v-if="!replyingTo" type="submit" class="inside-btn send-inside" :disabled="!newComment.trim()" key="send-inside">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button v-else type="button" class="inside-btn cancel-inside" @click="cancelReply" key="cancel-inside">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="outside-btn-wrap">
            <button type="submit" class="outside-btn" :disabled="!newComment.trim()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </article>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../socket'
import EmojiPicker from './EmojiPicker.vue'
import api from '../api'

const props = defineProps({
  post: { type: Object, required: true },
  hidePin: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'update', 'open-media'])

const authStore = useAuthStore()
const { on, off, joinPost, leavePost } = useSocket()
const showComments = ref(false)
const showMenu = ref(false)
const menuOpen = ref(false)
const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const replyingTo = ref(null)
const replyingToParentId = ref(null)
const isReplyMode = ref(false)
const imageLoaded = ref(false)
const likePressed = ref(false)
const commentPressed = ref(false)
const sharePressed = ref(false)
const commentInput = ref(null)

function insertCommentEmoji(emoji) {
  const input = commentInput.value
  if (input) {
    const start = input.selectionStart
    const end = input.selectionEnd
    newComment.value = newComment.value.substring(0, start) + emoji + newComment.value.substring(end)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  } else {
    newComment.value += emoji
  }
}

const isOwner = computed(() => authStore.user?.id === props.post.author.id)
const authorAvatar = computed(() => getAvatarUrl(props.post.author.avatar))
const postImage = computed(() => {
  const img = props.post.image
  if (!img) return null
  return img
})

const isVideo = computed(() => {
  const img = props.post.image
  if (!img) return false
  return img.match(/\.(mp4|webm|mov)$/i)
})

function openMedia() {
  if (isVideo.value) return
  emit('open-media', props.post.image, 'image', 0, [{ src: props.post.image, type: 'image' }])
}

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

async function handlePin() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/pin`)
    emit('update', { ...props.post, isPinned: res.data.isPinned })
  } catch {}
}

async function handleArchive() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/archive`)
    emit('update', { ...props.post, isArchived: res.data.isArchived })
  } catch {}
}

async function handleToggleComments() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/comments-toggle`)
    emit('update', { ...props.post, commentsDisabled: res.data.commentsDisabled })
  } catch {}
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
    const payload = { content: newComment.value }
    if (replyingToParentId.value) {
      payload.parentId = replyingToParentId.value
    }
    const res = await api.post(`/posts/${props.post.id}/comments`, payload)
    
    if (replyingToParentId.value) {
      const parent = comments.value.find(c => c.id === replyingToParentId.value)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(res.data)
      }
      replyingTo.value = null
      replyingToParentId.value = null
      isReplyMode.value = false
    } else {
      comments.value.push(res.data)
    }
    newComment.value = ''
    emit('update', { ...props.post, commentsCount: props.post.commentsCount + 1 })
  } catch {}
}

async function likeComment(comment) {
  try {
    const res = await api.post(`/posts/comments/${comment.id}/like`)
    comment.isLiked = res.data.liked
    comment.likesCount = res.data.likesCount
  } catch {}
}

function canDeleteComment(comment) {
  return comment.author.id === authStore.user?.id || isOwner.value
}

async function deleteComment(comment) {
  try {
    await api.delete(`/posts/comments/${comment.id}`)
    const idx = comments.value.findIndex(c => c.id === comment.id)
    if (idx !== -1) {
      const repliesCount = comment.replies?.length || 0
      comments.value.splice(idx, 1)
      emit('update', { ...props.post, commentsCount: props.post.commentsCount - 1 - repliesCount })
    }
  } catch {}
}

async function deleteReply(parentComment, reply) {
  try {
    await api.delete(`/posts/comments/${reply.id}`)
    const idx = parentComment.replies.findIndex(r => r.id === reply.id)
    if (idx !== -1) {
      parentComment.replies.splice(idx, 1)
      emit('update', { ...props.post, commentsCount: props.post.commentsCount - 1 })
    }
  } catch {}
}

function startReply(comment, parentComment = null) {
  replyingTo.value = comment
  replyingToParentId.value = parentComment ? parentComment.id : comment.id
  isReplyMode.value = true
}

function cancelReply() {
  replyingTo.value = null
  replyingToParentId.value = null
  isReplyMode.value = false
}

function onReplyTransitionEnd() {
  // не нужно больше
}

watch(showComments, (val) => {
  if (val && comments.value.length === 0) loadComments()
})

// Socket event handlers
function onPostLike(data) {
  if (data.postId === props.post.id && data.userId !== authStore.user?.id) {
    emit('update', { ...props.post, likesCount: data.likesCount })
  }
}

function onPostComment(data) {
  if (data.postId === props.post.id && data.comment.author.id !== authStore.user?.id) {
    if (data.comment.parentId) {
      const parent = comments.value.find(c => c.id === data.comment.parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(data.comment)
      }
    } else {
      comments.value.push(data.comment)
    }
    emit('update', { ...props.post, commentsCount: props.post.commentsCount + 1 })
  }
}

// Poll for new comments when comments section is open
async function pollComments() {
  if (!showComments.value) return
  try {
    const res = await api.get(`/posts/${props.post.id}/comments`)
    const newCommentIds = new Set(res.data.map(c => c.id))
    const newReplyIds = new Set()
    res.data.forEach(c => c.replies?.forEach(r => newReplyIds.add(r.id)))
    
    // Remove deleted comments
    comments.value = comments.value.filter(c => newCommentIds.has(c.id))
    
    // Update existing and add new comments
    res.data.forEach(newComment => {
      const existing = comments.value.find(c => c.id === newComment.id)
      if (existing) {
        existing.likesCount = newComment.likesCount
        existing.isLiked = newComment.isLiked
        // Remove deleted replies
        if (existing.replies) {
          existing.replies = existing.replies.filter(r => newReplyIds.has(r.id))
        }
        // Update/add replies
        if (newComment.replies) {
          newComment.replies.forEach(newReply => {
            const existingReply = existing.replies?.find(r => r.id === newReply.id)
            if (existingReply) {
              existingReply.likesCount = newReply.likesCount
              existingReply.isLiked = newReply.isLiked
            } else {
              if (!existing.replies) existing.replies = []
              existing.replies.push(newReply)
            }
          })
        }
      } else {
        comments.value.push(newComment)
      }
    })
  } catch {}
}

let commentsPollInterval = null

onMounted(() => {
  joinPost(props.post.id)
  on('post:like', onPostLike)
  on('post:comment', onPostComment)
  commentsPollInterval = setInterval(pollComments, 2)
})

onUnmounted(() => {
  leavePost(props.post.id)
  off('post:like', onPostLike)
  off('post:comment', onPostComment)
  if (commentsPollInterval) clearInterval(commentsPollInterval)
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

.post.pinned {
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.pinned-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pinned-badge svg {
  width: 14px;
  height: 14px;
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
  background: rgba(255, 255, 255, 0.05);
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
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: rgba(255, 100, 100, 0.9);
}

.dropdown-item.danger:hover {
  color: #ff5555;
  background: rgba(255, 80, 80, 0.05);
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
  background: rgba(255, 255, 255, 0.02);
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.post-video {
  cursor: default;
}

.post-image-wrap img + video {
  display: none;
}

.post-image-wrap:has(video) img {
  display: none;
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

.action-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  gap: 12px;
  align-items: flex-start;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  transition: color var(--transition);
}

.comment-author:hover {
  color: rgba(255, 255, 255, 0.7);
}

.comment-time {
  font-size: 13px;
  color: var(--text-muted);
}

.comment-text {
  font-size: 15px;
  line-height: 1.4;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  transition: color var(--transition);
}

.comment-action:hover {
  color: var(--text-secondary);
}

.comment-action svg {
  width: 16px;
  height: 16px;
}

.comment-action.active {
  color: var(--text-primary);
}

.comment-action.delete {
  color: rgba(255, 100, 100, 0.7);
}

.comment-action.delete:hover {
  color: #ff5555;
}

.replies {
  margin-top: 12px;
  padding-left: 8px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.reply {
  margin-top: 12px;
}

.avatar-xs {
  width: 28px;
  height: 28px;
}

.cancel-reply {
  color: var(--text-muted);
  padding: 8px;
  font-size: 14px;
  transition: color var(--transition);
}

.cancel-reply:hover {
  color: var(--text-primary);
}

.comment-form {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.comment-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.comment-input-wrap input {
  width: 100%;
  border-radius: var(--radius-full);
  padding: 10px 16px;
  padding-right: 80px;
}

.comment-emoji {
  position: absolute;
  right: 44px;
}

.comment-emoji :deep(.emoji-picker) {
  bottom: 100%;
  right: -38px;
}

.inside-btn {
  position: absolute;
  right: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.inside-btn svg {
  width: 16px;
  height: 16px;
}

.send-inside {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.send-inside:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.send-inside:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.cancel-inside {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  animation: morph-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-inside:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.outside-btn-wrap {
  width: 0;
  overflow: hidden;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.comment-form.reply-mode .outside-btn-wrap {
  width: 36px;
}

.outside-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s ease, opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.outside-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.outside-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.outside-btn svg {
  width: 18px;
  height: 18px;
}

/* Smooth morph animations */
@keyframes morph-in {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.liquid-out-enter-active {
  animation: liquid-emerge 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-out-leave-active {
  animation: liquid-merge 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes liquid-emerge {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes liquid-merge {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
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
