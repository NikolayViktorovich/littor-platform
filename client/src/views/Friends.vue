<template>
  <div class="friends-page">
    <div class="friends-container">
      <div class="friends-header">
        <div class="header-top">
          <h1>{{ t('friends') }}</h1>
          <button class="add-btn" :class="{ active: showSearch }" @click="showSearch = !showSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
        
        <Transition name="search">
          <div v-if="showSearch" class="search-section">
            <div class="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4-4"/>
              </svg>
              <input 
                v-model="searchQuery" 
                @input="handleSearch"
                :placeholder="t('searchByNameOrUsername')" 
                ref="searchInput"
              >
            </div>
            
            <div v-if="searching" class="search-loading">
              <div class="spinner-sm"></div>
            </div>
            
            <div v-else-if="searchResults.length" class="search-results">
              <div v-for="user in searchResults" :key="user.id" class="search-item">
                <router-link :to="`/profile/${user.id}`" class="friend-info" @click="showSearch = false">
                  <img :src="getAvatarUrl(user.avatar)" class="avatar" alt="" @error="handleAvatarError">
                  <div class="friend-details">
                    <span class="friend-name">{{ user.name }}</span>
                    <span v-if="user.username" class="friend-username">@{{ user.username }}</span>
                  </div>
                </router-link>
                <button 
                  v-if="!isFriend(user.id) && user.id !== authStore.user?.id"
                  @click="sendRequest(user.id)" 
                  class="btn btn-primary btn-sm"
                  :disabled="isPending(user.id)"
                >
                  {{ isPending(user.id) ? t('sent') : t('add') }}
                </button>
              </div>
            </div>
            
            <div v-else-if="searchQuery && !searching" class="empty-search">
              <p>{{ t('nobodyFound') }}</p>
            </div>
          </div>
        </Transition>
        
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
          <p>{{ activeTab === 'friends' ? t('noFriends') : t('noRequests') }}</p>
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
                <router-link :to="`/messages/${user.id}`" class="btn btn-secondary btn-sm">{{ t('write') }}</router-link>
                <button @click="removeFriend(user.id)" class="btn btn-ghost btn-sm">{{ t('remove') }}</button>
              </template>
              <template v-else-if="activeTab === 'incoming'">
                <button @click="acceptRequest(user.id)" class="btn btn-primary btn-sm">{{ t('accept') }}</button>
                <button @click="declineRequest(user.id)" class="btn btn-ghost btn-sm">{{ t('decline') }}</button>
              </template>
              <template v-else>
                <button @click="cancelRequest(user.id)" class="btn btn-secondary btn-sm">{{ t('cancel') }}</button>
              </template>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { cache } from '../stores/cache'
import { useI18n } from '../i18n'
import api from '../api'

const { t } = useI18n()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const activeTab = ref('friends')
const friends = ref(cache.friends.friends)
const incoming = ref(cache.friends.incoming)
const outgoing = ref(cache.friends.outgoing)
const loading = ref(!cache.friends.loaded)

const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchInput = ref(null)
let searchTimeout = null
let pollInterval = null

const tabs = computed(() => [
  { key: 'friends', label: t('friends'), count: friends.value.length },
  { key: 'incoming', label: t('incoming'), count: incoming.value.length },
  { key: 'outgoing', label: t('outgoing'), count: outgoing.value.length }
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

function isFriend(userId) {
  return friends.value.some(f => f.id === userId)
}

function isPending(userId) {
  return outgoing.value.some(u => u.id === userId)
}

function handleSearch() {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await api.get('/users/search', { params: { q: searchQuery.value } })
      searchResults.value = res.data
    } catch (err) {
      notifications.error(err.message)
    } finally {
      searching.value = false
    }
  }, 300)
}

async function sendRequest(userId) {
  try {
    await api.post(`/friends/request/${userId}`)
    const user = searchResults.value.find(u => u.id === userId)
    if (user) outgoing.value.push(user)
    cache.friends.outgoing = outgoing.value
    notifications.success('Заявка отправлена')
  } catch (err) {
    notifications.error(err.message)
  }
}

watch(showSearch, (val) => {
  if (val) {
    nextTick(() => searchInput.value?.focus())
  } else {
    searchQuery.value = ''
    searchResults.value = []
  }
})

