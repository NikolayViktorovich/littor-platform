<template>
  <article class="post glass" :class="{ 'menu-open': menuOpen, 'pinned': post.isPinned && !hidePin }">
    <div v-if="post.isPinned && !hidePin" class="pinned-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 15v6m-5-17h10m-8 0v6l-2 3v2h10v-2l-2-3V4"/>
      </svg>
      {{ t('pinned') }}
    </div>
    <div class="post-header">
      <router-link :to="`/profile/${post.author.id}`" class="post-author">
        <img :src="authorAvatar" class="avatar" alt="" @error="handleAvatarError">
        <div class="author-info">
          <span class="author-name">{{ post.author.name }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </router-link>
      
      <div class="post-menu-wrap">
        <button @click.stop="toggleMenu" class="post-menu-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="18" r="1.5"/>
          </svg>
        </button>
        
        <Transition name="menu" @after-leave="menuOpen = false">
          <div v-if="showMenu" class="post-dropdown glass-modal" v-click-outside="closeMenu">
            <button @click="handlePin" class="dropdown-item" v-if="isOwner && !hidePin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15v6m-5-17h10m-8 0v6l-2 3v2h10v-2l-2-3V4"/>
              </svg>
              {{ post.isPinned ? t('unpinPost') : t('pinPost') }}
            </button>
            <button @click="handleToggleComments" class="dropdown-item" v-if="isOwner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10zM9 9h6"/>
              </svg>
              {{ post.commentsDisabled ? t('enableComments') : t('disableComments') }}
            </button>
            <button @click="copyLink" class="dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {{ t('copyLink') }}
            </button>
            
            <template v-if="isOwner">
              <div class="dropdown-divider"></div>
              <button @click="handleArchive" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
                </svg>
                {{ post.isArchived ? t('unarchive') : t('archive') }}
              </button>
              <button @click="handleDelete" class="dropdown-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M10 11v6M14 11v6"/>
                </svg>
                {{ t('delete') }}
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <p v-if="post.content" class="post-content" v-html="formatContent(post.content)"></p>
    
    <!-- Multiple media - visual gallery (images, videos, gifs) -->
    <div v-if="visualMedia.length > 0" class="post-media-gallery" :class="'media-count-' + Math.min(visualMedia.length, 4)">
      <div v-for="(item, index) in visualMedia.slice(0, 4)" :key="item.id" class="media-gallery-item" :class="{ 'has-more': index === 3 && visualMedia.length > 4 }" @click="openMediaGallery(index)">
        <img v-if="item.mediaType === 'image' || item.mediaType === 'gif'" :src="item.url" alt="">
        <video v-else-if="item.mediaType === 'video'" :src="item.url" @click.stop controls></video>
        <div v-if="index === 3 && visualMedia.length > 4" class="more-overlay">+{{ visualMedia.length - 4 }}</div>
      </div>
    </div>
    
    <div v-if="fileMedia.length > 0" class="post-files-list">
      <template v-for="(item, index) in fileMedia" :key="item.id">
        <div v-if="item.mediaType === 'audio'" class="post-audio-wrap" @click="toggleMediaAudio(index, item)">
          <button class="audio-play-btn" @click.stop="toggleMediaAudio(index, item)">
            <svg v-if="!isMediaAudioPlaying(item.url)" class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
            <svg v-else class="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
          </button>
          <div class="audio-info">
            <div class="audio-name">{{ item.fileName || t('audioTrack') }}</div>
            <div class="audio-meta">{{ getMediaAudioTime(item.url) }} · {{ item.artist || t('unknownArtist') }}</div>
          </div>
        </div>
        <div v-else class="post-file-wrap" @click="downloadMediaFile(item)">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"/></svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ item.fileName || t('file') }}</div>
            <div class="file-size">{{ formatFileSize(item.fileSize) }}</div>
          </div>
          <div class="file-download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </div>
        </div>
      </template>
    </div>
    
    <template v-else-if="post.image && (!post.media || post.media.length === 0)">
      <div v-if="post.mediaType === 'image' || !post.mediaType" class="post-image-wrap" @click="openMedia">
        <img :src="postImage" class="post-image" alt="" @error="handleImageError" @load="imageLoaded = true">
        <div v-if="!imageLoaded" class="image-placeholder skeleton"></div>
      </div>
    
    <div v-else-if="post.image && post.mediaType === 'gif'" class="post-image-wrap">
      <img :src="postImage" class="post-image post-gif" alt="" @error="handleImageError">
    </div>
    
    <div v-else-if="post.image && post.mediaType === 'video'" class="post-image-wrap">
      <video :src="postImage" class="post-image post-video" controls></video>
    </div>
    
    <div v-else-if="post.image && post.mediaType === 'audio'" class="post-audio-wrap" @click="togglePostAudio">
      <button class="audio-play-btn" @click.stop="togglePostAudio">
        <svg v-if="!isPostAudioPlaying" class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
        <svg v-else class="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
      </button>
      <div class="audio-info">
        <div class="audio-name">{{ post.fileName || 'Аудио' }}</div>
        <div class="audio-meta">{{ postAudioTime }} · {{ post.artist || 'Неизвестный исполнитель' }}</div>
      </div>
    </div>
    
    <div v-else-if="post.image && post.mediaType === 'file'" class="post-file-wrap" @click="downloadFile">
      <div class="file-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"/></svg>
      </div>
      <div class="file-info">
        <div class="file-name">{{ post.fileName || t('file') }}</div>
        <div class="file-size">{{ formatFileSize(post.fileSize) }}</div>
      </div>
      <div class="file-download">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      </div>
    </div>
    
    <div v-else-if="post.image && isVideo" class="post-image-wrap">
      <video :src="postImage" class="post-image post-video" controls></video>
    </div>
    </template>

    <div v-if="post.musicTrackId" class="post-music" @click="playMusic">
      <div class="music-artwork">
        <img v-if="post.musicArtwork" :src="post.musicArtwork" alt="">
        <div v-else class="artwork-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <div class="play-overlay">
          <svg v-if="isMusicPlaying" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="music-info">
        <span class="music-title">{{ post.musicTitle }}</span>
        <span class="music-artist">{{ post.musicArtist }}</span>
      </div>
    </div>

    <div class="post-actions">
      <button @click="handleLike" class="action-btn" :class="{ active: post.isLiked, pressed: likePressed }">
        <svg viewBox="0 0 24 24" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span v-if="post.likesCount" class="count">{{ formatCount(post.likesCount) }}</span>
      </button>
      
      <button @click="handleComment" class="action-btn" :class="{ active: showComments, pressed: commentPressed, disabled: post.commentsDisabled }" :disabled="post.commentsDisabled">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span v-if="post.commentsCount" class="count">{{ formatCount(post.commentsCount) }}</span>
      </button>

      <button @click="handleShare" class="action-btn" :class="{ pressed: sharePressed }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </div>

    <Transition name="comments">
      <div v-if="showComments" class="comments-section">
        <div v-if="loadingComments" class="comments-loading">
          <div class="spinner"></div>
        </div>
        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment">
            <router-link :to="`/profile/${comment.author.id}`" class="comment-avatar">
              <img :src="getAvatarUrl(comment.author.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            </router-link>
            <div class="comment-body">
              <div class="comment-header">
                <router-link :to="`/profile/${comment.author.id}`" class="comment-author">
                  {{ comment.author.name }}
                </router-link>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-actions">
                <button class="comment-action" :class="{ active: comment.isLiked }" @click="likeComment(comment)">
                  <svg viewBox="0 0 24 24" :fill="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  <span v-if="comment.likesCount">{{ formatCount(comment.likesCount) }}</span>
                </button>
                <button class="comment-action" @click="startReply(comment)">{{ t('replyTo') }}</button>
                <button v-if="canDeleteComment(comment)" class="comment-action delete" @click="deleteComment(comment)">{{ t('delete') }}</button>
              </div>
              
              <div v-if="comment.replies?.length" class="replies">
                <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
                  <router-link :to="`/profile/${reply.author.id}`" class="comment-avatar">
                    <img :src="getAvatarUrl(reply.author.avatar)" class="avatar avatar-xs" alt="" @error="handleAvatarError">
                  </router-link>
                  <div class="comment-body">
                    <div class="comment-header">
                      <router-link :to="`/profile/${reply.author.id}`" class="comment-author">
                        {{ reply.author.name }}
                      </router-link>
                      <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ reply.content }}</p>
                    <div class="comment-actions">
                      <button class="comment-action" :class="{ active: reply.isLiked }" @click="likeComment(reply)">
                        <svg viewBox="0 0 24 24" :fill="reply.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span v-if="reply.likesCount">{{ formatCount(reply.likesCount) }}</span>
                      </button>
                      <button class="comment-action" @click="startReply(reply, comment)">{{ t('replyTo') }}</button>
                      <button v-if="canDeleteComment(reply)" class="comment-action delete" @click="deleteReply(comment, reply)">{{ t('delete') }}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="addComment" class="comment-form" :class="{ 'reply-mode': isReplyMode }">
          <div class="comment-input-wrap">
            <input v-model="newComment" :placeholder="replyingTo ? t('replyToComment').replace('{name}', replyingTo.author.name) : t('writeComment')" required ref="commentInput">
            <EmojiPicker @select="insertCommentEmoji" class="comment-emoji" />
            <button v-if="!replyingTo" type="submit" class="inside-btn send-inside" :disabled="!newComment.trim()" key="send-inside">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button v-else type="button" class="inside-btn cancel-inside" @click="cancelReply" key="cancel-inside">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="outside-btn-wrap">
            <button type="submit" class="outside-btn" :disabled="!newComment.trim()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </article>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { useSocket } from '../socket'
