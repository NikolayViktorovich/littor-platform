<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="dialogs-sidebar glass">
        <div class="sidebar-header">
          <h2>Диалоги</h2>
        </div>

        <div class="dialogs-list">
          <router-link 
            v-for="dialog in dialogs" 
            :key="dialog.user.id"
            :to="`/messages/${dialog.user.id}`"
            class="dialog-item"
            :class="{ active: dialog.user.id === route.params.id }"
          >
            <img :src="getAvatarUrl(dialog.user.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            <div class="dialog-info">
              <span class="dialog-name">{{ dialog.user.name }}</span>
              <span class="dialog-preview">{{ dialog.lastMessage?.content }}</span>
            </div>
            <span v-if="dialog.unreadCount" class="unread-dot"></span>
          </router-link>
        </div>
      </div>

      <div class="chat-area glass">
        <div class="chat-header">
          <router-link v-if="user" :to="`/profile/${user.id}`" class="chat-user">
            <img :src="userAvatar" class="avatar" alt="" @error="handleAvatarError">
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status">в сети</span>
            </div>
          </router-link>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          
          <template v-else>
            <div 
              v-for="msg in messages" 
              :key="msg.id" 
              class="message"
              :class="{ own: msg.senderId === authStore.user?.id }"
            >
              <div class="message-bubble">
                <p>{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </template>
        </div>

        <form @submit.prevent="sendMessage" class="chat-input">
          <input 
            v-model="newMessage" 
            placeholder="Написать сообщение..." 
            autocomplete="off"
          >
          <button type="submit" class="send-btn" :disabled="!newMessage.trim()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const user = ref(null)
const messages = ref([])
const dialogs = ref([])
const newMessage = ref('')
const loading = ref(true)
const messagesContainer = ref(null)
let pollInterval

const userAvatar = computed(() => getAvatarUrl(user.value?.avatar))

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }

function formatTime(date) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function fetchDialogs() {
  try {
    const res = await api.get('/messages/dialogs')
    dialogs.value = res.data
  } catch {}
}

async function fetchMessages() {
  try {
    const [userRes, messagesRes] = await Promise.all([
      api.get(`/users/${route.params.id}`),
      api.get(`/messages/${route.params.id}`)
    ])
    user.value = userRes.data
    messages.value = messagesRes.data
    scrollToBottom()
    await api.post(`/messages/${route.params.id}/read`)
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}

async function pollMessages() {
  try {
    const res = await api.get(`/messages/${route.params.id}`)
    if (res.data.length > messages.value.length) {
      messages.value = res.data
      scrollToBottom()
      await api.post(`/messages/${route.params.id}/read`)
    }
  } catch {}
}

async function sendMessage() {
  if (!newMessage.value.trim()) return
  try {
    const res = await api.post(`/messages/${route.params.id}`, { content: newMessage.value })
    messages.value.push(res.data)
    newMessage.value = ''
    scrollToBottom()
  } catch (err) {
    notifications.error(err.message)
  }
}

onMounted(() => {
  fetchDialogs()
  fetchMessages()
  pollInterval = setInterval(pollMessages, 3000)
})

onUnmounted(() => clearInterval(pollInterval))

watch(() => route.params.id, () => {
  loading.value = true
  messages.value = []
  fetchMessages()
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  padding: 20px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.chat-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  max-width: 1100px;
  height: calc(100vh - 40px);
}

.dialogs-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.dialogs-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.dialog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-lg);
  transition: all var(--transition);
  text-decoration: none;
  color: inherit;
}

.dialog-item:hover,
.dialog-item.active {
  background: rgba(255, 255, 255, 0.08);
}

.dialog-info {
  flex: 1;
  min-width: 0;
}

.dialog-name {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.dialog-preview {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-user {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
}

.user-status {
  font-size: 13px;
  color: var(--text-secondary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  display: flex;
  max-width: 70%;
}

.message.own {
  align-self: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  border-bottom-left-radius: var(--radius-sm);
}

.message.own .message-bubble {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-bottom-left-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-sm);
}

.message-bubble p {
  word-break: break-word;
  line-height: 1.5;
}

.message-time {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
  text-align: right;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-input input {
  flex: 1;
  border-radius: var(--radius-full);
  padding: 12px 18px;
}

.send-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  box-shadow: none;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 900px) {
  .dialogs-sidebar { display: none; }
  .chat-container { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .chat-page { padding-left: 20px; }
}
</style>
