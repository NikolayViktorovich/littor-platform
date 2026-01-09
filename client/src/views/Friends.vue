<template>
  <div class="friends-page">
    <div class="friends-container">
      <div class="friends-header glass">
        <div class="header-top">
          <h1>Друзья</h1>
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
                placeholder="Поиск по имени или юзернейму..." 
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
                  {{ isPending(user.id) ? 'Отправлено' : 'Добавить' }}
                </button>
              </div>
            </div>
            
            <div v-else-if="searchQuery && !searching" class="empty-search">
              <p>Никого не найдено</p>
            </div>
          </div>
        </Transition>
        
        <div class="liquid-tabs" ref="tabsContainer">
          <div class="liquid-indicator" :style="indicatorStyle"></div>
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            @click="setActiveTab(tab.key)"
            class="liquid-tab"
            :class="{ active: activeTab === tab.key }"
            :ref="el => tabRefs[tab.key] = el"
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { cache } from '../stores/cache'
import api from '../api'

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
  { key: 'friends', label: 'Друзья', count: friends.value.length },
  { key: 'incoming', label: 'Входящие', count: incoming.value.length },
  { key: 'outgoing', label: 'Исходящие', count: outgoing.value.length }
])

const tabsContainer = ref(null)
const tabRefs = ref({})
const indicatorStyle = ref({})
const isAnimating = ref(false)

function updateIndicator(animate = false) {
  nextTick(() => {
    const activeTabEl = tabRefs.value[activeTab.value]
    const container = tabsContainer.value
    
    if (activeTabEl && container) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeTabEl.getBoundingClientRect()
      const targetX = tabRect.left - containerRect.left
      const targetWidth = tabRect.width
      
      if (animate && indicatorStyle.value.width) {
        const currentX = parseFloat(indicatorStyle.value.left) || targetX
        const currentWidth = parseFloat(indicatorStyle.value.width) || targetWidth
        const direction = targetX > currentX ? 1 : -1
        const distance = Math.abs(targetX - currentX)
        
        isAnimating.value = true
        
        // Phase 1: Stretch towards target
        const stretchWidth = currentWidth + distance * 0.6
        indicatorStyle.value = {
          left: `${direction > 0 ? currentX : targetX}px`,
          width: `${stretchWidth}px`,
          transition: 'all 0.15s cubic-bezier(0.4, 0, 1, 1)'
        }
        
        // Phase 2: Snap to target with overshoot
        setTimeout(() => {
          indicatorStyle.value = {
            left: `${targetX}px`,
            width: `${targetWidth}px`,
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }
          setTimeout(() => { isAnimating.value = false }, 400)
        }, 150)
      } else {
        indicatorStyle.value = {
          left: `${targetX}px`,
          width: `${targetWidth}px`,
          transition: 'none'
        }
      }
    }
  })
}

function setActiveTab(tab) {
  if (tab === activeTab.value || isAnimating.value) return
  activeTab.value = tab
  updateIndicator(true)
}

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
    
    // Check for new incoming requests
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
  // Poll every 2ms for instant updates
  pollInterval = setInterval(() => fetchData(true), 2)
  setTimeout(updateIndicator, 100)
  window.addEventListener('resize', updateIndicator)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  window.removeEventListener('resize', updateIndicator)
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
  padding: 20px 24px;
  margin-bottom: 20px;
  overflow: visible;
}

.friends-header h1 {
  font-size: 24px;
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
  transition: transform 0.2s ease;
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
  border-radius: var(--radius-lg);
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
  transition: all 0.15s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.liquid-tabs {
  display: inline-flex;
  position: relative;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-full);
  padding: 4px;
}

.liquid-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-full);
  pointer-events: none;
  will-change: transform, width;
}

.liquid-tab {
  padding: 10px 20px;
  color: var(--text-muted);
  font-size: 15px;
  border-radius: var(--radius-full);
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.liquid-tab:hover {
  color: var(--text-secondary);
}

.liquid-tab.active {
  color: var(--text-primary);
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
</style>