async function fetchData(silent = false) {
  if (!cache.friends.loaded && !silent) {
    loading.value = true
  }
  try {
    const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
      api.get('/friends'),
      api.get('/friends/incoming'),
      api.get('/friends/outgoing')
    ])
    
    if (silent && incomingRes.data.length > incoming.value.length) {
      const newRequests = incomingRes.data.filter(
        newUser => !incoming.value.some(oldUser => oldUser.id === newUser.id)
      )
      newRequests.forEach(user => {
        notifications.friendRequest(user)
      })
    }
    
    friends.value = friendsRes.data
    incoming.value = incomingRes.data
    outgoing.value = outgoingRes.data
    
    cache.friends.friends = friendsRes.data
    cache.friends.incoming = incomingRes.data
    cache.friends.outgoing = outgoingRes.data
    cache.friends.loaded = true
  } catch (err) {
    if (!silent) notifications.error(err.message)
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
    cache.friends.friends = friends.value
    cache.friends.incoming = incoming.value
    notifications.success('Заявка принята')
  } catch (err) {
    notifications.error(err.message)
  }
}

async function declineRequest(userId) {
  try {
    await api.post(`/friends/decline/${userId}`)
    incoming.value = incoming.value.filter(u => u.id !== userId)
    cache.friends.incoming = incoming.value
  } catch (err) {
    notifications.error(err.message)
  }
}

async function cancelRequest(userId) {
  try {
    await api.delete(`/friends/request/${userId}`)
    outgoing.value = outgoing.value.filter(u => u.id !== userId)
    cache.friends.outgoing = outgoing.value
  } catch (err) {
    notifications.error(err.message)
  }
}

async function removeFriend(userId) {
  try {
    await api.delete(`/friends/${userId}`)
    friends.value = friends.value.filter(u => u.id !== userId)
    cache.friends.friends = friends.value
    notifications.success('Удалён из друзей')
  } catch (err) {
    notifications.error(err.message)
  }
}

onMounted(() => {
  fetchData()
  pollInterval = setInterval(() => fetchData(true), 500)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
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
  padding: 12px 24px;
  margin-bottom: 12px;
  overflow: visible;
  background: transparent;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  text-align: center;
}

.friends-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all var(--transition);
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.add-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.15s ease;
}

.add-btn.active svg {
  transform: rotate(45deg);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  border-radius: var(--radius-full);
  padding: 14px 16px;
  overflow: visible;
}

.search-input-wrap svg {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input-wrap input {
  flex: 1;
  background: none !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--text-primary);
  font-size: 15px;
  padding: 0 !important;
  caret-color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.search-input-wrap input::placeholder {
  color: var(--text-muted);
  transition: opacity 0.15s ease;
}

.search-input-wrap input:focus::placeholder {
  opacity: 0;
}

.search-input-wrap input:focus {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
  background: none !important;
  border-radius: 0 !important;
}

.search-section {
  margin-bottom: 16px;
  overflow: visible;
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  transition: background var(--transition);
}

.search-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.search-item .friend-info {
  gap: 12px;
}

.friend-username {
  font-size: 13px;
  color: var(--text-muted);
}

.empty-search {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.search-enter-active,
.search-leave-active {
  transition: all 0.1s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.liquid-tabs {
  display: flex;
  position: relative;
  background: var(--glass-bg);
  border-radius: var(--radius-full);
  padding: 4px;
  gap: 4px;
}

.liquid-tab {
  padding: 10px 20px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-full);
  transition: color 0.1s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.liquid-tab:hover {
  color: var(--text-secondary);
}

.liquid-tab.active {
  color: var(--text-primary);
  background: var(--glass-bg-active);
}

.tab-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.04);
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
  background: rgba(255, 255, 255, 0.03);
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
  
  .search-dropdown {
    width: 280px;
    right: -60px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .tab:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .friend-card:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.06);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .friend-actions .btn:active {
    transform: scale(0.92);
    background: rgba(255, 255, 255, 0.15);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}

[data-theme="light"] .add-btn {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .add-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .search-input-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .search-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .liquid-tabs {
  background: var(--glass-bg);
}

[data-theme="light"] .liquid-tab.active {
  color: var(--text-primary);
  background: var(--glass-bg-active);
}

[data-theme="light"] .tab-badge {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .empty-icon {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .friend-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .friend-info:hover .friend-name {
  color: var(--text-secondary);
}
</style>
