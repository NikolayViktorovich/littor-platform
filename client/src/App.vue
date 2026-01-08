<template>
  <div class="app" :class="{ 'with-sidebar': authStore.isAuthenticated }">
    <Sidebar v-if="authStore.isAuthenticated" @create="showCreateModal = true" />
    
    <!-- Mobile Header with back/forward buttons -->
    <header v-if="authStore.isAuthenticated" class="mobile-header">
      <button class="mobile-nav-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="mobile-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
        </svg>
      </div>
      <button class="mobile-nav-btn" @click="goForward">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <MessageToast v-if="authStore.isAuthenticated" />
    
    <Teleport to="body">
      <Transition name="modal">
        <CreatePostModal v-if="showCreateModal" @close="showCreateModal = false" @created="handlePostCreated" />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'
import CreatePostModal from './components/CreatePostModal.vue'
import MessageToast from './components/MessageToast.vue'

const authStore = useAuthStore()
const router = useRouter()
const showCreateModal = ref(false)

function goBack() {
  window.history.back()
}

function goForward() {
  window.history.forward()
}

function handlePostCreated() {
  showCreateModal.value = false
  if (router.currentRoute.value.name !== 'feed') {
    router.push('/')
  }
}

onMounted(() => {
  authStore.checkAuth()
})
</script>

<style>
.app {
  min-height: 100vh;
}

.main-content {
  min-height: 100vh;
}

/* Mobile Header */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba(14, 14, 14, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 100;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
}

.mobile-logo {
  width: 32px;
  height: 32px;
  color: var(--text-primary);
}

.mobile-logo svg {
  width: 100%;
  height: 100%;
}

.mobile-nav-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: 10px;
  transition: all 0.15s;
}

.mobile-nav-btn:active {
  transform: scale(0.9);
  color: var(--text-primary);
}

.mobile-nav-btn svg {
  width: 22px;
  height: 22px;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }
  
  .app.with-sidebar .main-content {
    margin-left: 0;
    padding-top: 56px;
    padding-bottom: 72px;
  }
}

.modal-enter-active {
  transition: opacity 0.1s ease-out;
}
.modal-enter-active .modal-content {
  transition: transform 0.1s ease-out;
}
.modal-leave-active {
  transition: opacity 0.08s ease-in;
}
.modal-leave-active .modal-content {
  transition: transform 0.08s ease-in;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateZ(0) scale(0.97);
}
</style>