import { useI18n } from '../i18n'
import EmojiPicker from './EmojiPicker.vue'
import api from '../api'

const { t } = useI18n()

const props = defineProps({
  post: { type: Object, required: true },
  hidePin: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'update', 'open-media'])

const authStore = useAuthStore()
const audioPlayerStore = useAudioPlayerStore()
const { on, off, joinPost, leavePost } = useSocket()
const showComments = ref(false)
const showMenu = ref(false)
const menuOpen = ref(false)
const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const replyingTo = ref(null)
const replyingToParentId = ref(null)
const isReplyMode = ref(false)
const imageLoaded = ref(false)
const likePressed = ref(false)
const commentPressed = ref(false)
const sharePressed = ref(false)
const commentInput = ref(null)

const audioEl = ref(null)
const isAudioPlaying = ref(false)
const audioDuration = ref('0:00')
const audioProgress = ref(0)

const isPostAudioPlaying = computed(() => {
  return audioPlayerStore.currentTrack?.url === props.post.image && audioPlayerStore.isPlaying
})

const postAudioProgress = computed(() => {
  if (audioPlayerStore.currentTrack?.url === props.post.image) {
    return audioPlayerStore.progress
  }
  return 0
})

const postAudioTime = computed(() => {
  if (audioPlayerStore.currentTrack?.url === props.post.image) {
    return audioPlayerStore.formattedCurrentTime
  }
  return '0:00'
})

