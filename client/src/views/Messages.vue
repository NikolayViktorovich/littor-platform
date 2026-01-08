<template>
  <div class="messages-page">
    <div class="messages-container">
      <!-- Dialogs List -->
      <div class="dialogs-panel glass">
        <div class="dialogs-header">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search conversations...">
          </div>
          <button class="btn btn-icon btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="dialogs-tabs">
          <button class="tab active">Primary</button>
          <button class="tab">Requests</button>
        </div>

        <div class="dialogs-list">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="!dialogs.length" class="empty-state">
            <p>No conversations yet</p>
          </div>
          
          <router-link 
            v-else
            v-for="dialog in dialogs" 
            :key="dialog.user.id"
            :to="`/messages/${dialog.user.id}`"
            class="dialog-item"
            :class="{ unread: dialog.unreadCount > 0 }"
          >
            <div class="dialog-avatar-wrap">
              <img :src="getAvatarUrl(dialog.user.avatar)" class="avatar" alt="" @error="handleAvatarError">
              <span v-if="dialog.unreadCount" class="online-dot"></span>
            </div>
            <div class="dialog-content">
              <div class="dialog-header">
                <span class="dialog-name">{{ dialog.user.name }}</span>
                <span class="dialog-time">{{ formatTime(dialog.lastMessage.createdAt) }}</span>
              </div>
              <p class="dialog-preview">
                <span v-if="dialog.lastMessage.senderId === authStore.user?.id" class="you">You: </span>
                {{ dialog.lastMessage.content }}
              </p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Empty State for Chat -->
      <div class="chat-empty glass">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3>Your messages</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const dialogs = ref([])
const loading = ref(true)

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) {
  e.target.src = '/default-avatar.svg'
}

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000

  if (diff < 86400) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 604800) {
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

async function fetchDialogs() {
  try {
    const res = await api.get('/messages/dialogs')
    dialogs.value = res.data
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDialogs)
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  padding: 20px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.messages-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  max-width: 1200px;
  height: calc(100vh - 40px);
}

.dialogs-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialogs-header {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--glass-border);
}

.search-box {
  flex: 1;
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
  padding: 12px 16px;
  gap: 4px;
}

.tab {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition);
}

.tab:hover {
  color: var(--text-primary);
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

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--glass-border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dialog-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-lg);
  transition: all var(--transition);
  text-decoration: none;
  color: inherit;
}

.dialog-item:hover {
  background: var(--glass-bg-hover);
}

.dialog-item.unread {
  background: var(--glass-bg-hover);
}

.dialog-avatar-wrap {
  position: relative;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
}

.dialog-content {
  flex: 1;
  min-width: 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.dialog-name {
  font-weight: 600;
  font-size: 15px;
}

.dialog-time {
  font-size: 12px;
  color: var(--text-muted);
}

.dialog-preview {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-preview .you {
  color: var(--text-muted);
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: var(--glass-bg-hover);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: var(--text-muted);
}

.chat-empty h3 {
  font-size: 20px;
  font-weight: 600;
}

.chat-empty p {
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .messages-container {
    grid-template-columns: 1fr;
  }
  .chat-empty {
    display: none;
  }
}

@media (max-width: 768px) {
  .messages-page {
    padding-left: 20px;
  }
}
</style>
