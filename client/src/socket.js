import { io } from 'socket.io-client'
import { ref, watch } from 'vue'
import { useAuthStore } from './stores/auth'

const socket = ref(null)
const isConnected = ref(false)
const pendingListeners = []

export function initSocket() {
  const authStore = useAuthStore()
  
  watch(() => authStore.token, (token) => {
    if (token) {
      connectSocket(token)
    } else {
      disconnectSocket()
    }
  }, { immediate: true })
}

function connectSocket(token) {
  if (socket.value?.connected) return
  
  socket.value = io('http://localhost:4000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })
  
  socket.value.on('connect', () => {
    isConnected.value = true
    console.log('Socket connected')
    
    pendingListeners.forEach(({ event, callback }) => {
      socket.value.on(event, callback)
    })
  })
  
  socket.value.on('disconnect', () => {
    isConnected.value = false
    console.log('Socket disconnected')
  })
  
  socket.value.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })
}

function disconnectSocket() {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
    isConnected.value = false
  }
}

export function useSocket() {
  return {
    socket,
    isConnected,
    
    emit(event, data) {
      socket.value?.emit(event, data)
    },
    
    on(event, callback) {
      if (socket.value) {
        socket.value.on(event, callback)
      } else {
        pendingListeners.push({ event, callback })
      }
    },
    
    off(event, callback) {
      if (socket.value) {
        socket.value.off(event, callback)
      }
      const idx = pendingListeners.findIndex(l => l.event === event && l.callback === callback)
      if (idx !== -1) pendingListeners.splice(idx, 1)
    },
    
    joinPost(postId) {
      socket.value?.emit('post:join', postId)
    },
    
    leavePost(postId) {
      socket.value?.emit('post:leave', postId)
    }
  }
}

export { socket, isConnected }
