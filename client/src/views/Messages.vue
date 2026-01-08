<template>
  <div class="messages-page">
    <div class="messages-container" :class="{ 'show-chat': selectedUserId && isMobile }">
      <div class="dialogs-panel glass">
        <div class="dialogs-header"><h1>Чаты</h1></div>
        <div class="dialogs-list">
          <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
          <div v-else-if="!dialogs.length" class="empty-state"><p>Нет диалогов</p></div>
          <div v-else v-for="dialog in dialogs" :key="dialog.user.id" @click="selectDialog(dialog.user.id)" class="dialog-item" :class="{ active: selectedUserId === dialog.user.id, unread: dialog.unreadCount > 0 }">
            <div class="dialog-avatar-wrap">
              <img :src="getAvatarUrl(dialog.user.avatar)" class="avatar" alt="" @error="handleAvatarError">
              <span v-if="dialog.user.isOnline" class="online-indicator"></span>
            </div>
            <div class="dialog-content">
              <div class="dialog-header">
                <span class="dialog-name">{{ dialog.user.name }}</span>
                <span class="dialog-time">{{ formatTime(dialog.lastMessage.createdAt) }}</span>
              </div>
              <div class="dialog-bottom">
                <p class="dialog-preview"><span v-if="dialog.lastMessage.senderId === authStore.user?.id" class="you">Вы: </span>{{ dialog.lastMessage.content || 'Медиа' }}</p>
                <span v-if="dialog.unreadCount" class="unread-badge">{{ dialog.unreadCount }}</span>
                <svg v-else-if="dialog.lastMessage.senderId === authStore.user?.id" class="read-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!selectedUserId" class="chat-empty glass">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <h3>Ваши сообщения</h3>
        <p>Выберите диалог, чтобы начать общение</p>
      </div>

      <div v-else class="chat-panel glass">
        <div class="chat-header">
          <button v-if="isMobile" @click="goBack" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <router-link v-if="chatUser" :to="`/profile/${chatUser.id}`" class="chat-user">
            <div class="chat-avatar-wrap">
              <img :src="getAvatarUrl(chatUser.avatar)" class="avatar" alt="" @error="handleAvatarError">
              <span v-if="chatUser.isOnline" class="online-indicator"></span>
            </div>
            <div class="user-info">
              <span class="user-name">{{ chatUser.name }}</span>
              <span class="user-status">{{ chatUser.isOnline ? 'в сети' : formatLastSeen(chatUser.lastSeen) }}</span>
            </div>
          </router-link>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-if="chatLoading" class="loading-state"><div class="spinner"></div></div>
          <template v-else>
            <div v-for="msg in messages" :key="msg.id" class="message" :class="{ own: msg.senderId === authStore.user?.id, forwarded: msg.forwarded, 'media-message': msg.mediaType === 'circle' || msg.mediaType === 'voice' }" @contextmenu.prevent="openMsgMenu($event, msg)">
              <router-link v-if="msg.senderId !== authStore.user?.id" :to="`/profile/${chatUser?.id}`" class="msg-avatar">
                <img :src="getAvatarUrl(chatUser?.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
              </router-link>
              <div class="message-content">
                <!-- Circle video message -->
                <div v-if="msg.mediaType === 'circle'" class="circle-message">
                  <div class="circle-video-wrap" @click="toggleCircle($event, msg.id)">
                    <video :src="msg.media" :id="'circle-' + msg.id" class="circle-player" loop playsinline @loadedmetadata="onCircleLoaded($event, msg.id)" @timeupdate="onCircleTimeUpdate($event, msg.id)"></video>
                    <div class="circle-overlay-icon" v-if="!playingCircles[msg.id]">
                      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <button class="circle-mute" @click.stop="toggleMute(msg.id)">
                      <svg v-if="mutedCircles[msg.id]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    </button>
                  </div>
                  <div class="circle-info">
                    <span class="circle-timer">{{ getCircleCurrentTime(msg.id) }}</span>
                    <span class="message-time">{{ formatMsgTime(msg.createdAt) }}</span>
                  </div>
                </div>
                <!-- Voice message -->
                <div v-else-if="msg.mediaType === 'voice'" class="voice-message-wrap">
                  <button class="voice-play-btn" @click="toggleVoice($event, msg.id)">
                    <svg v-if="!playingVoices[msg.id]" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  </button>
                  <div class="voice-wave-wrap">
                    <div class="voice-waveform">
                      <span v-for="i in 30" :key="i" class="wave-bar" :class="{ active: isWaveBarActive(msg.id, i, 30) }" :style="{ height: getWaveHeight(i) + 'px' }"></span>
                    </div>
                    <div class="voice-bottom">
                      <span class="voice-duration">{{ getVoiceDuration(msg.id) }}</span>
                      <span class="voice-msg-time">{{ formatMsgTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                  <audio :src="msg.media" :id="'voice-' + msg.id" @ended="onVoiceEnded(msg.id)" @loadedmetadata="onVoiceLoaded($event, msg.id)" @timeupdate="onVoiceTimeUpdate($event, msg.id)" hidden></audio>
                </div>
                <!-- Regular message bubble -->
                <div v-else class="message-bubble">
                  <span v-if="msg.forwarded" class="forwarded-label">Переслано</span>
                  <img v-if="msg.mediaType === 'image'" :src="msg.media" class="message-media" alt="" @click="openMediaViewer(msg.media, 'image')">
                  <video v-else-if="msg.mediaType === 'video'" :src="msg.media" class="message-media" controls></video>
                  <span class="message-text-wrap"><p v-if="msg.content">{{ msg.content }}</p><span class="message-time">{{ formatMsgTime(msg.createdAt) }}</span></span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-if="mediaPreview" class="media-preview">
          <img v-if="mediaType === 'image'" :src="mediaPreview" alt="">
          <video v-else-if="mediaType === 'video' || mediaType === 'circle'" :src="mediaPreview" :class="{ circle: mediaType === 'circle' }"></video>
          <div v-else-if="mediaType === 'voice'" class="voice-preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg><span>Голосовое</span></div>
          <button @click="clearMedia" class="clear-media"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div v-if="isRecording" class="voice-recording-bar">
          <div class="voice-rec-left">
            <div class="voice-rec-dot"></div>
            <span class="voice-rec-time">{{ formatRecTimeMs(recordingTime) }}</span>
          </div>
          <button @click="cancelRecording" class="voice-rec-cancel">Отмена</button>
          <button @click="stopVoice" class="voice-rec-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
        </div>
        <form @submit.prevent="sendMessage" class="chat-input" v-show="!isRecording">
          <div class="input-actions-left">
            <label class="action-btn"><input type="file" accept="image/*,video/*" @change="handleMediaSelect" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></label>
          </div>
          <div class="input-wrap">
            <input v-model="newMessage" placeholder="Написать сообщение..." autocomplete="off" ref="msgInput">
            <EmojiPicker @select="insertEmoji" />
          </div>
          <div class="input-actions-right">
            <button v-if="!newMessage.trim() && !mediaPreview" type="button" class="action-btn voice-btn" @click="onVoiceBtnClick" @mousedown="onVoiceMouseDown" @mousemove="onVoiceMouseMove" @mouseup="onVoiceMouseUp" @mouseleave="onVoiceMouseUp" @touchstart.prevent="onVoiceBtnDown" @touchend.prevent="onVoiceBtnUp" @touchmove.prevent="onVoiceBtnTouchMove" ref="voiceBtnRef">
              <svg v-if="voiceBtnMode === 'voice'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button v-else type="submit" class="send-btn" :disabled="!canSend"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></button>
          </div>
        </form>
      </div>

      <div v-if="showCircleOverlay" class="circle-overlay">
        <div class="circle-rec-container">
          <div class="circle-rec-video-wrap">
            <svg class="circle-progress-ring" viewBox="0 0 200 200">
              <circle class="circle-progress-bg" cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
              <circle class="circle-progress-bar" cx="100" cy="100" r="96" fill="none" stroke="white" stroke-width="4" :stroke-dasharray="603" :stroke-dashoffset="603 - (recordingTime / 60) * 603" stroke-linecap="round" transform="rotate(-90 100 100)"/>
            </svg>
            <video ref="circlePreviewEl" class="circle-preview-video" autoplay muted playsinline></video>
          </div>
          <button class="circle-rec-pause" @click="toggleCirclePause">
            <svg v-if="!circlePaused" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>
        <div class="circle-rec-controls">
          <div class="circle-rec-left">
            <button class="circle-rec-btn" @click="switchCamera">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button class="circle-rec-btn" :class="{ active: circleMuted }" @click="toggleCircleRecMute">
              <svg v-if="circleMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </div>
          <div class="circle-rec-bottom">
            <div class="circle-rec-dot"></div>
            <span class="circle-rec-time">{{ formatRecTimeMs(recordingTime) }}</span>
            <button @click="cancelRecording" class="circle-rec-cancel">Отмена</button>
          </div>
          <button @click="stopCircle" class="circle-rec-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>

      <Teleport to="body">
        <div v-if="showMsgMenu" class="msg-menu glass-modal" :style="{ top: msgMenuY + 'px', left: msgMenuX + 'px' }" @click.stop>
          <button class="menu-item" @click="forwardMessage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>Переслать</button>
          <button v-if="selectedMsg?.senderId === authStore.user?.id" class="menu-item" @click="deleteForAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>Удалить для всех</button>
          <button class="menu-item danger" @click="deleteForMe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>Удалить для себя</button>
        </div>

        <Transition name="modal">
          <div v-if="showForwardModal" class="modal-overlay" @click.self="showForwardModal = false">
            <div class="modal glass-modal">
              <div class="modal-header"><h2>Переслать сообщение</h2><button @click="showForwardModal = false" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
              <div class="forward-list">
                <div v-for="d in dialogs" :key="d.user.id" class="forward-item" @click="doForward(d.user.id)"><img :src="getAvatarUrl(d.user.avatar)" class="avatar" alt=""><span>{{ d.user.name }}</span></div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showMediaViewerModal" class="media-viewer-overlay" @click.self="showMediaViewerModal = false">
            <button class="viewer-close" @click="showMediaViewerModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div class="viewer-content"><img v-if="viewerType === 'image'" :src="viewerSrc" alt=""><video v-else :src="viewerSrc" controls autoplay></video></div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { currentChatUserId } from '../stores/chat'
import { cache } from '../stores/cache'
import EmojiPicker from '../components/EmojiPicker.vue'
import api from '../api'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const dialogs = ref([])
const loading = ref(true)
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
const circlePaused = ref(false)
const circleMuted = ref(false)
const facingMode = ref('user')
const voiceBtnMode = ref('voice')
const voiceBtnStartX = ref(0)
const voiceBtnStartY = ref(0)
const voiceBtnRef = ref(null)
const mouseDownOnVoice = ref(false)
const mouseDragStartY = ref(0)
const voiceRecLevels = ref(Array(24).fill(4))
let mediaRecorder = null, recordedChunks = [], recordingInterval = null, stream = null, pollInterval = null
let audioContext = null, analyser = null, animationId = null

const showMsgMenu = ref(false)
const msgMenuX = ref(0)
const msgMenuY = ref(0)

const playingCircles = ref({})
const mutedCircles = ref({})
const playingVoices = ref({})
const voiceDurations = ref({})
const voiceTotalDurations = ref({})
const voiceProgress = ref({})
const circleDurations = ref({})
const circleCurrentTime = ref({})
const selectedMsg = ref(null)
const showForwardModal = ref(false)
const showMediaViewerModal = ref(false)
const viewerSrc = ref('')
const viewerType = ref('image')

const scrollPositions = {}

const canSend = computed(() => newMessage.value.trim() || mediaFile.value)
const isMobile = ref(window.innerWidth <= 900)

function saveScrollPosition() {
  if (selectedUserId.value && messagesContainer.value) {
    scrollPositions[selectedUserId.value] = messagesContainer.value.scrollTop
  }
}

function restoreScrollPosition(userId) {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function goBack() { saveScrollPosition(); selectedUserId.value = null; chatUser.value = null; currentChatUserId.value = null }
function handleResize() { isMobile.value = window.innerWidth <= 900 }
function getAvatarUrl(a) { return a || '/default-avatar.svg' }
function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function formatTime(d) { 
  const date = new Date(d), now = new Date()
  const diff = (now - date) / 1000
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  if (isToday) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return 'вчера'
  if (diff < 604800) return date.toLocaleDateString('ru-RU', { weekday: 'short' })
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: '2-digit', year: '2-digit' }).replace(/\//g, '.')
}
function formatMsgTime(d) { return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
function formatRecTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` }
function formatRecTimeMs(s) { const mins = Math.floor(s/60); const secs = s % 60; return `${mins}:${secs.toString().padStart(2,'0')},00` }
function formatLastSeen(lastSeen) { if (!lastSeen) return 'был(а) давно'; const d = new Date(lastSeen), now = new Date(), diff = (now - d) / 1000; if (diff < 60) return 'был(а) только что'; if (diff < 3600) return `был(а) ${Math.floor(diff / 60)} мин назад`; if (diff < 86400) return `был(а) ${Math.floor(diff / 3600)} ч назад`; return `был(а) ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}` }
function scrollToBottom() { nextTick(() => { if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight }) }
function toggleVideo(e) { const v = e.target.querySelector('video') || e.target; v.paused ? v.play() : v.pause() }

function toggleCircle(e, msgId) {
  const video = document.getElementById('circle-' + msgId)
  if (!video) return
  if (video.paused) {
    video.play()
    playingCircles.value[msgId] = true
  } else {
    video.pause()
    playingCircles.value[msgId] = false
  }
}

function toggleMute(msgId) {
  const video = document.getElementById('circle-' + msgId)
  if (!video) return
  video.muted = !video.muted
  mutedCircles.value[msgId] = video.muted
}

function getCircleDuration(msgId) {
  return circleDurations.value[msgId] || '0:00'
}

function getCircleCurrentTime(msgId) {
  return circleCurrentTime.value[msgId] || circleDurations.value[msgId] || '0:00'
}

function onCircleLoaded(e, msgId) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  circleDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  circleCurrentTime.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
}

function onCircleTimeUpdate(e, msgId) {
  const video = e.target
  const current = video.currentTime
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  circleCurrentTime.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
}

function toggleVoice(e, msgId) {
  const audio = document.getElementById('voice-' + msgId)
  if (!audio) return
  
  Object.keys(playingVoices.value).forEach(id => {
    if (id !== msgId && playingVoices.value[id]) {
      const otherAudio = document.getElementById('voice-' + id)
      if (otherAudio) otherAudio.pause()
      playingVoices.value[id] = false
    }
  })
  
  if (audio.paused) {
    audio.play()
    playingVoices.value[msgId] = true
  } else {
    audio.pause()
    playingVoices.value[msgId] = false
  }
}

function onVoiceEnded(msgId) {
  playingVoices.value[msgId] = false
  voiceProgress.value[msgId] = 0
  if (voiceTotalDurations.value[msgId]) {
    voiceDurations.value[msgId] = voiceTotalDurations.value[msgId]
  }
}

function onVoiceLoaded(e, msgId) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`
  voiceDurations.value[msgId] = formatted
  voiceTotalDurations.value[msgId] = formatted
  voiceProgress.value[msgId] = 0
}

function onVoiceTimeUpdate(e, msgId) {
  const audio = e.target
  const current = audio.currentTime
  const duration = audio.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  voiceDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  voiceProgress.value[msgId] = duration > 0 ? (current / duration) * 100 : 0
}

function getVoiceDuration(msgId) {
  return voiceDurations.value[msgId] || '0:00'
}

function getVoiceProgress(msgId) {
  return voiceProgress.value[msgId] || 0
}

function isWaveBarActive(msgId, barIndex, totalBars) {
  const progress = voiceProgress.value[msgId] || 0
  const barProgress = (barIndex / totalBars) * 100
  return barProgress <= progress
}

function getWaveHeight(i) {
  const heights = [8, 12, 18, 14, 22, 16, 20, 12, 24, 18, 14, 20, 16, 22, 12, 18, 14, 20, 16, 10]
  return heights[(i - 1) % heights.length]
}

function insertEmoji(emoji) { const input = msgInput.value; if (input) { const start = input.selectionStart, end = input.selectionEnd; newMessage.value = newMessage.value.substring(0, start) + emoji + newMessage.value.substring(end); nextTick(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length) }) } else newMessage.value += emoji }
function handleMediaSelect(e) { const file = e.target.files[0]; if (!file) return; mediaFile.value = file; mediaPreview.value = URL.createObjectURL(file); mediaType.value = file.type.startsWith('image/') ? 'image' : 'video'; e.target.value = '' }
function clearMedia() { if (mediaPreview.value) URL.revokeObjectURL(mediaPreview.value); mediaFile.value = null; mediaPreview.value = null; mediaType.value = null }

