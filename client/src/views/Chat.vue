<template>
  <div class="chat-page">
    <div class="chat-container">
      <div class="chat-area glass">
        <div class="chat-header">
          <button @click="$router.back()" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <router-link v-if="user" :to="`/profile/${user.id}`" class="chat-user">
            <img :src="userAvatar" class="avatar" alt="" @error="handleAvatarError">
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status">в сети</span>
            </div>
          </router-link>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          
          <template v-else>
            <div 
              v-for="msg in messages" 
              :key="msg.id" 
              class="message"
              :class="{ own: msg.senderId === authStore.user?.id }"
            >
              <div class="message-bubble">
                <img v-if="msg.mediaType === 'image'" :src="msg.media" class="message-media" alt="">
                <video v-else-if="msg.mediaType === 'video'" :src="msg.media" class="message-media" controls></video>
                <div v-else-if="msg.mediaType === 'circle'" class="circle-video">
                  <video :src="msg.media" class="circle-player" @click="toggleCirclePlay($event)"></video>
                </div>
                <audio v-else-if="msg.mediaType === 'voice'" :src="msg.media" controls class="voice-message"></audio>
                <p v-if="msg.content">{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="chat-input-area">
          <div v-if="mediaPreview" class="media-preview">
            <img v-if="mediaType === 'image'" :src="mediaPreview" alt="">
            <video v-else-if="mediaType === 'video' || mediaType === 'circle'" :src="mediaPreview" :class="{ circle: mediaType === 'circle' }"></video>
            <div v-else-if="mediaType === 'voice'" class="voice-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              <span>Голосовое сообщение</span>
            </div>
            <button @click="clearMedia" class="clear-media">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div v-if="isRecordingVoice" class="recording-indicator">
            <div class="recording-dot"></div>
            <span>{{ formatRecordingTime(recordingTime) }}</span>
            <button @click="cancelRecording" class="cancel-recording">Отмена</button>
          </div>

          <div v-if="isRecordingCircle" class="circle-recording-overlay">
            <video ref="circlePreview" class="circle-preview" autoplay muted playsinline></video>
            <div class="circle-controls">
              <span class="recording-time">{{ formatRecordingTime(recordingTime) }}</span>
              <button @click="stopCircleRecording" class="stop-circle">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
              <button @click="cancelRecording" class="cancel-circle">Отмена</button>
            </div>
          </div>

          <form @submit.prevent="sendMessage" class="chat-input" v-show="!isRecordingVoice && !isRecordingCircle">
            <div class="input-actions-left">
              <label class="action-btn">
                <input type="file" accept="image/*,video/*" @change="handleMediaSelect" hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </label>
              <button type="button" class="action-btn" @click="startCircleRecording">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            <div class="input-wrap">
              <input 
                v-model="newMessage" 
                placeholder="Написать сообщение..." 
                autocomplete="off"
                ref="messageInput"
              >
              <EmojiPicker @select="insertEmoji" />
            </div>

            <div class="input-actions-right">
              <button 
                v-if="!newMessage.trim() && !mediaPreview" 
                type="button" 
                class="action-btn voice-btn"
                @mousedown="startVoiceRecording"
                @mouseup="stopVoiceRecording"
                @mouseleave="stopVoiceRecording"
                @touchstart.prevent="startVoiceRecording"
                @touchend.prevent="stopVoiceRecording"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button v-else type="submit" class="send-btn" :disabled="!canSend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { currentChatUserId } from '../stores/chat'
import EmojiPicker from '../components/EmojiPicker.vue'
import api from '../api'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const user = ref(null)
const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const messagesContainer = ref(null)
const messageInput = ref(null)
const circlePreview = ref(null)

const mediaFile = ref(null)
const mediaPreview = ref(null)
const mediaType = ref(null)

const isRecordingVoice = ref(false)
const isRecordingCircle = ref(false)
const recordingTime = ref(0)
let mediaRecorder = null
let recordedChunks = []
let recordingInterval = null
let stream = null
let pollInterval

const userAvatar = computed(() => getAvatarUrl(user.value?.avatar))
const canSend = computed(() => newMessage.value.trim() || mediaFile.value)

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }

function formatTime(date) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatRecordingTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function insertEmoji(emoji) {
  const input = messageInput.value
  if (input) {
    const start = input.selectionStart
    const end = input.selectionEnd
    newMessage.value = newMessage.value.substring(0, start) + emoji + newMessage.value.substring(end)
    nextTick(() => {
      input.focus()
      input.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  } else {
    newMessage.value += emoji
  }
}

function handleMediaSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  
  mediaFile.value = file
  mediaPreview.value = URL.createObjectURL(file)
  mediaType.value = file.type.startsWith('image/') ? 'image' : 'video'
  e.target.value = ''
}

function clearMedia() {
  if (mediaPreview.value) URL.revokeObjectURL(mediaPreview.value)
  mediaFile.value = null
  mediaPreview.value = null
  mediaType.value = null
}

async function startVoiceRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' })
      mediaFile.value = new File([blob], 'voice.webm', { type: 'audio/webm' })
      mediaPreview.value = URL.createObjectURL(blob)
      mediaType.value = 'voice'
      stream.getTracks().forEach(t => t.stop())
    }
    
    mediaRecorder.start()
    isRecordingVoice.value = true
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000)
  } catch (err) {
    notifications.error('Нет доступа к микрофону')
  }
}

function stopVoiceRecording() {
  if (mediaRecorder && isRecordingVoice.value) {
    mediaRecorder.stop()
    isRecordingVoice.value = false
    clearInterval(recordingInterval)
  }
}