const isMusicPlaying = computed(() => {
  return audioPlayerStore.currentTrack?.id === props.post.musicTrackId && audioPlayerStore.isPlaying
})

async function playMusic() {
  if (!props.post.musicTrackId) return
  
  if (audioPlayerStore.currentTrack?.id === props.post.musicTrackId) {
    if (audioPlayerStore.isPlaying) {
      audioPlayerStore.pause()
    } else {
      audioPlayerStore.resume()
    }
    return
  }
  
  try {
    const res = await api.get(`/music/stream/${props.post.musicTrackId}`)
    audioPlayerStore.play({
      id: props.post.musicTrackId,
      url: res.data.url,
      name: props.post.musicTitle,
      source: props.post.musicArtist,
      artwork: props.post.musicArtwork
    })
    
    api.post('/music/history', {
      trackId: props.post.musicTrackId,
      title: props.post.musicTitle,
      artist: props.post.musicArtist,
      artwork: props.post.musicArtwork
    }).catch(() => {})
  } catch (err) {
    console.error('Failed to play music:', err)
  }
}

function togglePostAudio() {
  if (audioPlayerStore.currentTrack?.url === props.post.image && audioPlayerStore.isPlaying) {
    audioPlayerStore.pause()
  } else {
    audioPlayerStore.play({
      url: props.post.image,
      name: props.post.fileName || t('audioTrack'),
      source: props.post.author.name
    })
  }
}

