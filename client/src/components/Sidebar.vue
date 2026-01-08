<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <!-- Navigation -->
      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'feed' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span>Главная</span>
        </router-link>

        <router-link to="/messages" class="nav-item" :class="{ active: $route.name === 'messages' || $route.name === 'chat' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span v-if="unreadCount" class="nav-badge">{{ unreadCount }}</span>
          </div>
          <span>Сообщения</span>
        </router-link>

        <router-link to="/friends" class="nav-item" :class="{ active: $route.name === 'friends' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span>Друзья</span>
        </router-link>

        <router-link :to="`/profile/${authStore.user?.id}`" class="nav-item" :class="{ active: $route.name === 'profile' }">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>Профиль</span>
        </router-link>
      </nav>

      <!-- User Section -->
      <div class="sidebar-footer">
        <div class="user-card" @click="showMenu = !showMenu">
          <img :src="avatarUrl" class="avatar avatar-sm" alt="" @error="handleAvatarError">
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.name }}</span>
          </div>
          <button class="menu-toggle">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="18" r="1.5"/>
            </svg>
          </button>
        </div>

        <Transition name="menu">
          <div v-if="showMenu" class="user-menu glass">
            <button @click="logout" class="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Выйти</span>
            </button>
          </div>
        </Transition>

        <button class="post-btn btn btn-primary" @click="$router.push('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Запись</span>
        </button>
      </div>
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

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition);
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.06);
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
  bottom: calc(100% + 8px);
  left: 12px;
  right: 12px;
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
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--danger);
}

.menu-item svg {
  width: 18px;
  height: 18px;
}

.post-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px 20px;
  font-size: 15px;
  gap: 10px;
}

.post-btn svg {
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
