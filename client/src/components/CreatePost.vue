<template>
  <button class="create-trigger glass" @click="showModal = true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span>Создать пост</span>
  </button>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content glass-modal">
          <div class="modal-header">
            <h2>Новый пост</h2>
            <button @click="closeModal" class="close-btn">
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
              <textarea v-model="content" placeholder="Напишите что-нибудь..." rows="2"></textarea>
              <button class="emoji-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="tips-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Советы по публикации
            </button>
            <button @click="submit" class="btn btn-primary" :disabled="!canSubmit || loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Далее</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const emit = defineEmits(['created'])
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const showModal = ref(false)
const content = ref('')
const images = ref([])
const loading = ref(false)
const fileInput = ref(null)

const canSubmit = computed(() => content.value.trim() || images.value.length)

function triggerUpload() {
  fileInput.value?.click()
}

function closeModal() {
  showModal.value = false
  content.value = ''
  images.value.forEach(img => URL.revokeObjectURL(img.preview))
  images.value = []
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
  background: transparent;
  border: none;
  resize: none;
  font-size: 15px;
  padding-right: 40px;
}
.text-input textarea:focus {
  outline: none;
  box-shadow: none;
}
.emoji-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  color: rgba(255, 255, 255, 0.4);
  padding: 4px;
}
.emoji-btn:hover {
  color: rgba(255, 255, 255, 0.7);
}
.emoji-btn svg {
  width: 20px;
  height: 20px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.tips-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
.tips-btn svg {
  width: 18px;
  height: 18px;
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
.modal-enter-from .modal-content {
  transform: translateZ(0) scale(0.97);
}
.modal-leave-to .modal-content {
  transform: translateZ(0) scale(0.97);
}
</style>
