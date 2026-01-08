<template>
  <div class="messages-page">
    <div class="messages-container">
      <div class="dialogs-panel glass">
        <div class="dialogs-header">
          <h1>Сообщения</h1>
        </div>

        <div class="liquid-tabs">
          <button class="liquid-tab active">Все</button>
          <button class="liquid-tab">Непрочитанные</button>
        </div>

        <div class="dialogs-list">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="!dialogs.length" class="empty-state">
            <p>Нет диалогов</p>
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
                <span v-if="dialog.lastMessage.senderId === authStore.user?.id" class="you">Вы: </span>
                {{ dialog.lastMessage.content }}
              </p>
            </div>
          </router-link>
        </div>
      </div>

      <div class="chat-empty glass">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3>Ваши сообщения</h3>
        <p>Выберите диалог, чтобы начать общение</p>
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
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 604800) {
    return d.toLocaleDateString('ru-RU', { weekday: 'short' })
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
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
  max-width: 1100px;
  height: calc(100vh - 40px);
}

.dialogs-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialogs-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dialogs-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.liquid-tabs {
  margin: 16px;
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
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
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
  background: rgba(255, 255, 255, 0.06);
}

.dialog-item.unread {
  background: rgba(255, 255, 255, 0.06);
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
  background: rgba(255, 255, 255, 0.5);
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

.chat-empty::before {
  display: none;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.08);
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
