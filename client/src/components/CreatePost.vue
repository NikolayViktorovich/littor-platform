<template>
  <button class="create-trigger glass" @click="showModal = true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    <span>{{ t('createPost') }}</span>
  </button>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content glass-modal">
          <div class="modal-header">
            <h2>{{ t('newPost') }}</h2>
            <button @click="closeModal" class="close-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="mediaFiles.length > 0" class="media-previews">
              <div v-for="item in mediaFiles" :key="item.id" class="media-preview-item">
                <div class="preview-thumb">
                  <img v-if="item.type === 'image' || item.type === 'gif'" :src="item.preview" alt="">
                  <video v-else-if="item.type === 'video'" :src="item.preview" muted></video>
                  <div v-else class="preview-icon" :class="item.type">
                    <svg v-if="item.type === 'audio'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
                  </div>
                </div>
                <button @click="removeFile(item.id)" class="preview-remove-small">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <button v-if="mediaFiles.length > 1" @click="clearMedia" class="clear-all-btn">{{ t('clear') }}</button>
            </div>

            <div class="text-input">
              <textarea v-model="content" :placeholder="t('writeSomething')" rows="3" ref="textareaRef"></textarea>
              <EmojiPicker @select="insertEmoji" />
            </div>

            <div class="attach-buttons">
              <label class="attach-btn">
                <input type="file" accept="image/*" @change="handleFile" multiple hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21"/></svg>
                <span>{{ t('photo') }}</span>
              </label>
              <label class="attach-btn">
                <input type="file" accept="video/*" @change="handleFile" multiple hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1V5z"/></svg>
                <span>{{ t('video') }}</span>
              </label>
              <label class="attach-btn">
                <input type="file" accept="image/gif" @change="handleFile" multiple hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zM7 10.5v3m3-3.5v4c0 .5.5 1 1 1h1.5m2.5-5v4h2.5"/></svg>
                <span>{{ t('gif') }}</span>
              </label>
              <button class="attach-btn" @click="showMusicPicker = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                <span>{{ t('music') }}</span>
              </button>
              <label class="attach-btn">
                <input type="file" accept="audio/*" @change="handleFile" multiple hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
                <span>{{ t('audio') }}</span>
              </label>
              <label class="attach-btn">
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z" @change="handleFile" multiple hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
                <span>{{ t('file') }}</span>
              </label>
            </div>

            <div v-if="selectedMusic" class="music-preview">
              <div class="music-artwork">
                <img v-if="selectedMusic.artwork" :src="selectedMusic.artwork" alt="">
                <div v-else class="artwork-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>
              </div>
              <div class="music-info">
                <span class="music-title">{{ selectedMusic.title }}</span>
                <span class="music-artist">{{ selectedMusic.artist }}</span>
              </div>
              <button @click="selectedMusic = null" class="music-remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="submit" class="btn btn-primary" :disabled="!canSubmit || loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ t('publish') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <MusicPicker v-if="showMusicPicker" @close="showMusicPicker = false" @select="onMusicSelect" />
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useI18n } from '../i18n'
import EmojiPicker from './EmojiPicker.vue'
import MusicPicker from './MusicPicker.vue'
import api from '../api'

const { t } = useI18n()
const emit = defineEmits(['created'])
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const showModal = ref(false)
const content = ref('')
const mediaFiles = ref([])
const loading = ref(false)
const textareaRef = ref(null)
const showMusicPicker = ref(false)
const selectedMusic = ref(null)

const canSubmit = computed(() => content.value.trim() || mediaFiles.value.length > 0 || selectedMusic.value)

function getMediaType(file) {
  if (file.type === 'image/gif') return 'gif'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'file'
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

function insertEmoji(emoji) {
  const textarea = textareaRef.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    content.value = content.value.substring(0, start) + emoji + content.value.substring(end)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  } else {
    content.value += emoji
  }
}

function onMusicSelect(track) {
  selectedMusic.value = track
}

function closeModal() {
  showModal.value = false
  content.value = ''
  selectedMusic.value = null
  clearMedia()
}

function handleFile(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  
  files.forEach(file => {
    if (file.size > 100 * 1024 * 1024) {
      notifications.error(`${file.name}: максимальный размер 100MB`)
      return
    }
    if (mediaFiles.value.length >= 10) return
    
    const type = getMediaType(file)
    const preview = (type === 'image' || type === 'gif' || type === 'video') ? URL.createObjectURL(file) : null
    mediaFiles.value.push({ file, preview, type, id: Date.now() + Math.random() })
  })
  e.target.value = ''
}

