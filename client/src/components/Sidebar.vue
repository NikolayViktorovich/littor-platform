<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <div class="sidebar-top">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
          </svg>
        </div>
      </div>

      <!-- Notifications bell -->
      <div class="notifications-wrap">
        <button class="nav-item bell-btn" :class="{ pressed: pressedItem === 'bell', 'has-notif': notificationsList.length > 0 }" @click.stop="toggleNotifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notificationsList.length" class="nav-badge">{{ notificationsList.length }}</span>
        </button>

        <Transition name="dropdown">
          <div v-if="showNotifications" class="notifications-dropdown glass-modal">
            <div class="notif-header"><span>{{ t('notificationsTitle') }}</span><button v-if="notificationsList.length" @click="clearNotifications" class="clear-all">{{ t('clearAll') }}</button></div>
            <div class="notif-list">
              <div v-if="!notificationsList.length" class="notif-empty">{{ t('noNotifications') }}</div>
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

      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'feed', pressed: pressedItem === 'feed' }" @click="handlePress('feed')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/></svg>
        </router-link>

        <router-link to="/friends" class="nav-item" :class="{ active: $route.name === 'friends', pressed: pressedItem === 'friends' }" @click="handlePress('friends')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span v-if="counts.friends" class="nav-badge">{{ counts.friends }}</span>
        </router-link>

        <router-link to="/messages" class="nav-item" :class="{ active: $route.name === 'messages' || $route.name === 'chat', pressed: pressedItem === 'messages' }" @click="handlePress('messages')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span v-if="counts.messages" class="nav-badge">{{ counts.messages }}</span>
        </router-link>

        <router-link to="/music" class="nav-item" :class="{ active: $route.name === 'music', pressed: pressedItem === 'music' }" @click="handlePress('music')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </router-link>

        <router-link :to="`/profile/${authStore.user?.id}`" class="nav-item desktop-only" :class="{ active: $route.name === 'profile', pressed: pressedItem === 'profile' }" @click="handlePress('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </router-link>

        <router-link :to="`/profile/${authStore.user?.id}`" class="nav-item mobile-only" :class="{ active: $route.name === 'profile', pressed: pressedItem === 'profile' }" @click="handlePress('profile')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item" :class="{ pressed: pressedItem === 'menu' }" @click.stop="handleMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/></svg>
        </button>

        <Transition name="menu">
          <div v-if="showMenu" class="user-menu glass-modal">
            <router-link :to="`/profile/${authStore.user?.id}`" class="menu-item" @click="showMenu = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
              <span>{{ t('profile') }}</span>
            </router-link>
            <router-link to="/settings" class="menu-item" @click="showMenu = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>{{ t('settings') }}</span>
            </router-link>
            <button @click="logout" class="menu-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M7 12h14m0 0l-3-3m3 3l-3 3"/></svg>
              <span>{{ t('logout') }}</span>
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
import { useNotificationsStore } from '../stores/notifications'
import { useSocket } from '../socket'
import { useI18n } from '../i18n'
import api from '../api'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const { on, off } = useSocket()

const counts = reactive({ messages: 0, friends: 0 })
const prevCounts = reactive({ messages: 0, friends: 0 })
const notificationsList = ref([])
const shownFriendAcceptedIds = ref(new Set())
const showMenu = ref(false)
const showNotifications = ref(false)
const pressedItem = ref(null)
let pollInterval = null
let heartbeatInterval = null

function handlePress(item) { pressedItem.value = item; setTimeout(() => pressedItem.value = null, 150) }
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

