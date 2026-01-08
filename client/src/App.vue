<template>
  <div class="app" :class="{ 'with-sidebar': authStore.isAuthenticated }">
    <Sidebar v-if="authStore.isAuthenticated" @create="showCreateModal = true" />
    <main class="main-content">
      <router-view />
    </main>
    <Notifications />
    
    <Teleport to="body">
      <CreatePostModal v-if="showCreateModal" @close="showCreateModal = false" @created="handlePostCreated" />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Sidebar from './components/Sidebar.vue'
import Notifications from './components/Notifications.vue'
import CreatePostModal from './components/CreatePostModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const showCreateModal = ref(false)

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
  .app.with-sidebar .main-content {
    margin-left: 0;
  }
}
</style>