function onAudioEnded() {
  isAudioPlaying.value = false
  audioProgress.value = 0
}

function onAudioLoaded() {
  if (!audioEl.value) return
  const duration = audioEl.value.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  audioDuration.value = `${mins}:${secs.toString().padStart(2, '0')}`
}

function onAudioTimeUpdate() {
  if (!audioEl.value) return
  const current = audioEl.value.currentTime
  const duration = audioEl.value.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  audioDuration.value = `${mins}:${secs.toString().padStart(2, '0')}`
  audioProgress.value = duration > 0 ? (current / duration) * 100 : 0
}

function seekPostAudio(e) {
  if (audioPlayerStore.currentTrack?.url !== props.post.image) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  audioPlayerStore.seek(percent)
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

function downloadFile() {
  const a = document.createElement('a')
  a.href = props.post.image
  a.download = props.post.fileName || 'file'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function insertCommentEmoji(emoji) {
  const input = commentInput.value
  if (input) {
    const start = input.selectionStart
    const end = input.selectionEnd
    newComment.value = newComment.value.substring(0, start) + emoji + newComment.value.substring(end)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  } else {
    newComment.value += emoji
  }
}

const isOwner = computed(() => authStore.user?.id === props.post.author.id)
const authorAvatar = computed(() => getAvatarUrl(props.post.author.avatar))
const postImage = computed(() => {
  const img = props.post.image
  if (!img) return null
  return img
})

const isVideo = computed(() => {
  const img = props.post.image
  if (!img) return false
  return img.match(/\.(mp4|webm|mov)$/i)
})

const visualMedia = computed(() => {
  const media = props.post.media || []
  const visualTypes = ['image', 'video', 'gif']
  return media.filter(item => visualTypes.includes(item.mediaType))
})

const fileMedia = computed(() => {
  const media = props.post.media || []
  const fileTypes = ['audio', 'file']
  return media.filter(item => fileTypes.includes(item.mediaType))
})

const mediaAudioEls = ref({})
const playingMediaAudios = ref({})
const mediaAudioProgress = ref({})
const mediaAudioDurations = ref({})

function toggleMediaAudio(index, item) {
  if (audioPlayerStore.currentTrack?.url === item.url && audioPlayerStore.isPlaying) {
    audioPlayerStore.pause()
  } else {
    audioPlayerStore.play({
      url: item.url,
      name: item.fileName || t('audioTrack'),
      source: props.post.author.name
    })
  }
}

function isMediaAudioPlaying(url) {
  return audioPlayerStore.currentTrack?.url === url && audioPlayerStore.isPlaying
}

function getMediaAudioProgress(url) {
  if (audioPlayerStore.currentTrack?.url === url) {
    return audioPlayerStore.progress
  }
  return 0
}

function getMediaAudioTime(url) {
  if (audioPlayerStore.currentTrack?.url === url) {
    return audioPlayerStore.formattedCurrentTime
  }
  return '0:00'
}

function seekMediaAudio(e, url) {
  if (audioPlayerStore.currentTrack?.url !== url) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  audioPlayerStore.seek(percent)
}

function onMediaAudioEnded(index) {
  playingMediaAudios.value[index] = false
  mediaAudioProgress.value[index] = 0
}

function onMediaAudioLoaded(e, index) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  mediaAudioDurations.value[index] = `${mins}:${secs.toString().padStart(2, '0')}`
}

function onMediaAudioTimeUpdate(e, index) {
  const current = e.target.currentTime
  const duration = e.target.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  mediaAudioDurations.value[index] = `${mins}:${secs.toString().padStart(2, '0')}`
  mediaAudioProgress.value[index] = duration > 0 ? (current / duration) * 100 : 0
}

function getMediaAudioDuration(index) {
  return mediaAudioDurations.value[index] || '0:00'
}

function downloadMediaFile(item) {
  const a = document.createElement('a')
  a.href = item.url
  a.download = item.fileName || 'file'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function openMedia() {
  if (isVideo.value) return
  emit('open-media', props.post.image, 'image', 0, [{ src: props.post.image, type: 'image' }])
}

function openMediaGallery(index) {
  const items = visualMedia.value
  const item = items[index]
  if (!item) return
  if (item.mediaType === 'video') return
  emit('open-media', item.url, item.mediaType, index, items.map(m => ({ src: m.url, type: m.mediaType })))
}

function getAvatarUrl(avatar) {
  if (!avatar) return '/default-avatar.svg'
  return avatar
}

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function handleImageError(e) { e.target.style.display = 'none' }

function toggleMenu() {
  if (!showMenu.value) {
    menuOpen.value = true
    showMenu.value = true
  } else {
    showMenu.value = false
  }
}

function closeMenu() {
  showMenu.value = false
}

function formatContent(content) {
  if (!content) return ''
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/@([a-zA-Z0-9_]{3,20})/g, '<a href="/profile/username/$1" class="mention-link" onclick="event.stopPropagation()">@$1</a>')
}

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  if (diff < 604800) return `${Math.floor(diff / 86400)} д`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatCount(num) {
  if (!num) return ''
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'М'
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'К'
  return num.toString()
}

function handleDelete() {
  showMenu.value = false
  emit('delete', props.post.id)
}

async function handlePin() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/pin`)
    emit('update', { ...props.post, isPinned: res.data.isPinned })
  } catch {}
}

async function handleArchive() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/archive`)
    emit('update', { ...props.post, isArchived: res.data.isArchived })
  } catch {}
}

