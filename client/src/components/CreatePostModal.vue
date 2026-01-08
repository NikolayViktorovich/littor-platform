<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content glass-modal">
      <div class="modal-header">
        <h2>Новый пост</h2>
        <button @click="$emit('close')" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="!images.length" class="upload-area" @click="triggerUpload">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="upload-title">Добавьте фото или видео</p>
          <label class="btn btn-secondary">
            <input type="file" accept="image/*" multiple @change="handleImages" hidden ref="fileInput">
            Загрузить с устройства
          </label>
        </div>

        <div v-else class="images-grid">
          <div v-for="(img, index) in images" :key="index" class="image-item">
            <img :src="img.preview" alt="">
            <button @click="removeImage(index)" class="remove-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <label class="add-more">
            <input type="file" accept="image/*" multiple @change="handleImages" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </label>
        </div>

        <div class="text-input">
          <textarea v-model="content" placeholder="Напишите что-нибудь..." rows="3" ref="textareaRef"></textarea>
          <EmojiPicker @select="insertEmoji" />
        </div>
      </div>

      <div class="modal-footer">
        <button @click="submit" class="btn btn-primary" :disabled="!canSubmit || loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Опубликовать</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import EmojiPicker from './EmojiPicker.vue'
import api from '../api'

const emit = defineEmits(['close', 'created'])
const notifications = useNotificationsStore()

const content = ref('')
const images = ref([])
const loading = ref(false)
const fileInput = ref(null)
const textareaRef = ref(null)

const canSubmit = computed(() => content.value.trim() || images.value.length)

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

function triggerUpload() {
  fileInput.value?.click()
}

function handleImages(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      notifications.error('Максимальный размер 5MB')
      continue
    }
    if (images.value.length >= 10) break
    images.value.push({ file, preview: URL.createObjectURL(file) })
  }
  e.target.value = ''
}

function removeImage(index) {
  URL.revokeObjectURL(images.value[index].preview)
  images.value.splice(index, 1)
}

async function submit() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('content', content.value)
    if (images.value.length) formData.append('image', images.value[0].file)
    const res = await api.post('/posts', formData)
    emit('created', res.data)
    notifications.success('Запись опубликована')
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  will-change: opacity;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
  transform: translateZ(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  padding: 20px;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color var(--transition);
}

.upload-area:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.5);
}

.upload-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius);
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-item .remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition);
}

.image-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn svg {
  width: 12px;
  height: 12px;
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: all var(--transition);
}

.add-more:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.7);
}

.add-more svg {
  width: 24px;
  height: 24px;
}

.text-input {
  position: relative;
  margin-top: 16px;
}

.text-input textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  resize: none;
  font-size: 15px;
  padding: 12px;
  padding-right: 40px;
}

.text-input textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
}

.text-input :deep(.emoji-wrap) {
  position: absolute;
  right: 8px;
  bottom: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
