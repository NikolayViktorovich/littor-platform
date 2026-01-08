<template>
  <div class="profile-page">
    <div class="profile-header">
      <button @click="$router.back()" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div class="profile-cover" :style="coverStyle">
        <div class="cover-gradient"></div>
        <label v-if="isOwner" class="cover-edit">
          <input type="file" accept="image/*" @change="selectCover" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
        </label>
      </div>

      <div class="profile-info">
        <div class="profile-avatar-wrap">
          <img :src="userAvatar" class="avatar avatar-xl" alt="" @error="handleAvatarError">
          <label v-if="isOwner && user" class="avatar-edit">
            <input type="file" accept="image/*" @change="uploadAvatar" hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </label>
        </div>

        <div class="profile-details">
          <h1 v-if="user">{{ user.name }}</h1>
          <p v-if="user?.bio" class="bio">{{ user.bio }}</p>
          <div class="online-status" v-if="user && !isOwner">
            <span class="status">{{ user.isOnline ? 'в сети' : formatLastSeen(user.lastSeen) }}</span>
          </div>
          <div class="profile-meta">
            <span class="meta-item">{{ user?.friendsCount || 0 }} друзей</span>
            <span class="meta-item">{{ user?.postsCount || 0 }} записей</span>
          </div>
        </div>

        <div v-if="user" class="profile-actions">
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

    <div class="profile-content" v-if="user">
      <div class="liquid-tabs">
        <button class="liquid-tab" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">Записи</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'photos' }" @click="switchTab('photos')">Фото</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'videos' }" @click="switchTab('videos')">Видео</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'friends' }" @click="switchTab('friends')">Друзья</button>
      </div>

      <div v-if="activeTab === 'posts'" class="profile-posts">
        <CreatePost v-if="isOwner" @created="addPost" />
        <PostCard v-for="post in posts" :key="post.id" :post="post" @delete="deletePost" @update="updatePost" @open-media="openMedia"/>
        <div v-if="!posts.length" class="empty-state glass"><p>Нет записей</p></div>
      </div>

      <div v-else-if="activeTab === 'photos'" class="media-grid">
        <div v-for="(photo, idx) in photos" :key="photo.id" class="media-item" @click="openMedia(photo.image, 'image', idx, photos.map(p => ({ src: p.image, type: 'image' })))">
          <img :src="photo.image" alt="">
        </div>
        <div v-if="!photos.length" class="empty-state glass"><p>Нет фотографий</p></div>
      </div>

      <div v-else-if="activeTab === 'videos'" class="media-grid">
        <div v-for="(video, idx) in videos" :key="video.id" class="media-item video-item" @click="openMedia(video.video, 'video', idx, videos.map(v => ({ src: v.video, type: 'video' })))">
          <video :src="video.video" muted></video>
          <div class="play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        </div>
        <div v-if="!videos.length" class="empty-state glass"><p>Нет видео</p></div>
      </div>

      <div v-else-if="activeTab === 'friends'" class="friends-section">
        <div v-if="friendsLoading" class="loading-state"><div class="spinner"></div></div>
        <template v-else>
          <div v-if="onlineFriends.length" class="friends-group">
            <h3 class="group-title">Онлайн <span class="count">{{ onlineFriends.length }}</span></h3>
            <div class="friends-list-view">
              <router-link v-for="friend in onlineFriends" :key="friend.id" :to="`/profile/${friend.id}`" class="friend-row">
                <div class="friend-avatar-wrap">
                  <img :src="friend.avatar || '/default-avatar.svg'" class="avatar" alt="" @error="handleAvatarError">
                  <span class="online-indicator"></span>
                </div>
                <span class="friend-name">{{ friend.name }}</span>
              </router-link>
            </div>
          </div>
          <div class="friends-group">
            <h3 class="group-title">Все друзья <span class="count">{{ friendsList.length }}</span></h3>
            <div v-if="!friendsList.length" class="empty-state glass"><p>Нет друзей</p></div>
            <div v-else class="friends-list-view">
              <router-link v-for="friend in friendsList" :key="friend.id" :to="`/profile/${friend.id}`" class="friend-row">
                <div class="friend-avatar-wrap">
                  <img :src="friend.avatar || '/default-avatar.svg'" class="avatar" alt="" @error="handleAvatarError">
                  <span v-if="friend.isOnline" class="online-indicator"></span>
                </div>
                <span class="friend-name">{{ friend.name }}</span>
              </router-link>
            </div>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal glass-modal">
            <div class="modal-header"><h2>Редактировать профиль</h2>
              <button @click="showEditModal = false" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <form @submit.prevent="saveProfile" class="modal-body">
              <div class="form-group"><label>Имя</label><input v-model="editForm.name" required></div>
              <div class="form-group"><label>О себе</label><textarea v-model="editForm.bio" rows="3"></textarea></div>
              <div class="modal-actions">
                <button type="button" @click="showEditModal = false" class="btn btn-secondary">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showCoverEditor" class="modal-overlay" @click.self="cancelCover">
          <div class="cover-editor glass-modal">
            <div class="modal-header">
              <h2>Редактирование обложки</h2>
              <button @click="cancelCover" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="cover-editor-hint">Выбранная область будет видна в вашем профиле</div>
            <div class="cover-preview-wrap">
              <div class="cover-preview-container" :class="{ 'preview-mode': showCoverPreviewMode }">
                <img :src="coverPreview" :style="{ transform: `scale(${coverScale}) translate(${coverX}px, ${coverY}px)` }" @mousedown="startDrag" @touchstart="startTouchDrag" draggable="false">
                <template v-if="!showCoverPreviewMode">
                  <div class="cover-zone mobile-zone">
                    <span>Эта область видна на мобильных устройствах</span>
                  </div>
                  <div class="cover-zone desktop-zone">
                    <span>Эта область видна на компьютерах</span>
                  </div>
                </template>
              </div>
            </div>
            <div class="cover-editor-actions">
              <button type="button" @click="togglePreview" class="btn btn-secondary">{{ showCoverPreviewMode ? 'Редактировать' : 'Предпросмотр' }}</button>
              <div class="cover-editor-right">
                <button type="button" @click="cancelCover" class="btn btn-secondary">Отмена</button>
                <button type="button" @click="saveCover" class="btn btn-primary">Установить обложку</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showMediaViewer" class="media-viewer-overlay" @click.self="closeMedia">
          <button class="viewer-close" @click="closeMedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          <button v-if="mediaList.length > 1" class="viewer-nav prev" @click="prevMedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div class="viewer-content">
            <img v-if="mediaViewerType === 'image'" :src="mediaViewerSrc" alt="">
            <video v-else :src="mediaViewerSrc" controls autoplay></video>
          </div>
          <button v-if="mediaList.length > 1" class="viewer-nav next" @click="nextMedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
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
import { cache } from '../stores/cache'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import api from '../api'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const user = ref(null)
const posts = ref([])
const photos = ref([])
const videos = ref([])
const activeTab = ref('posts')
const showEditModal = ref(false)
const editForm = reactive({ name: '', bio: '' })