async function handleToggleComments() {
  showMenu.value = false
  try {
    const res = await api.post(`/posts/${props.post.id}/comments-toggle`)
    emit('update', { ...props.post, commentsDisabled: res.data.commentsDisabled })
  } catch {}
}

function copyLink() {
  const url = `${window.location.origin}/post/${props.post.id}`
  navigator.clipboard.writeText(url)
  showMenu.value = false
}

async function toggleLike() {
  try {
    const res = await api.post(`/posts/${props.post.id}/like`)
    emit('update', { ...props.post, isLiked: res.data.liked, likesCount: res.data.likesCount })
  } catch {}
}

async function handleLike() {
  likePressed.value = true
  setTimeout(() => likePressed.value = false, 150)
  await toggleLike()
}

function handleComment() {
  commentPressed.value = true
  setTimeout(() => commentPressed.value = false, 150)
  showComments.value = !showComments.value
}

function handleShare() {
  sharePressed.value = true
  setTimeout(() => sharePressed.value = false, 150)
}

async function loadComments() {
  loadingComments.value = true
  try {
    const res = await api.get(`/posts/${props.post.id}/comments`)
    comments.value = res.data
  } catch {}
  loadingComments.value = false
}

async function addComment() {
  if (!newComment.value.trim()) return
  try {
    const payload = { content: newComment.value }
    if (replyingToParentId.value) {
      payload.parentId = replyingToParentId.value
    }
    const res = await api.post(`/posts/${props.post.id}/comments`, payload)
    
    if (replyingToParentId.value) {
      const parent = comments.value.find(c => c.id === replyingToParentId.value)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(res.data)
      }
      replyingTo.value = null
      replyingToParentId.value = null
      isReplyMode.value = false
    } else {
      comments.value.push(res.data)
    }
    newComment.value = ''
    emit('update', { ...props.post, commentsCount: props.post.commentsCount + 1 })
  } catch {}
}

async function likeComment(comment) {
  try {
    const res = await api.post(`/posts/comments/${comment.id}/like`)
    comment.isLiked = res.data.liked
    comment.likesCount = res.data.likesCount
  } catch {}
}

function canDeleteComment(comment) {
  return comment.author.id === authStore.user?.id || isOwner.value
}

async function deleteComment(comment) {
  try {
    await api.delete(`/posts/comments/${comment.id}`)
    const idx = comments.value.findIndex(c => c.id === comment.id)
    if (idx !== -1) {
      const repliesCount = comment.replies?.length || 0
      comments.value.splice(idx, 1)
      emit('update', { ...props.post, commentsCount: props.post.commentsCount - 1 - repliesCount })
    }
  } catch {}
}

