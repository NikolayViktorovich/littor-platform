<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- Dialogs Sidebar -->
      <div class="dialogs-sidebar glass">
        <div class="sidebar-header">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search...">
          </div>
        </div>

        <div class="dialogs-tabs">
          <button class="tab active">Primary</button>
          <button class="tab">Requests</button>
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

      <!-- Chat Area -->
      <div class="chat-area glass">
        <div class="chat-header">
          <router-link v-if="user" :to="`/profile/${user.id}`" class="chat-user">
            <img :src="userAvatar" class="avatar" alt="" @error="handleAvatarError">
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status">Online</span>
            </div>
          </router-link>
          <div class="chat-actions">
            <button class="btn btn-icon btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
            <button class="btn btn-icon btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </button>
          </div>
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
          <button type="button" class="attach-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input 
            v-model="newMessage" 
            placeholder="Start a new message..." 
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
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
  grid-template-columns: 340px 1fr;
  gap: 20px;
  max-width: 1200px;
  height: calc(100vh - 40px);
}

.dialogs-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--glass-border);
}

.search-box {
  position: relative;
}

.search-box svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.search-box input {
  padding-left: 42px;
  border-radius: var(--radius-full);
}

.dialogs-tabs {
  display: flex;
  padding: 12px;
  gap: 4px;
}

.tab {
  flex: 1;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition);
}

.tab.active {
  background: var(--glass-bg-active);
  color: var(--text-primary);
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
  background: var(--glass-bg-hover);
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
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border);
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
  color: var(--success);
}

.chat-actions {
  display: flex;
  gap: 8px;
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
  border: 3px solid var(--glass-border);
  border-top-color: var(--accent);
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
  background: var(--glass-bg-hover);
  border-radius: var(--radius-xl);
  border-bottom-left-radius: var(--radius-sm);
}

.message.own .message-bubble {
  background: var(--accent);
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
  border-top: 1px solid var(--glass-border);
}

.attach-btn {
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-full);
  transition: all var(--transition);
}

.attach-btn:hover {
  background: var(--glass-bg-hover);
  color: var(--text-secondary);
}

.attach-btn svg {
  width: 22px;
  height: 22px;
}

.chat-input input {
  flex: 1;
  border-radius: var(--radius-full);
  padding: 12px 18px;
}

.send-btn {
  width: 44px;
  height: 44px;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
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