async function fetchNotifications() {
  try {
    const res = await api.get('/notifications')
    const serverNotifs = res.data.filter(n => !n.isRead && (n.type === 'mention' || n.type === 'post_mention' || n.type === 'friend_accepted')).map(n => ({
      id: n.id,
      type: n.type,
      text: n.content,
      avatar: n.fromUserAvatar,
      fromUserId: n.fromUserId,
      chatId: n.chatId,
      messageId: n.messageId,
      postId: n.postId,
      createdAt: n.createdAt
    }))
    
    serverNotifs.forEach(n => {
      if (n.type === 'friend_accepted' && !shownFriendAcceptedIds.value.has(n.id)) {
        shownFriendAcceptedIds.value.add(n.id)
        notificationsStore.friendAccepted({ name: n.text.split(' принял')[0], avatar: n.avatar })
      }
    })
    
    const localNotifs = notificationsList.value.filter(n => n.type === 'friend_request')
    notificationsList.value = [...serverNotifs, ...localNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {}
}

async function sendHeartbeat() {
  try { await api.post('/users/heartbeat') } catch {}
}

function handleNotifClick(notif) {
  if (notif.type === 'friend_request') {
    router.push('/friends')
  } else if (notif.type === 'mention') {
    router.push(`/messages/${notif.fromUserId}?msg=${notif.messageId}`)
  } else if (notif.type === 'post_mention') {
    router.push(`/?post=${notif.postId}`)
  } else if (notif.type === 'friend_accepted') {
    router.push(`/profile/${notif.fromUserId}`)
  }
  
  if (notif.type === 'mention' || notif.type === 'post_mention' || notif.type === 'friend_accepted') {
    api.post(`/notifications/${notif.id}/read`).catch(() => {})
  }
  
  notificationsList.value = notificationsList.value.filter(n => n.id !== notif.id)
  showNotifications.value = false
}

function clearNotifications() {
  api.post('/notifications/read').catch(() => {})
  notificationsList.value = []
}

function logout() { authStore.logout(); router.push('/login') }

function handleClickOutside(e) {
  if (showMenu.value && !e.target.closest('.sidebar-bottom')) showMenu.value = false
  if (showNotifications.value && !e.target.closest('.notifications-wrap')) showNotifications.value = false
}

function handleNewNotification(notif) {
  notificationsList.value.unshift({
    id: notif.id,
    type: notif.type,
    text: notif.content,
    avatar: notif.fromUserAvatar,
    fromUserId: notif.fromUserId,
    chatId: notif.chatId,
    messageId: notif.messageId,
    postId: notif.postId,
    createdAt: notif.createdAt
  })
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchCounts()
    fetchNotifications()
    sendHeartbeat()
    
    pollInterval = setInterval(() => {
      fetchCounts()
      fetchNotifications()
    }, 500)
    
    heartbeatInterval = setInterval(sendHeartbeat, 30000)
    
    on('notification:new', handleNewNotification)
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  off('notification:new', handleNewNotification)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
.sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 72px; z-index: 100; padding: 8px 12px 12px 12px; }
.sidebar-inner { height: 100%; display: flex; flex-direction: column; align-items: center; background: transparent; }
.sidebar-top { padding: 6px 0 16px; }
.logo { width: 36px; height: 36px; color: var(--text-primary); }
.logo svg { width: 100%; height: 100%; }

.notifications-wrap { position: relative; margin-bottom: 8px; }
.bell-btn.has-notif svg { color: var(--text-primary); }
.notifications-dropdown { position: absolute; top: 0; left: 72px; width: 300px; max-height: 400px; overflow: hidden; display: flex; flex-direction: column; }
.notif-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; font-weight: 600; font-size: 15px; }
.clear-all { color: var(--text-muted); font-size: 13px; font-weight: 400; }
.clear-all:hover { color: var(--text-secondary); }
.notif-list { flex: 1; overflow-y: auto; padding: 8px; }
.notif-empty { padding: 40px 20px; text-align: center; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
.notif-item { display: flex; gap: 12px; padding: 12px; border-radius: var(--radius-lg); cursor: pointer; transition: background var(--transition); }
.notif-item:hover { background: rgba(255,255,255,0.04); }
.notif-content { flex: 1; min-width: 0; }
.notif-content p { font-size: 14px; margin-bottom: 4px; }
.notif-time { font-size: 12px; color: var(--text-muted); }

.nav-divider { display: none; }

.nav { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; margin-top: -40px; }
.nav-item { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius-lg); transition: all 0.1s cubic-bezier(0.2, 0, 0, 1); position: relative; }
.nav-item:hover { color: var(--text-primary); }
.nav-item.active { color: var(--text-primary); }
.nav-item.active svg { transform: scale(1.1); }
.nav-item svg { width: 26px; height: 26px; transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1); }
.nav-item.pressed { transform: scale(0.85); }
.nav-badge { position: absolute; top: 6px; right: 6px; min-width: 16px; height: 16px; padding: 0 4px; background: #ff3b5c; color: white; font-size: 10px; font-weight: 600; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; }
.sidebar-bottom { padding: 40px 0 20px; position: relative; }
.user-menu { position: absolute; bottom: 0; left: 72px; width: 200px; padding: 8px; }
.menu-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; color: var(--text-secondary); border-radius: var(--radius); font-size: 14px; transition: all var(--transition); text-decoration: none; }
.menu-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); }
.menu-item.danger:hover { color: var(--danger); }
.menu-item svg { width: 18px; height: 18px; }

.menu-enter-active, .dropdown-enter-active { transition: all 0.1s cubic-bezier(0.2, 0, 0, 1); }
.menu-leave-active, .dropdown-leave-active { transition: all 0.08s cubic-bezier(0.4, 0, 1, 1); }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateX(-6px); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateX(-6px); }

.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .sidebar {
    position: fixed !important;
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 56px !important;
    padding: 0;
    background: rgba(14, 14, 14, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    z-index: 9999 !important;
  }
  
  .sidebar-inner {
    flex-direction: row;
    justify-content: space-around;
    padding: 0 8px;
    padding-bottom: env(safe-area-inset-bottom);
    align-items: center;
    height: 100%;
  }
  
  .sidebar-top,
  .sidebar-bottom,
  .nav-divider,
  .notifications-wrap {
    display: none;
  }
  
  .nav {
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    gap: 0;
    margin-top: 0;
  }
  
  .nav-item {
    width: 52px !important;
    height: 44px !important;
  }
  
  .nav-item svg {
    width: 24px !important;
    height: 24px !important;
  }
  
  .nav-badge {
    top: 2px;
    right: 2px;
    min-width: 14px;
    height: 14px;
    font-size: 9px;
  }
  
  .nav-item:active {
    transform: scale(0.88);
    background: rgba(255, 255, 255, 0.08);
  }
  
  .desktop-only { display: none; }
  .mobile-only { display: flex; }
}

[data-theme="light"] .menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .notif-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

@media (max-width: 768px) {
  [data-theme="light"] .sidebar {
    background: rgba(255, 255, 255, 0.95);
    border-top-color: rgba(0, 0, 0, 0.06);
  }
  
  [data-theme="light"] .nav-item:active {
    background: rgba(0, 0, 0, 0.06);
  }
}
</style>