async function deleteReply(parentComment, reply) {
  try {
    await api.delete(`/posts/comments/${reply.id}`)
    const idx = parentComment.replies.findIndex(r => r.id === reply.id)
    if (idx !== -1) {
      parentComment.replies.splice(idx, 1)
      emit('update', { ...props.post, commentsCount: props.post.commentsCount - 1 })
    }
  } catch {}
}

function startReply(comment, parentComment = null) {
  replyingTo.value = comment
  replyingToParentId.value = parentComment ? parentComment.id : comment.id
  isReplyMode.value = true
}

function cancelReply() {
  replyingTo.value = null
  replyingToParentId.value = null
  isReplyMode.value = false
}

function onReplyTransitionEnd() {
}

watch(showComments, (val) => {
  if (val && comments.value.length === 0) loadComments()
})

function onPostLike(data) {
  if (data.postId === props.post.id && data.userId !== authStore.user?.id) {
    emit('update', { ...props.post, likesCount: data.likesCount })
  }
}

function onPostComment(data) {
  if (data.postId === props.post.id && data.comment.author.id !== authStore.user?.id) {
    if (data.comment.parentId) {
      const parent = comments.value.find(c => c.id === data.comment.parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(data.comment)
      }
    } else {
      comments.value.push(data.comment)
    }
    emit('update', { ...props.post, commentsCount: props.post.commentsCount + 1 })
  }
}

async function pollComments() {
  if (!showComments.value) return
  try {
    const res = await api.get(`/posts/${props.post.id}/comments`)
    const newCommentIds = new Set(res.data.map(c => c.id))
    const newReplyIds = new Set()
    res.data.forEach(c => c.replies?.forEach(r => newReplyIds.add(r.id)))
    
    comments.value = comments.value.filter(c => newCommentIds.has(c.id))
    
    res.data.forEach(newComment => {
      const existing = comments.value.find(c => c.id === newComment.id)
      if (existing) {
        existing.likesCount = newComment.likesCount
        existing.isLiked = newComment.isLiked
        if (existing.replies) {
          existing.replies = existing.replies.filter(r => newReplyIds.has(r.id))
        }
        if (newComment.replies) {
          newComment.replies.forEach(newReply => {
            const existingReply = existing.replies?.find(r => r.id === newReply.id)
            if (existingReply) {
              existingReply.likesCount = newReply.likesCount
              existingReply.isLiked = newReply.isLiked
            } else {
              if (!existing.replies) existing.replies = []
              existing.replies.push(newReply)
            }
          })
        }
      } else {
        comments.value.push(newComment)
      }
    })
  } catch {}
}

let commentsPollInterval = null

onMounted(() => {
  joinPost(props.post.id)
  on('post:like', onPostLike)
  on('post:comment', onPostComment)
  commentsPollInterval = setInterval(pollComments, 5000)
})

onUnmounted(() => {
  leavePost(props.post.id)
  off('post:like', onPostLike)
  off('post:comment', onPostComment)
  if (commentsPollInterval) clearInterval(commentsPollInterval)
})

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped>
.post {
  padding: 20px;
  position: relative;
  overflow: visible !important;
}

