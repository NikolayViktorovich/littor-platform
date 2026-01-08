<template>
  <div class="create-post card">
    <form @submit.prevent="submit">
      <div class="create-post-header">
        <img :src="authStore.user?.avatar || '/default-avatar.svg'" class="avatar" alt="">
        <textarea 
          v-model="content" 
          placeholder="Что у вас нового?" 
          rows="2"
          @input="autoResize"
          ref="textarea"
        ></textarea>
      </div>
      
      <div v-if="imagePreview" class="image-preview">
        <img :src="imagePreview" alt="">
        <button type="button" @click="removeImage" class="remove-image">×</button>
      </div>

      <div class="create-post-footer">
        <label class="attach-btn">
          <input type="file" accept="image/*" @change="handleImage" hidden>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          Фото
        </label>
        <button type="submit" class="btn btn-primary" :disabled="!canSubmit || loading">
          {{ loading ? 'Публикация...' : 'Опубликовать' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import api from '../api'

const emit = defineEmits(['created'])

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const content = ref('')
const image = ref(null)
const imagePreview = ref(null)
const loading = ref(false)
const textarea = ref(null)

const canSubmit = computed(() => content.value.trim() || image.value)

function autoResize(e) {
  e.target.style.height = 'auto'
  e.target.style.height = e.target.scrollHeight + 'px'
}

function handleImage(e) {
  const file = e.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    notifications.error('Максимальный размер изображения 5MB')
    return
  }
  
  image.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  image.value = null
  imagePreview.value = null
}

async function submit() {
  if (!canSubmit.value) return
  
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('content', content.value)
    if (image.value) formData.append('image', image.value)
    
    const res = await api.post('/posts', formData)
    emit('created', res.data)
    
    content.value = ''
    removeImage()
    if (textarea.value) textarea.value.style.height = 'auto'
    
    notifications.success('Пост опубликован')
  } catch (err) {
    notifications.error(err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-post {
  padding: 16px;
  margin-bottom: 16px;
}

.create-post-header {
  display: flex;
  gap: 12px;
}

.create-post-header textarea {
  flex: 1;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.4;
  min-height: 44px;
}

.create-post-header textarea:focus {
  outline: none;
}

.image-preview {
  position: relative;
  margin: 12px 0;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius);
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.8);
}

.create-post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.attach-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--text-secondary);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.2s;
}

.attach-btn:hover {
  background: var(--bg-hover);
}

.attach-btn svg {
  width: 20px;
  height: 20px;
  color: var(--success);
}
</style>