async function startVoice() { 
  try { 
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    function updateLevels() {
      analyser.getByteFrequencyData(dataArray)
      const levels = []
      for (let i = 0; i < 24; i++) {
        const idx = Math.floor(i * dataArray.length / 24)
        const val = dataArray[idx] / 255
        levels.push(Math.max(4, val * 28))
      }
      voiceRecLevels.value = levels
      animationId = requestAnimationFrame(updateLevels)
    }
    updateLevels()
    
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => { 
      if (recordedChunks.length > 0) { 
        const blob = new Blob(recordedChunks, { type: 'audio/webm' })
        mediaFile.value = new File([blob], 'voice.webm', { type: 'audio/webm' })
        mediaPreview.value = URL.createObjectURL(blob)
        mediaType.value = 'voice'
        sendMessage() 
      } 
      stream.getTracks().forEach(t => t.stop())
      recordedChunks = []
      if (animationId) cancelAnimationFrame(animationId)
      if (audioContext) audioContext.close()
      voiceRecLevels.value = Array(24).fill(4)
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000) 
  } catch { 
    notifications.error('Нет доступа к микрофону') 
  } 
}
function stopVoice() { if (mediaRecorder && mediaRecorder.state !== 'inactive' && isRecording.value) { mediaRecorder.stop(); isRecording.value = false; clearInterval(recordingInterval) } }