.post.pinned {
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.pinned-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pinned-badge svg {
  width: 14px;
  height: 14px;
}

.post.menu-open {
  z-index: 60;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.post-author {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  font-size: 15px;
  transition: color var(--transition);
}

.post-author:hover .author-name {
  color: rgba(255, 255, 255, 0.7);
}

.post-time {
  font-size: 13px;
  color: var(--text-muted);
}

.post-menu-wrap {
  position: relative;
  z-index: 50;
}

.post-menu-btn {
  color: rgba(255, 255, 255, 0.4);
  padding: 8px;
  border-radius: 50%;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
}

.post-menu-btn svg {
  width: 18px;
  height: 18px;
}

.post-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 200px;
  padding: 6px;
  z-index: 100;
  will-change: transform, opacity;
  transform: translateZ(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all var(--transition);
  text-align: left;
  justify-content: flex-start;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: rgba(255, 100, 100, 0.9);
}

.dropdown-item.danger:hover {
  color: #ff5555;
  background: rgba(255, 80, 80, 0.05);
}

.dropdown-item svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.dropdown-item:hover svg {
  color: rgba(255, 255, 255, 0.7);
}

.dropdown-item.danger svg {
  color: rgba(255, 100, 100, 0.7);
}

.dropdown-item.danger:hover svg {
  color: #ff5555;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 6px 0;
}

.post-content {
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 14px;
}

.post-content :deep(.mention-link) {
  color: #5b9aff;
  text-decoration: none;
  font-weight: 500;
}

.post-content :deep(.mention-link:hover) {
  text-decoration: underline;
}

.post-image-wrap {
  position: relative;
  margin-bottom: 14px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.post-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.post-video {
  cursor: default;
}

.post-image-wrap img + video {
  display: none;
}

.post-image-wrap:has(video) img {
  display: none;
}

.image-placeholder {
  width: 100%;
  height: 300px;
}

/* Post GIF */
.post-gif {
  cursor: default;
}

/* Post Audio - compact style */
.post-audio-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 18px;
  cursor: pointer;
}
.post-audio-wrap .audio-play-btn {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.post-audio-wrap .audio-play-btn:hover {
  transform: scale(1.05);
}
.post-audio-wrap .audio-play-btn:active {
  transform: scale(0.95);
}
.post-audio-wrap .audio-play-btn svg {
  width: 22px;
  height: 22px;
  color: #1a1a1a;
}
.post-audio-wrap .audio-play-btn .play-icon {
  margin-left: -1px;
}
.post-audio-wrap .audio-info {
  flex: 1;
  min-width: 0;
}
.post-audio-wrap .audio-name {
  font-size: 16px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.post-audio-wrap .audio-meta {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-music {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.1s cubic-bezier(0.2, 0, 0, 1);
}
.post-music:hover {
  background: rgba(255, 255, 255, 0.06);
}
.post-music .music-artwork {
  width: 56px;
  height: 56px;
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.post-music .music-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-music .artwork-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.post-music .artwork-placeholder svg {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}
.post-music .play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s cubic-bezier(0.2, 0, 0, 1);
}
.post-music:hover .play-overlay {
  opacity: 1;
}
.post-music .play-overlay svg {
  width: 24px;
  height: 24px;
  color: white;
}
.post-music .music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.post-music .music-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.post-music .music-artist {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Post File */
.post-file-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.1s cubic-bezier(0.2, 0, 0, 1);
}
.post-file-wrap:hover {
  background: rgba(255, 255, 255, 0.06);
}
.post-file-wrap .file-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.post-file-wrap .file-icon svg {
  width: 26px;
  height: 26px;
  color: rgba(255, 255, 255, 0.6);
}
.post-file-wrap .file-info {
  flex: 1;
  min-width: 0;
}
.post-file-wrap .file-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.post-file-wrap .file-size {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}
.post-file-wrap .file-download {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.post-file-wrap .file-download svg {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.5);
}

.post-stats {
  display: flex;
  gap: 16px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: var(--text-muted);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.action-btn:hover {
  color: var(--text-secondary);
}

.action-btn.active {
  color: var(--text-primary);
}

.action-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.pressed {
  transform: scale(0.85);
}

.action-btn svg {
  width: 22px;
  height: 22px;
  transition: transform 0.15s ease;
}

.action-btn .count {
  font-size: 13px;
  color: inherit;
}

.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.comments-loading {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.comment {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  transition: color var(--transition);
}

.comment-author:hover {
  color: rgba(255, 255, 255, 0.7);
}

.comment-time {
  font-size: 13px;
  color: var(--text-muted);
}

.comment-text {
  font-size: 15px;
  line-height: 1.4;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
  transition: color var(--transition);
}

.comment-action:hover {
  color: var(--text-secondary);
}

.comment-action svg {
  width: 16px;
  height: 16px;
}

.comment-action.active {
  color: var(--text-primary);
}

.comment-action.delete {
  color: rgba(255, 100, 100, 0.7);
}

.comment-action.delete:hover {
  color: #ff5555;
}

.replies {
  margin-top: 12px;
  padding-left: 8px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.reply {
  margin-top: 12px;
}

.avatar-xs {
  width: 28px;
  height: 28px;
}

.cancel-reply {
  color: var(--text-muted);
  padding: 8px;
  font-size: 14px;
  transition: color var(--transition);
}

.cancel-reply:hover {
  color: var(--text-primary);
}

.comment-form {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.comment-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.comment-input-wrap input {
  width: 100%;
  border-radius: var(--radius-full);
  padding: 10px 16px;
  padding-right: 80px;
}

.comment-emoji {
  position: absolute;
  right: 44px;
}

.comment-emoji :deep(.emoji-picker) {
  bottom: 100%;
  right: -38px;
}

.inside-btn {
  position: absolute;
  right: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.inside-btn svg {
  width: 16px;
  height: 16px;
}

.send-inside {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.send-inside:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.send-inside:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.cancel-inside {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
  animation: morph-in 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.cancel-inside:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.outside-btn-wrap {
  width: 0;
  overflow: hidden;
  transition: width 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.comment-form.reply-mode .outside-btn-wrap {
  width: 36px;
}

.outside-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.1s cubic-bezier(0.2, 0, 0, 1), opacity 0.15s cubic-bezier(0.2, 0, 0, 1), transform 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.outside-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.outside-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.outside-btn svg {
  width: 18px;
  height: 18px;
}

/* Smooth morph animations */
@keyframes morph-in {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.liquid-out-enter-active {
  animation: liquid-emerge 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.liquid-out-leave-active {
  animation: liquid-merge 0.1s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes liquid-emerge {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes liquid-merge {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

/* Media Gallery Styles */
.post-media-gallery {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.post-media-gallery.media-count-1 {
  grid-template-columns: 1fr;
}
.post-media-gallery.media-count-2 {
  grid-template-columns: 1fr 1fr;
}
.post-media-gallery.media-count-3 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.post-media-gallery.media-count-3 .media-gallery-item:first-child {
  grid-row: span 2;
}
.post-media-gallery.media-count-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.media-gallery-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
}
.post-media-gallery.media-count-1 .media-gallery-item {
  aspect-ratio: auto;
  max-height: 500px;
}
.post-media-gallery.media-count-2 .media-gallery-item {
  aspect-ratio: 4/3;
}
.media-gallery-item img,
.media-gallery-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-gallery-item video {
  cursor: default;
}
.gallery-audio-item,
.gallery-file-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, rgba(100, 100, 255, 0.2), rgba(150, 100, 255, 0.1));
}
.gallery-audio-item svg,
.gallery-file-item svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.7);
}
.gallery-audio-item span,
.gallery-file-item span {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 80%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: white;
}

/* Post files list */
.post-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.post-files-list .post-audio-wrap,
.post-files-list .post-file-wrap {
  margin-bottom: 0;
}

.menu-enter-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.menu-leave-active {
  transition: opacity 0.1s ease-in, transform 0.1s ease-in;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateZ(0) translateY(-4px) scale(0.98);
}

.comments-enter-active {
  transition: opacity 0.15s cubic-bezier(0.2, 0, 0, 1);
}

.comments-leave-active {
  transition: opacity 0.1s cubic-bezier(0.4, 0, 1, 1);
}

.comments-enter-from,
.comments-leave-to {
  opacity: 0;
}

@media (hover: none) and (pointer: coarse) {
  .action-btn:active {
    transform: scale(0.88);
    background: rgba(255, 255, 255, 0.1);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .post-menu-btn:active {
    transform: scale(0.85);
    background: rgba(255, 255, 255, 0.1);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .comment:active {
    transform: scale(0.99);
    background: rgba(255, 255, 255, 0.04);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .post-author:active {
    transform: scale(0.98);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}

[data-theme="light"] .post-dropdown {
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="light"] .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .post-audio-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .post-file-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .post-file-wrap:hover {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .music-artwork .artwork-placeholder {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .comment-form input {
  background: rgba(0, 0, 0, 0.04);
}
</style>