function removeFile(id) {
  const idx = mediaFiles.value.findIndex(f => f.id === id)
  if (idx !== -1) {
    if (mediaFiles.value[idx].preview) URL.revokeObjectURL(mediaFiles.value[idx].preview)
    mediaFiles.value.splice(idx, 1)
  }
}

function clearMedia() {
  mediaFiles.value.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
  mediaFiles.value = []
}

async function submit() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('content', content.value)
    
    if (selectedMusic.value) {
      formData.append('musicTrackId', selectedMusic.value.id)
      formData.append('musicTitle', selectedMusic.value.title)
      formData.append('musicArtist', selectedMusic.value.artist)
      if (selectedMusic.value.artwork) formData.append('musicArtwork', selectedMusic.value.artwork)
    }
    
    mediaFiles.value.forEach(item => {
      formData.append('media', item.file)
    })
    
    if (mediaFiles.value.length > 0) {
      const filesMeta = mediaFiles.value.map(item => ({
        name: item.file.name,
        size: item.file.size,
        type: item.type
      }))
      formData.append('filesMeta', JSON.stringify(filesMeta))
    }
    
    const res = await api.post('/posts', formData)
    emit('created', res.data)
    closeModal()
    notifications.success('Запись опубликована')
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  cursor: pointer;
  transition: all var(--transition);
}
.create-trigger:hover {
  color: rgba(255, 255, 255, 0.9);
}
.create-trigger svg {
  width: 20px;
  height: 20px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
}
.close-btn {
  color: rgba(255, 255, 255, 0.6);
  padding: 4px;
}
.close-btn:hover {
  color: white;
}
.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  padding: 0 20px 20px;
  overflow-y: auto;
}

/* Media previews grid */
.media-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  align-items: center;
}
.media-preview-item {
  position: relative;
}
.preview-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}
.preview-thumb img,
.preview-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}
.preview-icon.audio {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.preview-icon.file {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
.preview-remove-small {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}
.preview-remove-small:hover {
  background: rgba(255, 100, 100, 0.9);
  transform: scale(1.1);
}
.preview-remove-small svg {
  width: 12px;
  height: 12px;
}
.clear-all-btn {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 12px;
  border-radius: 8px;
  transition: all var(--transition);
}
.clear-all-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.text-input {
  position: relative;
}
.text-input textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  resize: none;
  font-size: 15px;
  padding: 12px 40px 12px 14px;
}
.text-input textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.15);
}
.text-input :deep(.emoji-wrap) {
  position: absolute;
  right: 8px;
  bottom: 8px;
}

/* Attachment buttons */
.attach-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.attach-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition);
}
.attach-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.12);
}
.attach-btn svg {
  width: 18px;
  height: 18px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 20px;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-enter-active { transition: opacity 0.15s ease-out; }
.modal-enter-active .modal-content { transition: transform 0.15s ease-out; }
.modal-leave-active { transition: opacity 0.1s ease-in; }
.modal-leave-active .modal-content { transition: transform 0.1s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content { transform: scale(0.95); }
.modal-leave-to .modal-content { transform: scale(0.95); }

.music-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
}
.music-artwork {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  overflow: hidden;
  flex-shrink: 0;
}
.music-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.music-artwork .artwork-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.music-artwork .artwork-placeholder svg {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}
.music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.music-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.music-artist {
  font-size: 12px;
  color: var(--text-muted);
}
.music-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius);
  flex-shrink: 0;
}
.music-remove:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}
.music-remove svg {
  width: 16px;
  height: 16px;
}

[data-theme="light"] .create-trigger {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
}

[data-theme="light"] .create-trigger:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
}

[data-theme="light"] .modal-overlay {
  background: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .modal-content {
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="light"] .close-btn {
  color: var(--text-secondary);
}

[data-theme="light"] .close-btn:hover {
  color: var(--text-primary);
}

[data-theme="light"] .media-previews {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .preview-thumb {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .text-input textarea {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .text-input textarea:focus {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.12);
}

[data-theme="light"] .attach-btn {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .attach-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

[data-theme="light"] .music-preview {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .music-artwork .artwork-placeholder {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .music-remove:hover {
  background: rgba(0, 0, 0, 0.04);
}
</style>