let clickPrevented = false

function onVoiceBtnClick() {
  if (clickPrevented) {
    clickPrevented = false
    return
  }
  if (voiceBtnMode.value === 'voice') {
    startVoice()
  } else {
    startCircle()
  }
}

function onVoiceMouseDown(e) {
  mouseDownOnVoice.value = true
  mouseDragStartY.value = e.clientY
}
function onVoiceMouseMove(e) {
  if (!mouseDownOnVoice.value) return
  const diff = e.clientY - mouseDragStartY.value
  if (diff > 30) {
    voiceBtnMode.value = voiceBtnMode.value === 'voice' ? 'circle' : 'voice'
    mouseDownOnVoice.value = false
    clickPrevented = true
  }
}
function onVoiceMouseUp() {
  mouseDownOnVoice.value = false
}

function onVoiceBtnDown(e) {
  const touch = e.touches[0]
  voiceBtnStartX.value = touch.clientX
  voiceBtnStartY.value = touch.clientY
}
function onVoiceBtnUp() {
  if (voiceBtnStartX.value) {
    if (voiceBtnMode.value === 'voice') {
      startVoice()
    } else {
      startCircle()
    }
  }
  voiceBtnStartX.value = 0
  voiceBtnStartY.value = 0
}
function onVoiceBtnTouchMove(e) {
  if (!voiceBtnStartY.value || !e.touches[0]) return
  const touch = e.touches[0]
  const diffY = voiceBtnStartY.value - touch.clientY
  if (diffY > 30) {
    voiceBtnMode.value = voiceBtnMode.value === 'voice' ? 'circle' : 'voice'
    voiceBtnStartX.value = 0
    voiceBtnStartY.value = 0
  }
}
async function startCircle() { try { circlePaused.value = false; circleMuted.value = false; stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value, width: 480, height: 480 }, audio: true }); showCircleOverlay.value = true; await nextTick(); if (circlePreviewEl.value) circlePreviewEl.value.srcObject = stream; mediaRecorder = new MediaRecorder(stream); recordedChunks = []; mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }; mediaRecorder.onstop = () => { if (recordedChunks.length > 0) { const blob = new Blob(recordedChunks, { type: 'video/webm' }); mediaFile.value = new File([blob], 'circle.webm', { type: 'video/webm' }); mediaPreview.value = URL.createObjectURL(blob); mediaType.value = 'circle'; sendMessage() } stream.getTracks().forEach(t => t.stop()); showCircleOverlay.value = false }; mediaRecorder.start(); recordingTime.value = 0; recordingInterval = setInterval(() => recordingTime.value++, 1000) } catch { notifications.error('Нет доступа к камере'); showCircleOverlay.value = false } }
function stopCircle() { if (mediaRecorder) { mediaRecorder.stop(); clearInterval(recordingInterval) } }
function toggleCirclePause() { if (!mediaRecorder) return; if (circlePaused.value) { mediaRecorder.resume(); recordingInterval = setInterval(() => recordingTime.value++, 1000); circlePaused.value = false } else { mediaRecorder.pause(); clearInterval(recordingInterval); circlePaused.value = true } }
function toggleCircleRecMute() { circleMuted.value = !circleMuted.value; if (stream) { stream.getAudioTracks().forEach(t => t.enabled = !circleMuted.value) } }
async function switchCamera() { facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'; if (stream) { stream.getTracks().forEach(t => t.stop()); try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value, width: 480, height: 480 }, audio: !circleMuted.value }); if (circlePreviewEl.value) circlePreviewEl.value.srcObject = stream } catch { notifications.error('Не удалось переключить камеру') } } }
function cancelRecording() { 
  const wasRecording = isRecording.value
  isRecording.value = false
  showCircleOverlay.value = false
  clearInterval(recordingInterval)
  recordedChunks = []
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onstop = () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (animationId) cancelAnimationFrame(animationId)
      if (audioContext) { audioContext.close(); audioContext = null }
    }
    mediaRecorder.stop()
  } else {
    if (stream) stream.getTracks().forEach(t => t.stop())
    if (animationId) cancelAnimationFrame(animationId)
    if (audioContext) { audioContext.close(); audioContext = null }
  }
  
  clearMedia()
}

