<template>
  <div class="profile-page" v-if="user">
    <div class="profile-header">
      <button @click="$router.back()" class="back-btn glass">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div class="profile-cover">
        <div class="cover-gradient"></div>
      </div>

      <div class="profile-info glass">
        <div class="profile-avatar-wrap">
          <img :src="userAvatar" class="avatar avatar-xl" alt="" @error="handleAvatarError">
          <label v-if="isOwner" class="avatar-edit">
            <input type="file" accept="image/*" @change="uploadAvatar" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </label>
        </div>

        <div class="profile-details">
          <h1>{{ user.name }}</h1>
          <p v-if="user.bio" class="bio">{{ user.bio }}</p>
          <div class="profile-meta">
            <span class="meta-item">{{ user.friendsCount || 0 }} друзей</span>
            <span class="meta-item">{{ user.postsCount || 0 }} записей</span>
          </div>
        </div>

        <div class="profile-actions">
          <template v-if="isOwner">
            <button @click="showEditModal = true" class="btn btn-secondary">Редактировать</button>
          </template>
          <template v-else>
            <button v-if="user.friendStatus === 'none'" @click="addFriend" class="btn btn-primary">Добавить в друзья</button>
            <button v-else-if="user.friendStatus === 'pending'" class="btn btn-secondary" disabled>Заявка отправлена</button>
            <button v-else-if="user.friendStatus === 'incoming'" @click="acceptFriend" class="btn btn-primary">Принять заявку</button>
            <button v-else-if="user.friendStatus === 'friends'" @click="removeFriend" class="btn btn-secondary">Удалить из друзей</button>
            <router-link :to="`/messages/${user.id}`" class="btn btn-secondary">Написать</router-link>
          </template>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="liquid-tabs">
        <button class="liquid-tab active">Записи</button>
        <button class="liquid-tab">Фото</button>
        <button class="liquid-tab">Видео</button>
      </div>

      <div class="profile-posts">
        <CreatePost v-if="isOwner" @created="addPost" />
        
        <PostCard 
          v-for="post in posts" 
          :key="post.id" 
          :post="post"
          @delete="deletePost"
          @update="updatePost"
        />
        
        <div v-if="!posts.length" class="empty-state glass">
          <p>Нет записей</p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal glass">
            <div class="modal-header">
              <h2>Редактировать профиль</h2>
              <button @click="showEditModal = false" class="close-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="saveProfile" class="modal-body">
              <div class="form-group">
                <label>Имя</label>
                <input v-model="editForm.name" placeholder="Ваше имя" required>
              </div>
              <div class="form-group">
                <label>О себе</label>
                <textarea v-model="editForm.bio" placeholder="Расскажите о себе" rows="3"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" @click="showEditModal = false" class="btn btn-secondary">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import api from '../api'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const user = ref(null)
const posts = ref([])
const showEditModal = ref(false)
const editForm = reactive({ name: '', bio: '' })

const isOwner = computed(() => authStore.user?.id === user.value?.id)
const userAvatar = computed(() => {
  const avatar = user.value?.avatar
  if (!avatar) return '/default-avatar.svg'
  return avatar
})

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }

async function fetchProfile() {
  const id = route.params.id || authStore.user?.id
  try {
    const [userRes, postsRes] = await Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/posts`)
    ])
    user.value = userRes.data
    posts.value = postsRes.data
    editForm.name = user.value.name
    editForm.bio = user.value.bio || ''
  } catch (err) {
    notifications.error(err.message)
  }
}

async function uploadAvatar(e) {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('avatar', file)
  try {
    const res = await api.post('/users/avatar', formData)
    user.value.avatar = res.data.avatar
    authStore.updateUser({ avatar: res.data.avatar })
    notifications.success('Аватар обновлён')
  } catch (err) {
    notifications.error(err.message)
  }
}

async function saveProfile() {
  try {
    const res = await api.put('/users/profile', editForm)
    user.value = { ...user.value, ...res.data }
    authStore.updateUser(res.data)
    showEditModal.value = false
    notifications.success('Профиль обновлён')
  } catch (err) {
    notifications.error(err.message)
  }
}

async function addFriend() {
  try {
    await api.post(`/friends/request/${user.value.id}`)
    user.value.friendStatus = 'pending'
    notifications.success('Заявка отправлена')
  } catch (err) { notifications.error(err.message) }
}

async function acceptFriend() {
  try {
    await api.post(`/friends/accept/${user.value.id}`)
    user.value.friendStatus = 'friends'
    notifications.success('Заявка принята')
  } catch (err) { notifications.error(err.message) }
}

async function removeFriend() {
  try {
    await api.delete(`/friends/${user.value.id}`)
    user.value.friendStatus = 'none'
    notifications.success('Удалён из друзей')
  } catch (err) { notifications.error(err.message) }
}

function addPost(post) { posts.value.unshift(post) }
async function deletePost(id) {
  try {
    await api.delete(`/posts/${id}`)
    posts.value = posts.value.filter(p => p.id !== id)
  } catch (err) { notifications.error(err.message) }
}
function updatePost(updated) {
  const idx = posts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) posts.value[idx] = updated
}

watch(() => route.params.id, fetchProfile, { immediate: true })
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-left: var(--sidebar-width);
}

.profile-header {
  position: relative;
  padding: 20px;
}

.back-btn {
  position: absolute;
  top: 32px;
  left: calc(var(--sidebar-width) + 32px);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: var(--text-primary);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.profile-cover {
  height: 200px;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  position: relative;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 1;
}

.profile-info {
  max-width: 700px;
  margin: -60px auto 0;
  padding: 24px;
  position: relative;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-xl {
  border: 4px solid var(--bg-primary);
  box-shadow: var(--glass-shadow);
}

.avatar-edit {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition);
}

.avatar-edit:hover {
  background: rgba(255, 255, 255, 0.15);
}

.avatar-edit svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.profile-details {
  flex: 1;
  min-width: 200px;
}

.profile-details h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.bio {
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.profile-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  color: var(--text-muted);
  font-size: 14px;
}

.profile-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.profile-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.liquid-tabs {
  margin-bottom: 20px;
  justify-content: center;
  display: flex;
}

.profile-posts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius);
  transition: all var(--transition);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.modal-enter-active,
.modal-leave-active {
  transition: all var(--transition-slow);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .profile-page { padding-left: 0; }
  .back-btn { left: 32px; }
  .profile-info { flex-direction: column; align-items: center; text-align: center; }
  .profile-meta { justify-content: center; }
  .profile-actions { width: 100%; justify-content: center; }
}
</style>