const showCoverEditor = ref(false)
const coverPreview = ref(null)
const coverFile = ref(null)
const coverScale = ref(1)
const coverX = ref(0)
const coverY = ref(0)
const showCoverPreviewMode = ref(false)
let isDragging = false, dragStartX = 0, dragStartY = 0, startX = 0, startY = 0

const showMediaViewer = ref(false)
const mediaViewerSrc = ref('')
const mediaViewerType = ref('image')
const mediaIndex = ref(0)
const mediaList = ref([])

const friendsList = ref([])
const friendsLoading = ref(false)

const isOwner = computed(() => authStore.user?.id === user.value?.id)
const onlineFriends = computed(() => friendsList.value.filter(f => f.isOnline))
const userAvatar = computed(() => user.value?.avatar || '/default-avatar.svg')
const coverStyle = computed(() => user.value?.cover ? { backgroundImage: `url(${user.value.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})

function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'был(а) давно'
  const d = new Date(lastSeen), now = new Date(), diff = (now - d) / 1000
  if (diff < 60) return 'был(а) только что'
  if (diff < 3600) return `был(а) ${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `был(а) ${Math.floor(diff / 3600)} ч назад`
  return `был(а) ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
}

async function fetchProfile() {
  const id = route.params.id || authStore.user?.id
  try {
    const [userRes, postsRes] = await Promise.all([api.get(`/users/${id}`), api.get(`/users/${id}/posts`)])
    user.value = userRes.data
    posts.value = postsRes.data
    editForm.name = user.value.name
    editForm.bio = user.value.bio || ''
  } catch (err) { notifications.error(err.message) }
}

async function fetchPhotos() {
  const id = route.params.id || authStore.user?.id
  try { const res = await api.get(`/users/${id}/photos`); photos.value = res.data } catch {}
}

async function fetchVideos() {
  const id = route.params.id || authStore.user?.id
  try { const res = await api.get(`/users/${id}/videos`); videos.value = res.data } catch {}
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'photos' && !photos.value.length) fetchPhotos()
  if (tab === 'videos' && !videos.value.length) fetchVideos()
  if (tab === 'friends' && !friendsList.value.length) fetchFriends()
}

async function uploadAvatar(e) {
  const file = e.target.files[0]; if (!file) return
  const formData = new FormData(); formData.append('avatar', file)
  try {
    const res = await api.post('/users/avatar', formData)
    user.value.avatar = res.data.avatar
    authStore.updateUser({ avatar: res.data.avatar })
  } catch (err) { notifications.error(err.message) }
}

function selectCover(e) {
  const file = e.target.files[0]; if (!file) return
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
  coverScale.value = 1; coverX.value = 0; coverY.value = 0
  showCoverEditor.value = true
}

function startDrag(e) {
  isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; startX = coverX.value; startY = coverY.value
  document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', stopDrag)
}
function startTouchDrag(e) {
  const touch = e.touches[0]
  isDragging = true; dragStartX = touch.clientX; dragStartY = touch.clientY; startX = coverX.value; startY = coverY.value
  document.addEventListener('touchmove', onTouchDrag); document.addEventListener('touchend', stopTouchDrag)
}
function onDrag(e) { if (!isDragging) return; coverX.value = startX + (e.clientX - dragStartX) / coverScale.value; coverY.value = startY + (e.clientY - dragStartY) / coverScale.value }
function onTouchDrag(e) { if (!isDragging) return; const touch = e.touches[0]; coverX.value = startX + (touch.clientX - dragStartX) / coverScale.value; coverY.value = startY + (touch.clientY - dragStartY) / coverScale.value }
function stopDrag() { isDragging = false; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag) }
function stopTouchDrag() { isDragging = false; document.removeEventListener('touchmove', onTouchDrag); document.removeEventListener('touchend', stopTouchDrag) }
function togglePreview() { showCoverPreviewMode.value = !showCoverPreviewMode.value }

function cancelCover() { showCoverEditor.value = false; showCoverPreviewMode.value = false; if (coverPreview.value) URL.revokeObjectURL(coverPreview.value); coverFile.value = null; coverPreview.value = null }

async function saveCover() {
  if (!coverFile.value) return
  const formData = new FormData(); formData.append('cover', coverFile.value)
  try {
    const res = await api.post('/users/cover', formData)
    user.value.cover = res.data.cover
    showCoverEditor.value = false
    if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  } catch (err) { notifications.error(err.message) }
}

async function saveProfile() {
  try {
    const res = await api.put('/users/profile', editForm)
    user.value = { ...user.value, ...res.data }
    authStore.updateUser(res.data)
    showEditModal.value = false
  } catch (err) { notifications.error(err.message) }
}

async function addFriend() { try { await api.post(`/friends/request/${user.value.id}`); user.value.friendStatus = 'pending' } catch (err) { notifications.error(err.message) } }
async function acceptFriend() { try { await api.post(`/friends/accept/${user.value.id}`); user.value.friendStatus = 'friends' } catch (err) { notifications.error(err.message) } }
async function removeFriend() { try { await api.delete(`/friends/${user.value.id}`); user.value.friendStatus = 'none' } catch (err) { notifications.error(err.message) } }

function addPost(post) { posts.value.unshift(post) }
async function deletePost(id) { try { await api.delete(`/posts/${id}`); posts.value = posts.value.filter(p => p.id !== id) } catch (err) { notifications.error(err.message) } }
function updatePost(updated) { const idx = posts.value.findIndex(p => p.id === updated.id); if (idx !== -1) posts.value[idx] = updated }

function openMedia(src, type, idx = 0, list = []) { mediaViewerSrc.value = src; mediaViewerType.value = type; mediaIndex.value = idx; mediaList.value = list; showMediaViewer.value = true }
function closeMedia() { showMediaViewer.value = false }
function prevMedia() { if (mediaIndex.value > 0) { mediaIndex.value--; const item = mediaList.value[mediaIndex.value]; mediaViewerSrc.value = item.src; mediaViewerType.value = item.type } }
function nextMedia() { if (mediaIndex.value < mediaList.value.length - 1) { mediaIndex.value++; const item = mediaList.value[mediaIndex.value]; mediaViewerSrc.value = item.src; mediaViewerType.value = item.type } }

async function fetchFriends() {
  const id = route.params.id || authStore.user?.id
  friendsLoading.value = true
  try {
    const res = await api.get(`/users/${id}/friends`)
    friendsList.value = res.data
  } catch {} finally { friendsLoading.value = false }
}

watch(() => route.params.id, () => { activeTab.value = 'posts'; photos.value = []; videos.value = []; friendsList.value = []; fetchProfile() }, { immediate: true })
</script>

<style scoped>
.profile-page { min-height: 100vh; padding-left: var(--sidebar-width); }
.profile-header { position: relative; padding: 20px; }
.back-btn { position: absolute; top: 32px; left: 32px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 10; color: var(--text-primary); background: rgba(20, 20, 20, 0.95); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: var(--radius-xl); }
.back-btn svg { width: 20px; height: 20px; }
.profile-cover { height: 200px; border-radius: var(--radius-2xl); overflow: hidden; position: relative; background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%); }
.cover-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5)); }
.cover-edit { position: absolute; bottom: 16px; right: 16px; width: 40px; height: 40px; background: rgba(0,0,0,0.5); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 20; }
.cover-edit:hover { background: rgba(0,0,0,0.7); }
.cover-edit svg { width: 20px; height: 20px; color: white; }
.profile-info { max-width: 700px; margin: -60px auto 0; padding: 24px; position: relative; display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; background: rgba(18, 18, 18, 0.95); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-xl); }
.profile-avatar-wrap { position: relative; flex-shrink: 0; }
.avatar-xl { border: 4px solid var(--bg-primary); }
.avatar-edit { position: absolute; bottom: 4px; right: 4px; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.avatar-edit:hover { background: rgba(255, 255, 255, 0.08); }
.avatar-edit svg { width: 16px; height: 16px; color: var(--text-secondary); }
.profile-details { flex: 1; min-width: 200px; }
.profile-details h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
.bio { color: var(--text-secondary); margin-bottom: 8px; line-height: 1.5; }
.online-status { margin-bottom: 8px; }
.status { font-size: 14px; color: var(--text-muted); }
.profile-meta { display: flex; gap: 20px; }
.meta-item { color: var(--text-muted); font-size: 14px; }
.profile-actions { display: flex; gap: 10px; flex-shrink: 0; }
.profile-content { max-width: 600px; margin: 0 auto; padding: 0 20px 40px; }
.liquid-tabs { margin-bottom: 20px; justify-content: center; display: flex; }
.liquid-tab { padding: 10px 20px; color: var(--text-muted); font-size: 15px; border-radius: var(--radius-full); transition: all var(--transition); }
.liquid-tab:hover { color: var(--text-secondary); }
.liquid-tab.active { color: var(--text-primary); background: rgba(255,255,255,0.05); }
.profile-posts { display: flex; flex-direction: column; gap: 16px; }
.media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.media-item { aspect-ratio: 1; overflow: hidden; border-radius: var(--radius); cursor: pointer; position: relative; }
.media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.media-item:hover img, .media-item:hover video { transform: scale(1.05); }
.video-item .play-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
.play-icon svg { width: 40px; height: 40px; color: white; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); grid-column: 1 / -1; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.close-btn { color: var(--text-muted); padding: 4px; border-radius: var(--radius); }
.close-btn:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); }
.close-btn svg { width: 20px; height: 20px; }
.modal-body { padding: 24px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.cover-editor { width: 100%; max-width: 700px; }
.cover-editor-hint { text-align: center; padding: 16px 24px 8px; color: var(--text-secondary); font-size: 14px; }
.cover-preview-wrap { padding: 16px 24px; }
.cover-preview-container { position: relative; width: 100%; height: 280px; overflow: hidden; background: #000; cursor: move; border-radius: var(--radius-lg); }
.cover-preview-container.preview-mode { cursor: default; border-radius: var(--radius-2xl); height: 200px; }
.cover-preview-container img { width: 100%; height: 100%; object-fit: cover; user-select: none; pointer-events: auto; }
.cover-zone { position: absolute; border: 2px dashed rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; pointer-events: none; }
.cover-zone span { background: rgba(128,128,128,0.85); color: white; font-size: 12px; padding: 6px 12px; border-radius: 4px; white-space: nowrap; }
.mobile-zone { top: 20px; left: 50%; transform: translateX(-50%); width: 70%; height: 50px; border-radius: 8px; }
.desktop-zone { top: 85px; left: 50%; transform: translateX(-50%); width: 85%; height: 160px; border-radius: 8px; }
.cover-editor-actions { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.08); }
.cover-editor-right { display: flex; gap: 10px; }
.media-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; display: flex; align-items: center; justify-content: center; }
.viewer-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; z-index: 10; }
.viewer-close:hover { background: rgba(255,255,255,0.1); }
.viewer-close svg { width: 24px; height: 24px; }
.viewer-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; }
.viewer-nav:hover { background: rgba(255,255,255,0.1); }
.viewer-nav.prev { left: 20px; }
.viewer-nav.next { right: 20px; }
.viewer-nav svg { width: 24px; height: 24px; }
.viewer-content { max-width: 90vw; max-height: 90vh; }
.viewer-content img, .viewer-content video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.friends-section { display: flex; flex-direction: column; gap: 24px; }
.friends-group { }
.group-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.group-title .count { color: var(--text-secondary); }
.friends-list-view { display: flex; flex-direction: column; gap: 4px; }
.friend-row { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: var(--radius-lg); text-decoration: none; color: inherit; transition: background var(--transition); }
.friend-row:hover { background: rgba(255,255,255,0.03); }
.friend-avatar-wrap { position: relative; flex-shrink: 0; }
.online-indicator { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background: #3b82f6; border: 3px solid var(--bg-primary); border-radius: 50%; }
.friend-name { font-weight: 500; font-size: 15px; }
.loading-state { display: flex; justify-content: center; padding: 40px; grid-column: 1 / -1; }
.spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: rgba(255,255,255,0.5); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .profile-page { padding-left: 0; }
  .profile-info { flex-direction: column; align-items: center; text-align: center; }
  .profile-meta { justify-content: center; }
  .profile-actions { width: 100%; justify-content: center; }
  .media-grid { grid-template-columns: repeat(2, 1fr); }
  
  .cover-edit {
    width: 36px;
    height: 36px;
    bottom: 70px;
    right: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: none;
    box-shadow: none;
  }
  
  .cover-edit:active {
    transform: scale(0.95);
  }
  
  .cover-edit svg {
    width: 18px;
    height: 18px;
    opacity: 0.7;
  }
  
  .cover-editor {
    max-width: calc(100% - 32px);
    margin: 16px;
  }
  
  .cover-editor-hint {
    font-size: 12px;
    padding: 12px 16px 4px;
  }
  
  .cover-preview-wrap {
    padding: 12px 16px;
  }
  
  .cover-preview-container {
    height: 180px;
  }
  
  .cover-zone span {
    font-size: 9px;
    padding: 3px 6px;
  }
  
  .mobile-zone {
    top: 10px;
    height: 30px;
  }
  
  .desktop-zone {
    top: 50px;
    height: 110px;
  }
  
  .cover-editor-actions {
    padding: 12px 16px;
    gap: 8px;
  }
  
  .cover-editor-actions .btn {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .cover-editor-right {
    gap: 8px;
  }
}
</style>
