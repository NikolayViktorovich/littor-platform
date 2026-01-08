<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">Littor</router-link>
      
      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'feed' }">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </router-link>
        <router-link to="/friends" class="nav-item" :class="{ active: $route.name === 'friends' }">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        </router-link>
        <router-link to="/messages" class="nav-item" :class="{ active: $route.name === 'messages' || $route.name === 'chat' }">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
          <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
        </router-link>
      </nav>

      <div class="header-right">
        <router-link :to="`/profile/${authStore.user?.id}`" class="user-link">
          <img :src="authStore.user?.avatar || '/default-avatar.svg'" class="avatar avatar-sm" alt="">
          <span>{{ authStore.user?.name }}</span>
        </router-link>
        <button @click="logout" class="logout-btn" title="Выйти">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const authStore = useAuthStore()
const unreadCount = ref(0)
let interval

async function fetchUnread() {
  try {
    const res = await api.get('/messages/unread-count')
    unreadCount.value = res.data.count
  } catch {}
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchUnread()
  interval = setInterval(fetchUnread, 30000)
})

onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-secondary);
  box-shadow: var(--shadow);
  z-index: 100;
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.logo {
  font-size: 24px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: var(--bg-hover);
  text-decoration: none;
}

.nav-item.active {
  color: var(--accent);
  background: rgba(24, 119, 242, 0.1);
}

.nav-item svg {
  width: 24px;
  height: 24px;
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  color: var(--text-primary);
  font-weight: 500;
  transition: background 0.2s;
}

.user-link:hover {
  background: var(--bg-hover);
  text-decoration: none;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-hover);
  color: var(--text-secondary);
  transition: background 0.2s, color 0.2s;
}

.logout-btn:hover {
  background: var(--border-color);
  color: var(--danger);
}

.logout-btn svg {
  width: 20px;
  height: 20px;
}
</style>
