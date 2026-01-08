<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="sidebar-top">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
          </svg>
        </div>
      </div>

      <!-- Notifications bell -->
      <div class="notifications-wrap">
        <button class="nav-item bell-btn" :class="{ pressed: pressedItem === 'bell', 'has-notif': notificationsList.length > 0 }" @click.stop="toggleNotifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notificationsList.length" class="nav-badge">{{ notificationsList.length }}</span>
        </button>

        <Transition name="dropdown">
          <div v-if="showNotifications" class="notifications-dropdown glass-modal">
            <div class="notif-header"><span>Уведомления</span><button v-if="notificationsList.length" @click="clearNotifications" class="clear-all">Очистить</button></div>
            <div class="notif-list">
              <div v-if="!notificationsList.length" class="notif-empty">Нет уведомлений</div>
              <div v-for="notif in notificationsList" :key="notif.id" class="notif-item" @click="handleNotifClick(notif)">
                <img :src="notif.avatar || '/default-avatar.svg'" class="avatar avatar-sm" alt="">
                <div class="notif-content">
                  <p>{{ notif.text }}</p>
                  <span class="notif-time">{{ formatNotifTime(notif.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="nav-divider"></div>

      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'feed', pressed: pressedItem === 'feed' }" @click="handlePress('feed')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.707 2.293a1 1 0 00-1.414 0l-9 9A1 1 0 003 13h1v7a2 2 0 002 2h4v-6a2 2 0 114 0v6h4a2 2 0 002-2v-7h1a1 1 0 00.707-1.707l-9-9z"/></svg>
        </router-link>

        <router-link to="/friends" class="nav-item" :class="{ active: $route.name === 'friends', pressed: pressedItem === 'friends' }" @click="handlePress('friends')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <span v-if="counts.friends" class="nav-badge">{{ counts.friends }}</span>
        </router-link>

        <button class="nav-item create-btn" :class="{ pressed: pressedItem === 'create' }" @click="handleCreate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        <router-link to="/messages" class="nav-item" :class="{ active: $route.name === 'messages' || $route.name === 'chat', pressed: pressedItem === 'messages' }" @click="handlePress('messages')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span v-if="counts.messages" class="nav-badge">{{ counts.messages }}</span>
        </router-link>

        <router-link :to="`/profile/${authStore.user?.id}`" class="nav-item" :class="{ active: $route.name === 'profile', pressed: pressedItem === 'profile' }" @click="handlePress('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item" :class="{ pressed: pressedItem === 'menu' }" @click.stop="handleMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/></svg>
        </button>

        <Transition name="menu">
          <div v-if="showMenu" class="user-menu glass-modal">
            <router-link :to="`/profile/${authStore.user?.id}`" class="menu-item" @click="showMenu = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
              <span>Профиль</span>
            </router-link>
            <button @click="logout" class="menu-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M7 12h14m0 0l-3-3m3 3l-3 3"/></svg>
              <span>Выйти</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const emit = defineEmits(['create'])
const router = useRouter()
const authStore = useAuthStore()

const counts = reactive({ messages: 0, friends: 0 })
const prevCounts = reactive({ messages: 0, friends: 0 })
const notificationsList = ref([])
const showMenu = ref(false)
const showNotifications = ref(false)
const pressedItem = ref(null)
let pollInterval = null
let heartbeatInterval = null

function handlePress(item) { pressedItem.value = item; setTimeout(() => pressedItem.value = null, 150) }
function handleCreate() { handlePress('create'); emit('create') }
function handleMenu() { handlePress('menu'); showMenu.value = !showMenu.value; showNotifications.value = false }
function toggleNotifications() { handlePress('bell'); showNotifications.value = !showNotifications.value; showMenu.value = false }

function formatNotifTime(d) {
  const date = new Date(d), now = new Date(), diff = (now - date) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

async function fetchCounts() {
  try {
    const res = await api.get('/messages/counts')
    
    // Check for new friend requests - add to notifications
    if (res.data.friends > prevCounts.friends) {
      const diff = res.data.friends - prevCounts.friends
      for (let i = 0; i < diff; i++) {
        notificationsList.value.unshift({
          id: Date.now() + i,
          type: 'friend_request',
          text: 'Новая заявка в друзья',
          avatar: null,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    prevCounts.messages = res.data.messages
    prevCounts.friends = res.data.friends
    counts.messages = res.data.messages
    counts.friends = res.data.friends
  } catch (e) {
    console.log('Failed to fetch counts:', e)
  }
}

async function sendHeartbeat() {
  try { await api.post('/users/heartbeat') } catch {}
}

function handleNotifClick(notif) {
  if (notif.type === 'friend_request') router.push('/friends')
  else if (notif.type === 'message') router.push('/messages')
  notificationsList.value = notificationsList.value.filter(n => n.id !== notif.id)
  showNotifications.value = false
}

function clearNotifications() { notificationsList.value = [] }

function logout() { authStore.logout(); router.push('/login') }

function handleClickOutside(e) {
  if (showMenu.value && !e.target.closest('.sidebar-bottom')) showMenu.value = false
  if (showNotifications.value && !e.target.closest('.notifications-wrap')) showNotifications.value = false
}

onMounted(() => {
  // Only fetch if user is authenticated
  if (authStore.isAuthenticated) {
    fetchCounts()
    sendHeartbeat()
    
    // Poll every 3 seconds for real-time updates
    pollInterval = setInterval(fetchCounts, 3000)
    
    // Heartbeat every 30 seconds
    heartbeatInterval = setInterval(sendHeartbeat, 30000)
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 72px; z-index: 100; padding: 12px; }
.sidebar-inner { height: 100%; display: flex; flex-direction: column; align-items: center; background: transparent; }
.sidebar-top { padding: 20px 0 16px; }
.logo { width: 36px; height: 36px; color: var(--text-primary); }
.logo svg { width: 100%; height: 100%; }

.notifications-wrap { position: relative; margin-bottom: 8px; }
.bell-btn.has-notif svg { color: var(--text-primary); }
.notifications-dropdown { position: absolute; top: 0; left: 72px; width: 300px; max-height: 400px; overflow: hidden; display: flex; flex-direction: column; }
.notif-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; font-size: 15px; }
.clear-all { color: var(--text-muted); font-size: 13px; font-weight: 400; }
.clear-all:hover { color: var(--text-secondary); }
.notif-list { flex: 1; overflow-y: auto; padding: 8px; }
.notif-empty { padding: 40px 20px; text-align: center; color: var(--text-muted); }
.notif-item { display: flex; gap: 12px; padding: 12px; border-radius: var(--radius-lg); cursor: pointer; transition: background var(--transition); }
.notif-item:hover { background: rgba(255,255,255,0.08); }
.notif-content { flex: 1; min-width: 0; }
.notif-content p { font-size: 14px; margin-bottom: 4px; }
.notif-time { font-size: 12px; color: var(--text-muted); }

.nav-divider { width: 32px; height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0; }

.nav { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.nav-item { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius-lg); transition: all 0.15s ease; position: relative; }
.nav-item:hover { color: var(--text-primary); }
.nav-item.active { color: var(--text-primary); }
.nav-item.active svg { transform: scale(1.1); }
.nav-item svg { width: 26px; height: 26px; transition: transform 0.15s ease; }
.nav-item.pressed { transform: scale(0.85); }
.nav-item.create-btn { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); }
.nav-item.create-btn:hover { background: rgba(255, 255, 255, 0.15); }
.nav-badge { position: absolute; top: 6px; right: 6px; min-width: 16px; height: 16px; padding: 0 4px; background: #ff3b5c; color: white; font-size: 10px; font-weight: 600; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; }
.sidebar-bottom { padding: 40px 0 20px; position: relative; }
.user-menu { position: absolute; bottom: 0; left: 72px; width: 200px; padding: 8px; }
.menu-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; color: var(--text-secondary); border-radius: var(--radius); font-size: 14px; transition: all var(--transition); text-decoration: none; }
.menu-item:hover { background: rgba(255, 255, 255, 0.08); color: var(--text-primary); }
.menu-item.danger:hover { color: var(--danger); }
.menu-item svg { width: 18px; height: 18px; }

.menu-enter-active, .menu-leave-active, .dropdown-enter-active, .dropdown-leave-active { transition: all var(--transition); }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateX(-8px); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateX(-8px); }

@media (max-width: 768px) { .sidebar { display: none; } }
</style>
