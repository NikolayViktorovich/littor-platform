<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <!-- User Profile at Top -->
      <div class="sidebar-header">
        <div class="user-card">
          <router-link :to="`/profile/${authStore.user?.id}`" class="user-card-link">
            <img :src="avatarUrl" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            <div class="user-info">
              <span class="user-name">{{ authStore.user?.name }}</span>
            </div>
          </router-link>
          <button class="menu-toggle" @click="showMenu = !showMenu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="18" r="1.5"/>
            </svg>
          </button>
        </div>

        <Transition name="menu">
          <div v-if="showMenu" class="user-menu glass-modal">
            <router-link :to="`/profile/${authStore.user?.id}`" class="menu-item" @click="showMenu = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
              <span>Профиль</span>
            </router-link>
            <button @click="logout" class="menu-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <path d="M16 17l5-5-5-5"/>
                <path d="M21 12H9"/>
              </svg>
              <span>Выйти</span>
            </button>
          </div>
        </Transition>
      </div>

      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'feed' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <span>Главная</span>
        </router-link>

        <router-link to="/messages" class="nav-item" :class="{ active: $route.name === 'messages' || $route.name === 'chat' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="M22 6l-10 7L2 6"/>
            </svg>
            <span v-if="unreadCount" class="nav-badge">{{ unreadCount }}</span>
          </div>
          <span>Сообщения</span>
        </router-link>

        <router-link to="/friends" class="nav-item" :class="{ active: $route.name === 'friends' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span>Друзья</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const authStore = useAuthStore()
const unreadCount = ref(0)
const showMenu = ref(false)
let interval

const avatarUrl = computed(() => {
  const avatar = authStore.user?.avatar
  if (!avatar) return '/default-avatar.svg'
  return avatar
})

function handleAvatarError(e) {
  e.target.src = '/default-avatar.svg'
}

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
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  z-index: 100;
  padding: 16px;
}

.sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  padding: 20px 12px;
  box-shadow: var(--glass-shadow);
  position: relative;
  overflow: hidden;
}

.sidebar-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.25) 50%, 
    transparent 100%
  );
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  color: var(--text-secondary);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 15px;
  transition: all var(--transition);
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.nav-item.active {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.nav-item.active .nav-icon {
  color: var(--text-primary);
}

.nav-icon {
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 24px;
  height: 24px;
}

.nav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-header {
  position: relative;
  padding-bottom: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  transition: background var(--transition);
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-card-link {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-toggle {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius);
  transition: color var(--transition);
}

.menu-toggle:hover {
  color: var(--text-secondary);
}

.menu-toggle svg {
  width: 18px;
  height: 18px;
}

.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  padding: 8px;
  z-index: 10;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  color: var(--text-secondary);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all var(--transition);
  text-decoration: none;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.menu-item.danger:hover {
  color: var(--danger);
}

.menu-item svg {
  width: 18px;
  height: 18px;
}

.menu-enter-active,
.menu-leave-active {
  transition: all var(--transition);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
