<template>
  <div class="messages-page">
    <div class="messages-container">
      <div class="dialogs-panel glass">
        <div class="dialogs-header">
          <h1>Сообщения</h1>
        </div>

        <div class="dialogs-list">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="!dialogs.length" class="empty-state">
            <p>Нет диалогов</p>
          </div>
          
          <div 
            v-else
            v-for="dialog in dialogs" 
            :key="dialog.user.id"
            @click="selectDialog(dialog.user.id)"
            class="dialog-item"
            :class="{ active: selectedUserId === dialog.user.id, unread: dialog.unreadCount > 0 }"
          >
            <div class="dialog-avatar-wrap">
              <img :src="getAvatarUrl(dialog.user.avatar)" class="avatar" alt="" @error="handleAvatarError">
            </div>
            <div class="dialog-content">
              <div class="dialog-header">
                <span class="dialog-name">{{ dialog.user.name }}</span>
                <span class="dialog-time">{{ formatTime(dialog.lastMessage.createdAt) }}</span>
              </div>
              <p class="dialog-preview">
                <span v-if="dialog.lastMessage.senderId === authStore.user?.id" class="you">Вы: </span>
                {{ dialog.lastMessage.content }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!selectedUserId" class="chat-empty glass">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3>Ваши сообщения</h3>
        <p>Выберите диалог, чтобы начать общение</p>
      </div>

      <div v-else class="chat-panel glass">
        <div class="chat-header">
          <router-link v-if="chatUser" :to="`/profile/${chatUser.id}`" class="chat-user">
            <img :src="getAvatarUrl(chatUser.avatar)" class="avatar" alt="" @error="handleAvatarError">
            <div class="user-info">
              <span class="user-name">{{ chatUser.name }}</span>
              <span class="user-status">в сети</span>
            </div>
          </router-link>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-if="chatLoading" class="loading-state">
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
                <div v-else-if="msg.mediaType === 'circle'" class="circle-video" @click="toggleVideo($event)">
                  <video :src="msg.media" class="circle-player"></video>
                </div>
                <audio v-else-if="msg.mediaType === 'voice'" :src="msg.media" controls class="voice-message"></audio>
                <p v-if="msg.content">{{ msg.content }}</p>
                <span class="message-time">{{ formatMsgTime(msg.createdAt) }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="chat-input-area">
          <div v-if="mediaPreview" class="media-preview">
            <img v-if="mediaType === 'image'" :src="mediaPreview" alt="">
            <video v-else-if="mediaType === 'video' || mediaType === 'circle'" :src="mediaPreview" :class="{ circle: mediaType === 'circle' }"></video>
            <div v-else-if="mediaType === 'voice'" class="voice-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              <span>Голосовое сообщение</span>
            </div>
            <button @click="clearMedia" class="clear-media">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div v-if="isRecording" class="recording-indicator">
            <div class="recording-dot"></div>
            <span>{{ formatRecTime(recordingTime) }}</span>
            <button @click="cancelRecording" class="cancel-rec">Отмена</button>
          </div>

          <form @submit.prevent="sendMessage" class="chat-input" v-show="!isRecording">
            <div class="input-actions-left">
              <label class="action-btn">
                <input type="file" accept="image/*,video/*" @change="handleMediaSelect" hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </label>
              <button type="button" class="action-btn" @click="startCircle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="input-wrap">
              <input v-model="newMessage" placeholder="Написать сообщение..." autocomplete="off" ref="msgInput">
              <EmojiPicker @select="insertEmoji" />
            </div>
            <div class="input-actions-right">
              <button v-if="!newMessage.trim() && !mediaPreview" type="button" class="action-btn voice-btn" @mousedown="startVoice" @mouseup="stopVoice" @mouseleave="stopVoice" @touchstart.prevent="startVoice" @touchend.prevent="stopVoice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
              <button v-else type="submit" class="send-btn" :disabled="!canSend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showCircleOverlay" class="circle-overlay">
        <video ref="circlePreviewEl" class="circle-preview-video" autoplay muted playsinline></video>
        <div class="circle-controls">
          <span>{{ formatRecTime(recordingTime) }}</span>
          <button @click="stopCircle" class="stop-btn"><svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
          <button @click="cancelRecording" class="cancel-btn">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { cache } from '../stores/cache'
import EmojiPicker from '../components/EmojiPicker.vue'
import api from '../api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const dialogs = ref(cache.messages.dialogs)
const loading = ref(!cache.messages.loaded)
const selectedUserId = ref(null)
const chatUser = ref(null)
const messages = ref([])
const chatLoading = ref(false)
const newMessage = ref('')
const messagesContainer = ref(null)
const msgInput = ref(null)
const circlePreviewEl = ref(null)

const mediaFile = ref(null)
const mediaPreview = ref(null)
const mediaType = ref(null)
const isRecording = ref(false)
const showCircleOverlay = ref(false)
const recordingTime = ref(0)
let mediaRecorder = null
let recordedChunks = []
let recordingInterval = null
let stream = null
let pollInterval = null

const canSend = computed(() => newMessage.value.trim() || mediaFile.value)

function getAvatarUrl(a) { return a || '/default-avatar.svg' }
function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function formatTime(d) {
  const date = new Date(d), now = new Date(), diff = (now - date) / 1000
  if (diff < 86400) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800) return date.toLocaleDateString('ru-RU', { weekday: 'short' })
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
function formatMsgTime(d) { return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
function formatRecTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` }
function scrollToBottom() { nextTick(() => { if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight }) }
function toggleVideo(e) { const v = e.target.querySelector('video') || e.target; v.paused ? v.play() : v.pause() }

function insertEmoji(emoji) {
  const input = msgInput.value
  if (input) {
    const start = input.selectionStart, end = input.selectionEnd
    newMessage.value = newMessage.value.substring(0, start) + emoji + newMessage.value.substring(end)
    nextTick(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length) })
  } else newMessage.value += emoji
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
  mediaFile.value = null; mediaPreview.value = null; mediaType.value = null
}

async function startVoice() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' })
      mediaFile.value = new File([blob], 'voice.webm', { type: 'audio/webm' })
      mediaPreview.value = URL.createObjectURL(blob)
      mediaType.value = 'voice'
      stream.getTracks().forEach(t => t.stop())
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000)
  } catch { notifications.error('Нет доступа к микрофону') }
}

function stopVoice() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    clearInterval(recordingInterval)
  }
}

async function startCircle() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 }, audio: true })
    showCircleOverlay.value = true
    await nextTick()
    if (circlePreviewEl.value) circlePreviewEl.value.srcObject = stream
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      mediaFile.value = new File([blob], 'circle.webm', { type: 'video/webm' })
      mediaPreview.value = URL.createObjectURL(blob)
      mediaType.value = 'circle'
      stream.getTracks().forEach(t => t.stop())
      showCircleOverlay.value = false
    }
    mediaRecorder.start()
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000)
  } catch { notifications.error('Нет доступа к камере'); showCircleOverlay.value = false }
}

function stopCircle() { if (mediaRecorder) { mediaRecorder.stop(); clearInterval(recordingInterval) } }
function cancelRecording() {
  if (mediaRecorder) { mediaRecorder.stop(); recordedChunks = [] }
  if (stream) stream.getTracks().forEach(t => t.stop())
  isRecording.value = false; showCircleOverlay.value = false
  clearInterval(recordingInterval); clearMedia()
}

async function fetchDialogs() {
  try {
    const res = await api.get('/messages/dialogs')
    dialogs.value = res.data
    cache.messages.dialogs = res.data
    cache.messages.loaded = true
  } catch (err) { notifications.error(err.message) }
  finally { loading.value = false }
}

async function selectDialog(userId) {
  selectedUserId.value = userId
  chatLoading.value = true
  messages.value = []
  try {
    const [userRes, msgRes] = await Promise.all([api.get(`/users/${userId}`), api.get(`/messages/${userId}`)])
    chatUser.value = userRes.data
    messages.value = msgRes.data
    scrollToBottom()
    await api.post(`/messages/${userId}/read`)
  } catch (err) { notifications.error(err.message) }
  finally { chatLoading.value = false }
}

async function pollMessages() {
  if (!selectedUserId.value) return
  try {
    const res = await api.get(`/messages/${selectedUserId.value}`)
    if (res.data.length > messages.value.length) {
      messages.value = res.data
      scrollToBottom()
      await api.post(`/messages/${selectedUserId.value}/read`)
    }
  } catch {}
}

async function sendMessage() {
  if (!canSend.value || !selectedUserId.value) return
  try {
    const formData = new FormData()
    if (newMessage.value.trim()) formData.append('content', newMessage.value.trim())
    if (mediaFile.value) { formData.append('media', mediaFile.value); formData.append('mediaType', mediaType.value) }
    const res = await api.post(`/messages/${selectedUserId.value}`, formData)
    messages.value.push(res.data)
    newMessage.value = ''
    clearMedia()
    scrollToBottom()
    fetchDialogs()
  } catch (err) { notifications.error(err.message) }
}

onMounted(() => {
  fetchDialogs()
  pollInterval = setInterval(pollMessages, 3000)
  if (route.params.id) selectDialog(route.params.id)
})
onUnmounted(() => { clearInterval(pollInterval); if (stream) stream.getTracks().forEach(t => t.stop()) })
watch(() => route.params.id, id => { if (id) selectDialog(id) })
</script>

<style scoped>
.messages-page { min-height: 100vh; padding: 20px; padding-left: calc(var(--sidebar-width) + 20px); display: flex; justify-content: center; }
.messages-container { display: grid; grid-template-columns: 340px 1fr; gap: 20px; max-width: 1000px; width: 100%; height: calc(100vh - 40px); }
.dialogs-panel, .chat-panel, .chat-empty { display: flex; flex-direction: column; overflow: hidden; }
.dialogs-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.dialogs-header h1 { font-size: 20px; font-weight: 600; }
.dialogs-list { flex: 1; overflow-y: auto; padding: 8px; }
.loading-state, .empty-state { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-secondary); }
.spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: rgba(255,255,255,0.5); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.dialog-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--radius-lg); transition: all var(--transition); cursor: pointer; }
.dialog-item:hover, .dialog-item.active { background: rgba(255,255,255,0.08); }
.dialog-item.unread { background: rgba(255,255,255,0.06); }
.dialog-avatar-wrap { position: relative; }
.dialog-content { flex: 1; min-width: 0; }
.dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.dialog-name { font-weight: 600; font-size: 15px; }
.dialog-time { font-size: 12px; color: var(--text-muted); }
.dialog-preview { font-size: 14px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dialog-preview .you { color: var(--text-muted); }
.chat-empty { align-items: center; justify-content: center; gap: 16px; text-align: center; }
.empty-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--text-muted); }
.chat-empty h3 { font-size: 20px; font-weight: 600; }
.chat-empty p { color: var(--text-secondary); }

.chat-panel { display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.chat-user { display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 16px; }
.user-status { font-size: 13px; color: var(--text-secondary); }
.chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.message { display: flex; max-width: 70%; }
.message.own { align-self: flex-end; }
.message-bubble { padding: 12px 16px; background: rgba(255,255,255,0.08); border-radius: var(--radius-xl); border-bottom-left-radius: var(--radius-sm); }
.message.own .message-bubble { background: rgba(255,255,255,0.15); border-bottom-left-radius: var(--radius-xl); border-bottom-right-radius: var(--radius-sm); }
.message-bubble p { word-break: break-word; line-height: 1.5; }
.message-media { max-width: 100%; max-height: 250px; border-radius: var(--radius-lg); margin-bottom: 8px; }
.circle-video { width: 180px; height: 180px; border-radius: 50%; overflow: hidden; margin-bottom: 8px; cursor: pointer; }
.circle-player { width: 100%; height: 100%; object-fit: cover; }
.voice-message { width: 180px; height: 36px; margin-bottom: 8px; }
.message-time { display: block; font-size: 11px; opacity: 0.7; margin-top: 6px; text-align: right; }
.chat-input-area { border-top: 1px solid rgba(255,255,255,0.08); }
.media-preview { position: relative; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.media-preview img, .media-preview video { max-height: 120px; max-width: 160px; border-radius: var(--radius-lg); }
.media-preview video.circle { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.voice-preview { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
.voice-preview svg { width: 24px; height: 24px; }
.clear-media { position: absolute; top: 8px; right: 16px; width: 28px; height: 28px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.clear-media svg { width: 14px; height: 14px; }
.recording-indicator { display: flex; align-items: center; gap: 12px; padding: 16px 20px; color: var(--text-secondary); }
.recording-dot { width: 12px; height: 12px; background: #ff4444; border-radius: 50%; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.cancel-rec { margin-left: auto; color: var(--text-muted); font-size: 14px; }

.chat-input { display: flex; align-items: center; gap: 8px; padding: 12px 16px; }
.input-actions-left, .input-actions-right { display: flex; gap: 4px; }
.action-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius-full); transition: all var(--transition); cursor: pointer; }
.action-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-secondary); }
.action-btn svg { width: 22px; height: 22px; }
.input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.input-wrap input { width: 100%; border-radius: var(--radius-full); padding: 10px 16px; padding-right: 44px; }
.input-wrap :deep(.emoji-wrap) { position: absolute; right: 8px; }
.send-btn { width: 40px; height: 40px; background: rgba(255,255,255,0.15); color: var(--text-primary); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
.send-btn:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
.send-btn:disabled { opacity: 0.5; }
.send-btn svg { width: 20px; height: 20px; }
.voice-btn { background: rgba(255,255,255,0.1); }
.voice-btn:active { background: rgba(255,100,100,0.3); color: #ff6666; }
.circle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; }
.circle-preview-video { width: 280px; height: 280px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.2); }
.circle-controls { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 24px; color: white; }
.stop-btn { width: 64px; height: 64px; background: #ff4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.stop-btn svg { width: 24px; height: 24px; }
.cancel-btn { color: var(--text-muted); font-size: 16px; }
@media (max-width: 900px) { .messages-container { grid-template-columns: 1fr; } .chat-empty { display: none; } .dialogs-panel { display: none; } }
@media (max-width: 768px) { .messages-page { padding-left: 20px; } }
</style>
