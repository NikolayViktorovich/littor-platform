<template>
  <div class="app" :class="{ 'with-sidebar': authStore.isAuthenticated }">
    <Sidebar v-if="authStore.isAuthenticated" @create="showCreateModal = true" />
    <main class="main-content">
      <router-view />
    </main>
    
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
