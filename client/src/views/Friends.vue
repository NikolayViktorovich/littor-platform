<template>
  <div class="friends-page">
    <div class="friends-container">
      <div class="friends-header glass">
        <h1>Друзья</h1>
        <div class="liquid-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            @click="activeTab = tab.key"
            class="liquid-tab"
            :class="{ active: activeTab === tab.key }"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="tab-badge">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <div class="friends-content glass">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="!list.length" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p>{{ activeTab === 'friends' ? 'Пока нет друзей' : 'Нет заявок' }}</p>
        </div>
        
        <TransitionGroup v-else name="list" tag="div" class="friends-list">
          <div v-for="user in list" :key="user.id" class="friend-item">
            <router-link :to="`/profile/${user.id}`" class="friend-info">
              <img :src="getAvatarUrl(user.avatar)" class="avatar" alt="" @error="handleAvatarError">
              <div class="friend-details">
                <span class="friend-name">{{ user.name }}</span>
              </div>
            </router-link>
            
            <div class="friend-actions">
              <template v-if="activeTab === 'friends'">
                <router-link :to="`/messages/${user.id}`" class="btn btn-secondary btn-sm">Написать</router-link>
                <button @click="removeFriend(user.id)" class="btn btn-ghost btn-sm">Удалить</button>
              </template>
              <template v-else-if="activeTab === 'incoming'">
                <button @click="acceptRequest(user.id)" class="btn btn-primary btn-sm">Принять</button>
                <button @click="declineRequest(user.id)" class="btn btn-ghost btn-sm">Отклонить</button>
              </template>
              <template v-else>
                <button @click="cancelRequest(user.id)" class="btn btn-secondary btn-sm">Отменить</button>
              </template>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const notifications = useNotificationsStore()

const activeTab = ref('friends')
const friends = ref([])
const incoming = ref([])
const outgoing = ref([])
const loading = ref(false)

const tabs = computed(() => [
  { key: 'friends', label: 'Друзья', count: friends.value.length },
  { key: 'incoming', label: 'Входящие', count: incoming.value.length },
  { key: 'outgoing', label: 'Исходящие', count: outgoing.value.length }
])

const list = computed(() => {
  if (activeTab.value === 'friends') return friends.value
  if (activeTab.value === 'incoming') return incoming.value
  return outgoing.value
})

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) {
  e.target.src = '/default-avatar.svg'
}

async function fetchData() {
  loading.value = true
  try {
    const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
      api.get('/friends'),
      api.get('/friends/incoming'),
      api.get('/friends/outgoing')
    ])
    friends.value = friendsRes.data
    incoming.value = incomingRes.data
    outgoing.value = outgoingRes.data
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}

async function acceptRequest(userId) {
  try {
    await api.post(`/friends/accept/${userId}`)
    const user = incoming.value.find(u => u.id === userId)
    incoming.value = incoming.value.filter(u => u.id !== userId)
    if (user) friends.value.push(user)
    notifications.success('Заявка принята')
  } catch (err) {
    notifications.error(err.message)
  }
}

async function declineRequest(userId) {
  try {
    await api.post(`/friends/decline/${userId}`)
    incoming.value = incoming.value.filter(u => u.id !== userId)
  } catch (err) {
    notifications.error(err.message)
  }
}

async function cancelRequest(userId) {
  try {
    await api.delete(`/friends/request/${userId}`)
    outgoing.value = outgoing.value.filter(u => u.id !== userId)
  } catch (err) {
    notifications.error(err.message)
  }
}

async function removeFriend(userId) {
  try {
    await api.delete(`/friends/${userId}`)
    friends.value = friends.value.filter(u => u.id !== userId)
    notifications.success('Удалён из друзей')
  } catch (err) {
    notifications.error(err.message)
  }
}

fetchData()
</script>

<style scoped>
.friends-page {
  min-height: 100vh;
  padding: 20px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.friends-container {
  max-width: 600px;
  margin: 0 auto;
}

.friends-header {
  padding: 20px 24px;
  margin-bottom: 20px;
}

.friends-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.liquid-tabs {
  display: inline-flex;
}

.tab-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.friends-content {
  padding: 16px;
  min-height: 300px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: var(--text-secondary);
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

.empty-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  transition: background var(--transition);
}

.friend-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.friend-details {
  display: flex;
  flex-direction: column;
}

.friend-name {
  font-weight: 600;
  font-size: 15px;
  transition: color var(--transition);
}

.friend-info:hover .friend-name {
  color: rgba(255, 255, 255, 0.7);
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.list-enter-active,
.list-leave-active {
  transition: all var(--transition);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 768px) {
  .friends-page {
    padding-left: 20px;
  }
  
  .friend-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .friend-actions {
    width: 100%;
  }
  
  .friend-actions .btn {
    flex: 1;
  }
}
</style>