async function fetchDialogs() { try { const res = await api.get('/messages/dialogs'); dialogs.value = res.data } catch (err) { console.log('Failed to fetch dialogs:', err) } finally { loading.value = false } }
async function selectDialog(userId) { 
  saveScrollPosition()
  selectedUserId.value = userId
  currentChatUserId.value = userId
  chatLoading.value = true
  messages.value = []
  try { 
    const [userRes, msgRes] = await Promise.all([api.get(`/users/${userId}`), api.get(`/messages/${userId}`)])
    chatUser.value = userRes.data
    messages.value = msgRes.data
    restoreScrollPosition(userId)
    await api.post(`/messages/${userId}/read`) 
  } catch (err) { notifications.error(err.message) } finally { chatLoading.value = false } 
}
async function pollMessages() { 
  if (!selectedUserId.value) return
  try { 
    const res = await api.get(`/messages/${selectedUserId.value}`)
    if (res.data.length !== messages.value.length) { 
      const container = messagesContainer.value
      const wasAtBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight < 100)
      
      messages.value = res.data
      
      if (wasAtBottom) {
        nextTick(() => { if (container) container.scrollTop = container.scrollHeight })
      }
      
      await api.post(`/messages/${selectedUserId.value}/read`) 
    } 
  } catch {} 
}
async function sendMessage() { if (!canSend.value || !selectedUserId.value) return; try { const formData = new FormData(); if (newMessage.value.trim()) formData.append('content', newMessage.value.trim()); if (mediaFile.value) { formData.append('media', mediaFile.value); formData.append('mediaType', mediaType.value) }; const res = await api.post(`/messages/${selectedUserId.value}`, formData); messages.value.push(res.data); newMessage.value = ''; clearMedia(); scrollToBottom(); fetchDialogs() } catch (err) { notifications.error(err.message) } }