async function startCircleRecording() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: 480, height: 480 }, 
      audio: true 
    })
    
    isRecordingCircle.value = true
    await nextTick()
    
    if (circlePreview.value) {
      circlePreview.value.srcObject = stream
    }
    
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      mediaFile.value = new File([blob], 'circle.webm', { type: 'video/webm' })
      mediaPreview.value = URL.createObjectURL(blob)
      mediaType.value = 'circle'
      stream.getTracks().forEach(t => t.stop())
      isRecordingCircle.value = false
    }
    
    mediaRecorder.start()
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000)
  } catch (err) {
    notifications.error('Нет доступа к камере')
    isRecordingCircle.value = false
  }
}

function stopCircleRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop()
    clearInterval(recordingInterval)
  }
}

function cancelRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop()
    recordedChunks = []
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
  }
  isRecordingVoice.value = false
  isRecordingCircle.value = false
  clearInterval(recordingInterval)
  clearMedia()
}

function toggleCirclePlay(e) {
  const video = e.target
  if (video.paused) video.play()
  else video.pause()
}

async function fetchMessages() {
  try {
    const [userRes, messagesRes] = await Promise.all([
      api.get(`/users/${route.params.id}`),
      api.get(`/messages/${route.params.id}`)
    ])
    user.value = userRes.data
    messages.value = messagesRes.data
    scrollToBottom()
    await api.post(`/messages/${route.params.id}/read`)
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}

async function pollMessages() {
  try {
    const res = await api.get(`/messages/${route.params.id}`)
    if (res.data.length > messages.value.length) {
      // Check if user is near bottom before updating
      const container = messagesContainer.value
      const wasAtBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight < 100)
      
      messages.value = res.data
      
      // Only scroll to bottom if user was already at bottom
      if (wasAtBottom) {
        scrollToBottom()
      }
      
      await api.post(`/messages/${route.params.id}/read`)
    }
  } catch {}
}

async function sendMessage() {
  if (!canSend.value) return
  
  try {
    const formData = new FormData()
    if (newMessage.value.trim()) formData.append('content', newMessage.value.trim())
    if (mediaFile.value) {
      formData.append('media', mediaFile.value)
      formData.append('mediaType', mediaType.value)
    }
    
    const res = await api.post(`/messages/${route.params.id}`, formData)
    messages.value.push(res.data)
    newMessage.value = ''
    clearMedia()
    scrollToBottom()
  } catch (err) {
    notifications.error(err.message)
  }
}

onMounted(() => {
  fetchMessages()
  pollInterval = setInterval(pollMessages, 3000)
  currentChatUserId.value = route.params.id
})

onUnmounted(() => {
  clearInterval(pollInterval)
  if (stream) stream.getTracks().forEach(t => t.stop())
  currentChatUserId.value = null
})

watch(() => route.params.id, () => {
  loading.value = true
  messages.value = []
  currentChatUserId.value = route.params.id
  fetchMessages()
})
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  padding: 20px;
  padding-left: calc(var(--sidebar-width) + 20px);
}

.chat-container {
  max-width: 700px;
  margin: 0 auto;
  height: calc(100vh - 40px);
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-lg);
  transition: all var(--transition);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.chat-user {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
}

.user-status {
  font-size: 13px;
  color: var(--text-secondary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  display: flex;
  max-width: 70%;
}

.message.own {
  align-self: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  border-bottom-left-radius: var(--radius-sm);
}

.message.own .message-bubble {
  background: rgba(255, 255, 255, 0.15);
  border-bottom-left-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-sm);
}

.message-bubble p {
  word-break: break-word;
  line-height: 1.5;
}

.message-media {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius-lg);
  margin-bottom: 8px;
}

.circle-video {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 8px;
  cursor: pointer;
}

.circle-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voice-message {
  width: 200px;
  height: 40px;
  margin-bottom: 8px;
}

.message-time {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 6px;
  text-align: right;
}

.chat-input-area {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.media-preview {
  position: relative;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.media-preview img,
.media-preview video {
  max-height: 150px;
  max-width: 200px;
  border-radius: var(--radius-lg);
}

.media-preview video.circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.voice-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
}

.voice-preview svg {
  width: 24px;
  height: 24px;
}

.clear-media {
  position: absolute;
  top: 8px;
  right: 16px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.clear-media svg {
  width: 14px;
  height: 14px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  color: var(--text-secondary);
}

.recording-dot {
  width: 12px;
  height: 12px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.cancel-recording {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 14px;
}

.circle-recording-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.circle-preview {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.2);
}

.circle-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.recording-time {
  font-size: 18px;
  color: white;
}

.stop-circle {
  width: 64px;
  height: 64px;
  background: #ff4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stop-circle svg {
  width: 24px;
  height: 24px;
}

.cancel-circle {
  color: var(--text-muted);
  font-size: 16px;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.input-actions-left,
.input-actions-right {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  transition: all var(--transition);
  cursor: pointer;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.action-btn svg {
  width: 22px;
  height: 22px;
}

.input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap input {
  width: 100%;
  border-radius: var(--radius-full);
  padding: 10px 16px;
  padding-right: 44px;
}

.input-wrap :deep(.emoji-wrap) {
  position: absolute;
  right: 8px;
}

.send-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.send-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.send-btn:disabled {
  opacity: 0.5;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.voice-btn {
  background: rgba(255, 255, 255, 0.1);
}

.voice-btn:active {
  background: rgba(255, 100, 100, 0.3);
  color: #ff6666;
}

@media (max-width: 768px) {
  .chat-page {
    padding-left: 20px;
  }
}
</style>
