<template>
  <div class="app" :class="{ 'with-sidebar': authStore.isAuthenticated, 'has-audio-player': hasActivePlayer }">
    <Sidebar v-if="authStore.isAuthenticated" />
    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    
    <MessageToast v-if="authStore.isAuthenticated" />
    <GlobalAudioPlayer />
    <Notifications />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useAudioPlayerStore } from './stores/audioPlayer'
import Sidebar from './components/Sidebar.vue'
import MessageToast from './components/MessageToast.vue'
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue'
import Notifications from './components/Notifications.vue'

const authStore = useAuthStore()
const audioPlayerStore = useAudioPlayerStore()
const isMobile = ref(window.innerWidth <= 768)

const hasActivePlayer = computed(() => audioPlayerStore.currentTrack !== null && isMobile.value)

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  let actualTheme = savedTheme
  if (savedTheme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.setAttribute('data-theme', actualTheme)
  
  const savedAnimations = localStorage.getItem('animationsEnabled')
  if (savedAnimations === 'false') {
    document.documentElement.classList.add('no-animations')
  }
}

onMounted(() => {
  initTheme()
  authStore.checkAuth()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
.app {
  min-height: 100vh;
}

.main-content {
  min-height: 100vh;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.1s cubic-bezier(0.2, 0, 0, 1), transform 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .app.with-sidebar .main-content {
    margin-left: 0;
    padding-bottom: 72px;
  }
  
  .app.has-audio-player .main-content {
    padding-top: 64px;
  }
  
  .app .sidebar {
    position: fixed !important;
    bottom: 0 !important;
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 56px !important;
    z-index: 99999 !important;
  }
}

.modal-enter-active {
  transition: opacity 0.08s cubic-bezier(0.2, 0, 0, 1);
}
.modal-enter-active .modal-content {
  transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
}
.modal-leave-active {
  transition: opacity 0.06s cubic-bezier(0.4, 0, 1, 1);
}
.modal-leave-active .modal-content {
  transition: transform 0.06s cubic-bezier(0.4, 0, 1, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateZ(0) scale(0.97);
}
</style>