function openMsgMenu(e, msg) { selectedMsg.value = msg; msgMenuX.value = Math.min(e.clientX, window.innerWidth - 200); msgMenuY.value = Math.min(e.clientY, window.innerHeight - 150); showMsgMenu.value = true }
function closeMsgMenu() { showMsgMenu.value = false; selectedMsg.value = null }
function forwardMessage() { showMsgMenu.value = false; showForwardModal.value = true }
async function doForward(toUserId) { if (!selectedMsg.value) return; try { await api.post('/messages/forward', { messageId: selectedMsg.value.id, toUserId }); showForwardModal.value = false; selectedMsg.value = null } catch (err) { notifications.error(err.message) } }
async function deleteForAll() { if (!selectedMsg.value) return; try { await api.delete(`/messages/${selectedMsg.value.id}?forAll=true`); messages.value = messages.value.filter(m => m.id !== selectedMsg.value.id); closeMsgMenu() } catch (err) { notifications.error(err.message) } }
async function deleteForMe() { if (!selectedMsg.value) return; try { await api.delete(`/messages/${selectedMsg.value.id}`); messages.value = messages.value.filter(m => m.id !== selectedMsg.value.id); closeMsgMenu() } catch (err) { notifications.error(err.message) } }
function openMediaViewer(src, type) { viewerSrc.value = src; viewerType.value = type; showMediaViewerModal.value = true }

