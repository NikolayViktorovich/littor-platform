<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="message-toast glass-modal" @click="handleClick(toast)">
        <img :src="toast.avatar || '/default-avatar.svg'" class="avatar avatar-sm" alt="" @error="e => e.target.src = '/default-avatar.svg'">
        <div class="toast-content">
          <span class="toast-name">{{ toast.name }}</span>
          <p class="toast-text">{{ toast.text }}</p>
        </div>
        <button @click.stop="reply(toast)" class="reply-btn">Ответить</button>
        <button @click.stop="dismiss(toast.id)" class="close-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { currentChatUserId } from '../stores/chat'
import api from '../api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toasts = ref([])
let pollInterval = null
let lastMessageIds = new Set()

function getCurrentChatUserId() {
  if (route.name === 'chat' && route.params.id) {
    return route.params.id
  }
  if (currentChatUserId.value) {
    return currentChatUserId.value
  }
  return null
}

async function checkNewMessages() {
  if (!authStore.isAuthenticated) return
  try {
    const res = await api.get('/messages/recent')
    const activeChatUserId = getCurrentChatUserId()
    
    for (const msg of res.data) {
      if (!lastMessageIds.has(msg.id) && msg.senderId !== authStore.user?.id) {
        lastMessageIds.add(msg.id)
        
        if (activeChatUserId === msg.senderId) continue
        
        toasts.value.push({
          id: msg.id,
          userId: msg.senderId,
          name: msg.senderName,
          avatar: msg.senderAvatar,
          text: msg.content || getMediaText(msg.mediaType)
        })
        setTimeout(() => dismiss(msg.id), 5000)
      }
    }
  } catch {}
}

function getMediaText(type) {
  if (type === 'image') return '📷 Фото'
  if (type === 'video') return '🎬 Видео'
  if (type === 'voice') return '🎤 Голосовое'
  if (type === 'circle') return '⭕ Кружок'
  return 'Новое сообщение'
}

function handleClick(toast) {
  router.push(`/messages/${toast.userId}`)
  dismiss(toast.id)
}

function reply(toast) {
  router.push(`/messages/${toast.userId}`)
  dismiss(toast.id)
}

function dismiss(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

onMounted(() => {
  pollInterval = setInterval(checkNewMessages, 3000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; max-width: 360px; }
.message-toast { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; animation: slideIn 0.2s ease; }
.toast-content { flex: 1; min-width: 0; }
.toast-name { font-weight: 600; font-size: 14px; display: block; margin-bottom: 2px; }
.toast-text { font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-btn { padding: 6px 12px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); font-size: 13px; font-weight: 500; color: var(--text-primary); transition: all var(--transition); flex-shrink: 0; }
.reply-btn:hover { background: rgba(255,255,255,0.12); }
.close-toast { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
.close-toast svg { width: 14px; height: 14px; }
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100px); }
.toast-leave-to { opacity: 0; transform: translateX(100px); }
@keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 768px) {
  .toast-container { display: none; }
}
</style>