function handleClickOutside(e) { if (showMsgMenu.value && !e.target.closest('.msg-menu')) closeMsgMenu() }

onMounted(() => { fetchDialogs(); pollInterval = setInterval(() => { pollMessages(); fetchDialogs() }, 3000); if (route.params.id) selectDialog(route.params.id); document.addEventListener('click', handleClickOutside); window.addEventListener('resize', handleResize) })
onUnmounted(() => { clearInterval(pollInterval); if (stream) stream.getTracks().forEach(t => t.stop()); document.removeEventListener('click', handleClickOutside); window.removeEventListener('resize', handleResize); currentChatUserId.value = null })
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
.dialog-item:hover, .dialog-item.active { background: rgba(255,255,255,0.04); }
.dialog-item.unread { background: rgba(255,255,255,0.03); }
.dialog-avatar-wrap, .chat-avatar-wrap { position: relative; flex-shrink: 0; }
.online-indicator { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background: #3b82f6; border: 3px solid var(--bg-primary); border-radius: 50%; }
.dialog-content { flex: 1; min-width: 0; }
.dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.dialog-name { font-weight: 600; font-size: 15px; }
.dialog-time { font-size: 12px; color: var(--text-muted); }
.dialog-bottom { display: flex; align-items: center; gap: 8px; }
.dialog-preview { flex: 1; font-size: 14px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dialog-preview .you { color: var(--text-muted); }
.unread-badge { min-width: 20px; height: 20px; padding: 0 6px; background: #3b82f6; color: white; font-size: 12px; font-weight: 600; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.read-check { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
.chat-empty { align-items: center; justify-content: center; gap: 16px; text-align: center; }
.empty-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--text-muted); }
.chat-empty h3 { font-size: 20px; font-weight: 600; }
.chat-empty p { color: var(--text-secondary); }
.chat-panel { display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border-radius: var(--radius-lg); flex-shrink: 0; }
.back-btn:hover { background: rgba(255,255,255,0.04); }
.back-btn svg { width: 20px; height: 20px; }
.chat-user { display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 16px; }
.user-status { font-size: 13px; color: var(--text-muted); }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 6px; background: url('/chat-pattern.svg') repeat; background-size: 400px 400px; }
.message { display: flex; gap: 8px; max-width: 70%; }
.message.own { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { flex-shrink: 0; align-self: flex-end; }
.msg-avatar .avatar-sm { width: 28px; height: 28px; }
.message-content { display: flex; flex-direction: column; min-width: 0; }
.msg-sender { display: none; }
.message.own .msg-avatar { display: none; }
.message-bubble { display: inline-block; padding: 8px 12px; border-radius: 18px; position: relative; }
.message:not(.own) .message-bubble { background: #262626; border-bottom-left-radius: 4px; }
.message.own .message-bubble { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-bottom-right-radius: 4px; }
.forwarded-label { display: block; font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 4px; font-style: italic; }
.message-text-wrap { display: inline; }
.message-bubble p { display: inline; word-break: break-word; line-height: 1.4; font-size: 15px; }
.message-time { display: inline; font-size: 11px; color: rgba(255,255,255,0.5); margin-left: 8px; vertical-align: bottom; }
.message.own .message-time { color: rgba(255,255,255,0.7); }
.message-media { max-width: 100%; max-height: 250px; border-radius: 12px; margin-bottom: 6px; cursor: pointer; display: block; }
.circle-video { width: 180px; height: 180px; border-radius: 50%; overflow: hidden; margin-bottom: 6px; cursor: pointer; }
.circle-player { width: 100%; height: 100%; object-fit: cover; }
.voice-message { width: 180px; height: 36px; margin-bottom: 6px; }

.circle-message { display: flex; flex-direction: column; align-items: flex-end; }
.message:not(.own) .circle-message { align-items: flex-start; }
.circle-video-wrap { position: relative; width: 240px; height: 240px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); }
.circle-video-wrap .circle-player { width: 100%; height: 100%; object-fit: cover; }
.circle-overlay-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
.circle-overlay-icon svg { width: 48px; height: 48px; color: white; }
.circle-mute { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.circle-mute svg { width: 18px; height: 18px; color: white; }
.circle-info { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 6px; padding: 0 4px; }
.circle-timer { font-size: 11px; color: var(--text-secondary); }
.circle-info .message-time { font-size: 11px; color: rgba(255,255,255,0.35); }

.voice-message-wrap { display: flex; align-items: center; gap: 10px; background: rgba(30,30,30,0.95); padding: 10px 14px; border-radius: 20px; min-width: 200px; max-width: 280px; }
.message.own .voice-message-wrap { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.voice-play-btn { width: 44px; height: 44px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; transition: transform 0.15s; }
.voice-play-btn:hover { transform: scale(1.05); }
.voice-play-btn:active { transform: scale(0.95); }
.voice-play-btn svg { width: 20px; height: 20px; color: #1a1a1a; margin-left: 2px; }
.voice-wave-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.voice-waveform { display: flex; align-items: center; gap: 2px; height: 28px; }
.wave-bar { width: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; transition: background 0.15s; }
.wave-bar.active { background: rgba(255,255,255,0.9); }
.message.own .wave-bar { background: rgba(255,255,255,0.4); }
.message.own .wave-bar.active { background: rgba(255,255,255,1); }
.voice-bottom { display: flex; justify-content: space-between; align-items: center; }
.voice-duration { font-size: 12px; color: rgba(255,255,255,0.6); }
.message.own .voice-duration { color: rgba(255,255,255,0.8); }
.voice-msg-time { font-size: 12px; color: rgba(255,255,255,0.35); }
.message.own .voice-msg-time { color: rgba(255,255,255,0.5); }

.message.media-message .message-content { background: none; }
.message.media-message { max-width: none; }

.media-preview { position: absolute; bottom: 70px; left: 16px; right: 16px; padding: 12px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-radius: 16px; }
.media-preview img, .media-preview video { max-height: 120px; max-width: 160px; border-radius: 12px; }
.media-preview video.circle { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.voice-preview { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
.voice-preview svg { width: 24px; height: 24px; }
.clear-media { position: absolute; top: 8px; right: 16px; width: 28px; height: 28px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.clear-media svg { width: 14px; height: 14px; }
.recording-indicator { display: flex; align-items: center; gap: 12px; padding: 16px 20px; color: var(--text-secondary); }
.recording-dot { width: 12px; height: 12px; background: #ff4444; border-radius: 50%; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.cancel-rec { margin-left: auto; color: var(--text-muted); font-size: 14px; }

.voice-rec-left { display: flex; align-items: center; gap: 10px; }
.voice-rec-dot { width: 10px; height: 10px; background: #ff4466; border-radius: 50%; animation: pulse 1s infinite; }
.voice-rec-time { font-size: 15px; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.voice-rec-cancel { flex: 1; text-align: center; color: var(--text-secondary); font-size: 15px; }
.voice-rec-send { width: 44px; height: 44px; background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.voice-rec-send svg { width: 20px; height: 20px; }

.circle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.circle-rec-container { position: relative; display: flex; align-items: center; justify-content: center; }
.circle-rec-video-wrap { position: relative; width: 300px; height: 300px; }
.circle-progress-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.circle-progress-bar { transition: stroke-dashoffset 0.3s linear; }
.circle-preview-video { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 280px; height: 280px; border-radius: 50%; object-fit: cover; }
.circle-rec-pause { position: absolute; right: -70px; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; background: rgba(60,60,60,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.circle-rec-pause svg { width: 20px; height: 20px; }
.circle-rec-controls { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; max-width: 400px; margin-top: 40px; padding: 0 10px; }
.circle-rec-left { display: flex; gap: 12px; }
.circle-rec-btn { width: 44px; height: 44px; background: rgba(60,60,60,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.circle-rec-btn.active { background: rgba(255,100,100,0.3); color: #ff6666; }
.circle-rec-btn svg { width: 22px; height: 22px; }
.circle-rec-bottom { display: flex; align-items: center; gap: 10px; }
.circle-rec-dot { width: 10px; height: 10px; background: #ff4466; border-radius: 50%; animation: pulse 1s infinite; }
.circle-rec-time { font-size: 15px; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.circle-rec-cancel { color: var(--text-secondary); font-size: 15px; margin-left: 16px; }
.circle-rec-send { width: 56px; height: 56px; background: rgba(60,60,60,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.circle-rec-send svg { width: 26px; height: 26px; }

.chat-input { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.voice-recording-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
.input-actions-left, .input-actions-right { display: flex; }
.action-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); border-radius: 50%; transition: all 0.2s; cursor: pointer; background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
.action-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.action-btn svg { width: 22px; height: 22px; }
.input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.input-wrap input { width: 100%; border-radius: 22px; padding: 12px 50px 12px 18px; background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); font-size: 16px; color: white; }
.input-wrap input::placeholder { color: rgba(255,255,255,0.4); }
.input-wrap :deep(.emoji-wrap) { position: absolute; right: 12px; }
.send-btn { width: 44px; height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.send-btn:hover:not(:disabled) { transform: scale(1.05); }
.send-btn:disabled { opacity: 0.5; }
.send-btn svg { width: 20px; height: 20px; }
.voice-btn { background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.voice-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.msg-menu { position: fixed; z-index: 500; min-width: 180px; padding: 6px; }
.menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; color: var(--text-secondary); border-radius: var(--radius); font-size: 14px; }
.menu-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.menu-item.danger { color: #ff6666; }
.menu-item.danger:hover { background: rgba(255,100,100,0.1); }
.menu-item svg { width: 18px; height: 18px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.close-btn { color: var(--text-muted); padding: 4px; }
.close-btn svg { width: 20px; height: 20px; }
.forward-list { padding: 8px; }
.forward-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-lg); cursor: pointer; }
.forward-item:hover { background: rgba(255,255,255,0.08); }
.forward-item span { font-weight: 500; }
.media-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; display: flex; align-items: center; justify-content: center; }
.viewer-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; z-index: 10; }
.viewer-close:hover { background: rgba(255,255,255,0.2); }
.viewer-close svg { width: 24px; height: 24px; }
.viewer-content img, .viewer-content video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .messages-container { grid-template-columns: 1fr; }
  .messages-container .chat-empty { display: none; }
  .messages-container .chat-panel { display: none; }
  .messages-container.show-chat .dialogs-panel { display: none; }
  .messages-container.show-chat .chat-panel { display: flex; }
}
@media (max-width: 768px) { 
  .messages-page { padding: 0; padding-bottom: 0; }
  .messages-container { height: 100vh; gap: 0; }
  .messages-container:not(.show-chat) { padding-bottom: 72px; }
  
  .dialogs-panel { 
    background: transparent; 
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .dialogs-header { 
    padding: 20px 16px 16px;
    border-bottom: none;
  }
  
  .dialogs-header h1 { 
    font-size: 28px; 
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  
  .dialogs-list { 
    padding: 0 8px; 
  }
  
  .dialog-item { 
    padding: 10px 12px;
    border-radius: 16px;
    gap: 14px;
    margin-bottom: 2px;
  }
  
  .dialog-item:hover,
  .dialog-item.active { 
    background: rgba(255,255,255,0.04); 
  }
  
  .dialog-item:active {
    background: rgba(255,255,255,0.06);
  }
  
  .dialog-item.unread {
    background: rgba(59, 130, 246, 0.08);
  }
  
  .dialog-avatar-wrap .avatar {
    width: 56px;
    height: 56px;
  }
  
  .online-indicator {
    width: 14px;
    height: 14px;
    border-width: 2px;
    background: #22c55e;
  }
  
  .dialog-name { 
    font-size: 16px;
    font-weight: 600;
  }
  
  .dialog-item.unread .dialog-name {
    font-weight: 700;
  }
  
  .dialog-time { 
    font-size: 13px;
  }
  
  .dialog-preview { 
    font-size: 14px;
    color: var(--text-muted);
  }
  
  .read-check {
    color: #3b82f6;
    width: 16px;
    height: 16px;
  }
  
  .messages-container.show-chat {
    padding-bottom: 0;
  }
  
  .chat-panel {
    background: var(--bg-primary);
    border: none;
    border-radius: 0;
    height: 100vh;
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  
  .chat-header {
    padding: 10px 12px;
    background: rgba(14, 14, 14, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    gap: 10px;
  }
  
  .back-btn {
    width: 40px;
    height: 40px;
    margin-left: -4px;
  }
  
  .back-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .chat-user .avatar {
    width: 42px;
    height: 42px;
  }
  
  .chat-avatar-wrap .online-indicator {
    width: 12px;
    height: 12px;
  }
  
  .user-name {
    font-size: 16px;
    font-weight: 600;
  }
  
  .user-status {
    font-size: 13px;
  }
  
  .chat-messages {
    padding: 8px 12px;
    flex: 1;
    -webkit-overflow-scrolling: touch;
  }
  
  .message {
    max-width: 80%;
  }
  
  .message-bubble {
    padding: 10px 14px;
    border-radius: 20px;
  }
  
  .message:not(.own) .message-bubble {
    border-bottom-left-radius: 6px;
  }
  
  .message.own .message-bubble {
    border-bottom-right-radius: 6px;
  }
  
  .message-bubble p {
    font-size: 16px;
  }
  
  .message-time {
    font-size: 12px;
  }
  
  .message-media {
    max-width: 240px;
    border-radius: 16px;
  }
  
  .circle-video {
    width: 200px;
    height: 200px;
  }
  
  .msg-avatar {
    display: none;
  }
  
  .chat-input {
    padding: 8px 10px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    gap: 6px;
  }
  
  .input-wrap input {
    padding: 12px 16px;
    padding-right: 44px;
    font-size: 16px;
    background: rgba(255,255,255,0.06);
    border-radius: 24px;
  }
  
  .action-btn {
    width: 42px;
    height: 42px;
  }
  
  .action-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .send-btn {
    width: 42px;
    height: 42px;
  }
  
  .media-preview {
    padding: 10px 12px;
  }
  
  .circle-video-wrap {
    width: 200px;
    height: 200px;
  }
  
  .circle-overlay-icon svg {
    width: 40px;
    height: 40px;
  }
  
  .circle-mute {
    width: 32px;
    height: 32px;
  }
  
  .circle-mute svg {
    width: 16px;
    height: 16px;
  }
  
  .circle-timer,
  .circle-info .message-time {
    font-size: 12px;
  }
  
  .voice-message-wrap {
    min-width: 180px;
    max-width: 260px;
    padding: 8px 12px;
    gap: 8px;
  }
  
  .voice-play-btn {
    width: 40px;
    height: 40px;
  }
  
  .voice-play-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .voice-waveform {
    height: 24px;
  }
  
  .wave-bar {
    width: 2.5px;
  }
  
  .voice-duration,
  .voice-msg-time {
    font-size: 11px;
  }
}
</style>
