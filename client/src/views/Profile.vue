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
          <p v-if="user?.username" class="username">@{{ user.username }}</p>
          <p v-if="user?.bio" class="bio">{{ user.bio }}</p>
          <div class="online-status" v-if="user && !isOwner">
            <span class="status">{{ user.isOnline ? t('online') : formatLastSeen(user.lastSeen) }}</span>
          </div>
          <div class="profile-meta">
            <span class="meta-item">{{ user?.friendsCount || 0 }} {{ t('friendsCount') }}</span>
            <span class="meta-item">{{ user?.postsCount || 0 }} {{ t('posts') }}</span>
          </div>
        </div>

        <div v-if="user" class="profile-actions">
          <template v-if="isOwner">
            <button @click="showEditModal = true" class="btn btn-secondary">{{ t('editProfile') }}</button>
            <router-link to="/settings" class="btn btn-secondary btn-icon mobile-settings-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </router-link>
          </template>
          <template v-else-if="!user.blockedByUser">
            <button v-if="user.friendStatus === 'none' && !user.iBlockedUser" @click="addFriend" class="btn btn-primary">{{ t('addFriend') }}</button>
            <button v-else-if="user.friendStatus === 'pending'" class="btn btn-secondary" disabled>{{ t('requestSent') }}</button>
            <button v-else-if="user.friendStatus === 'incoming'" @click="acceptFriend" class="btn btn-primary">{{ t('accept') }}</button>
            <router-link v-if="!user.iBlockedUser" :to="`/messages/${user.id}`" class="btn btn-secondary">{{ t('write') }}</router-link>
            <div class="profile-more-wrap">
              <button @click="toggleProfileMenu" class="btn btn-secondary btn-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              <Transition name="profile-menu">
                <div v-if="showProfileMenu" class="profile-menu-dropdown" @click.stop>
                  <button v-if="user.friendStatus === 'friends'" class="profile-menu-item" @click="removeFriend">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
                    <span>{{ t('removeFriend') }}</span>
                  </button>
                  <button v-if="user.iBlockedUser" class="profile-menu-item" @click="unblockUser">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                    <span>{{ t('unblock') }}</span>
                  </button>
                  <button v-else class="profile-menu-item danger" @click="blockUser">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-6.36 3.64l12.72 12.72"/></svg>
                    <span>{{ t('block') }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="user?.blockedByUser" class="blocked-message glass">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-6.36 3.64l12.72 12.72"/>
      </svg>
      <p>{{ t('pageUnavailable') }}</p>
      <span>{{ t('userRestrictedAccess') }}</span>
    </div>

    <div class="profile-content" v-if="user && !user.blockedByUser">
      <div class="liquid-tabs">
        <button class="liquid-tab" :class="{ active: activeTab === 'posts' }" @click="setTab('posts')">{{ t('posts') }}</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'photos' }" @click="setTab('photos')">{{ t('photos') }}</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'videos' }" @click="setTab('videos')">{{ t('videos') }}</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'audio' }" @click="setTab('audio')">{{ t('audio') }}</button>
        <button class="liquid-tab" :class="{ active: activeTab === 'friends' }" @click="setTab('friends')">{{ t('friends') }}</button>
        <button v-if="isOwner" class="liquid-tab" :class="{ active: activeTab === 'archive' }" @click="setTab('archive')">{{ t('archive') }}</button>
      </div>

      <div v-if="activeTab === 'posts'" class="profile-posts">
        <CreatePost v-if="isOwner" @created="addPost" />
        <PostCard v-for="post in posts" :key="post.id" :post="post" @delete="deletePost" @update="updatePost" @open-media="openMedia"/>
        <div v-if="!posts.length" class="empty-state glass"><p>{{ t('noPosts2') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'archive'" class="profile-posts">
        <PostCard v-for="post in archivedPosts" :key="post.id" :post="post" @delete="deleteArchivedPost" @update="updateArchivedPost" @open-media="openMedia"/>
        <div v-if="!archivedPosts.length" class="empty-state glass"><p>{{ t('archiveEmpty') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'photos'" class="media-grid">
        <div v-for="(photo, idx) in photos" :key="photo.id" class="media-item" @click="openMedia(photo.image, 'image', idx, photos.map(p => ({ src: p.image, type: 'image' })))">
          <img :src="photo.image" alt="">
        </div>
        <div v-if="!photos.length" class="empty-state glass"><p>{{ t('noPhotos') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'videos'" class="media-grid">
        <div v-for="(video, idx) in videos" :key="video.id" class="media-item video-item" @click="openMedia(video.video, 'video', idx, videos.map(v => ({ src: v.video, type: 'video' })))">
          <video :src="video.video" muted></video>
          <div class="play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        </div>
        <div v-if="!videos.length" class="empty-state glass"><p>{{ t('noVideos') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'audio'" class="audio-section">
        <div class="audio-tabs">
          <button class="audio-tab" :class="{ active: audioTab === 'all' }" @click="audioTab = 'all'; loadAllTracks()">{{ t('allSongs') }}</button>
          <button class="audio-tab" :class="{ active: audioTab === 'library' }" @click="audioTab = 'library'">{{ t('myMusic') }}</button>
          <button class="audio-tab" :class="{ active: audioTab === 'recent' }" @click="audioTab = 'recent'">{{ t('recent') }}</button>
        </div>

        <div v-if="audioTab === 'all'" class="audio-search">
          <div class="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input v-model="audioSearchQuery" @input="handleAudioSearch" :placeholder="t('searchMusic')">
          </div>
        </div>

        <div v-if="audioLoading" class="loading-state"><div class="spinner"></div></div>
        <template v-else>
          <div v-if="audioTab === 'all'" class="audio-list">
            <div v-if="!allTracks.length" class="empty-state glass"><p>{{ audioSearchQuery ? t('nothingFound') : t('enterSearchQuery') }}</p></div>
            <div v-for="track in allTracks" :key="track.id" class="audio-list-item" @click="playTrack(track)">
              <div class="audio-item-artwork">
                <img v-if="track.artwork" :src="track.artwork" alt="">
                <div v-else class="artwork-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
                <div class="play-overlay" :class="{ visible: isTrackPlaying(track) }">
                  <svg v-if="isTrackPlaying(track)" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <div class="audio-item-info">
                <span class="audio-item-name">{{ track.title }}</span>
                <span class="audio-item-artist">{{ track.artist }}</span>
              </div>
              <button v-if="!isInLibrary(track)" class="audio-add-btn" @click.stop="addToLibrary(track)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>

          <div v-else-if="audioTab === 'library'" class="audio-list">
            <div v-if="!audioLibrary.length" class="empty-state glass"><p>{{ t('noSavedTracks') }}</p></div>
            <div v-for="track in audioLibrary" :key="track.id" class="audio-list-item" @click="playTrack(track)">
              <div class="audio-item-artwork">
                <img v-if="track.artwork" :src="track.artwork" alt="">
                <div v-else class="artwork-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
                <div class="play-overlay" :class="{ visible: isTrackPlaying(track) }">
                  <svg v-if="isTrackPlaying(track)" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <div class="audio-item-info">
                <span class="audio-item-name">{{ track.title }}</span>
                <span class="audio-item-artist">{{ track.artist }}</span>
              </div>
              <button v-if="isOwner" class="audio-remove-btn" @click.stop="removeFromLibrary(track)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div v-else-if="audioTab === 'recent'" class="audio-list">
            <div v-if="!audioHistory.length" class="empty-state glass"><p>{{ t('noRecentTracks') }}</p></div>
            <div v-for="track in audioHistory" :key="track.id" class="audio-list-item" @click="playTrack(track)">
              <div class="audio-item-artwork">
                <img v-if="track.artwork" :src="track.artwork" alt="">
                <div v-else class="artwork-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
                <div class="play-overlay" :class="{ visible: isTrackPlaying(track) }">
                  <svg v-if="isTrackPlaying(track)" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
              <div class="audio-item-info">
                <span class="audio-item-name">{{ track.title }}</span>
                <span class="audio-item-artist">{{ track.artist }}</span>
              </div>
              <button v-if="!isInLibrary(track)" class="audio-add-btn" @click.stop="addToLibrary(track)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div v-else-if="activeTab === 'friends'" class="friends-section">
        <div v-if="friendsLoading" class="loading-state"><div class="spinner"></div></div>
        <template v-else>
          <div v-if="onlineFriends.length" class="friends-group">
            <h3 class="group-title">{{ t('onlineCount') }} <span class="count">{{ onlineFriends.length }}</span></h3>
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
            <h3 class="group-title">{{ t('allFriends') }} <span class="count">{{ friendsList.length }}</span></h3>
            <div v-if="!friendsList.length" class="empty-state glass"><p>{{ t('noFriends') }}</p></div>
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
            <div class="modal-header"><h2>{{ t('editProfileTitle') }}</h2>
              <button @click="showEditModal = false" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            <form @submit.prevent="saveProfile" class="modal-body">
              <div class="form-group"><label>{{ t('name') }}</label><input v-model="editForm.name" required></div>
              <div class="form-group"><label>{{ t('username') }}</label><div class="username-edit-wrap"><span class="username-prefix">@</span><input v-model="editForm.username" @input="editForm.username = editForm.username.toLowerCase().replace(/[^a-z0-9_]/g, '')" required></div><span v-if="editForm.username && !/^[a-zA-Z0-9_]{3,20}$/.test(editForm.username)" class="edit-hint">{{ t('usernameHint') }}</span></div>
              <div class="form-group"><label>{{ t('bio') }}</label><textarea v-model="editForm.bio" rows="3"></textarea></div>
              <div class="modal-actions">
                <button type="button" @click="showEditModal = false" class="btn btn-secondary">{{ t('cancel') }}</button>
                <button type="submit" class="btn btn-primary">{{ t('save') }}</button>
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
              <button @click="cancelCover" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
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
          <button class="viewer-close" @click="closeMedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
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
import { ref, computed, watch, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { cache } from '../stores/cache'
import { useI18n } from '../i18n'
import CreatePost from '../components/CreatePost.vue'
import PostCard from '../components/PostCard.vue'
import api from '../api'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()
const audioPlayerStore = useAudioPlayerStore()

const user = ref(null)
const posts = ref([])
const archivedPosts = ref([])
const photos = ref([])
const videos = ref([])
const audioLibrary = ref([])
const audioHistory = ref([])
const allTracks = ref([])
const audioLoading = ref(false)
const audioTab = ref('all')
const audioSearchQuery = ref('')
let audioSearchTimeout = null
const activeTab = ref('posts')
const showEditModal = ref(false)
const showProfileMenu = ref(false)
const editForm = reactive({ name: '', bio: '', username: '' })

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

function setTab(tab) {
  if (tab === activeTab.value) return
  activeTab.value = tab
  if (tab === 'photos' && !photos.value.length) fetchPhotos()
  if (tab === 'videos' && !videos.value.length) fetchVideos()
  if (tab === 'friends' && !friendsList.value.length) fetchFriends()
  if (tab === 'archive' && !archivedPosts.value.length) fetchArchivedPosts()
  if (tab === 'audio') fetchAudio()
}

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
  let id = route.params.id || authStore.user?.id
  
  if (route.params.username) {
    try {
      const res = await api.get(`/users/by-username/${route.params.username}`)
      id = res.data.id
    } catch {
      notifications.error('Пользователь не найден')
      return
    }
  }
  
  try {
    const [userRes, postsRes] = await Promise.all([api.get(`/users/${id}`), api.get(`/users/${id}/posts`)])
    user.value = userRes.data
    posts.value = postsRes.data
    editForm.name = user.value.name
    editForm.bio = user.value.bio || ''
    editForm.username = user.value.username || ''
  } catch (err) { notifications.error(err.message) }
}

async function pollFriendStatus() {
  if (!user.value) return
  const id = route.params.id || route.params.username ? user.value.id : authStore.user?.id
  if (!id) return
  try {
    const res = await api.get(`/users/${id}`)
    if (user.value) {
      user.value.friendStatus = res.data.friendStatus
      user.value.iBlockedUser = res.data.iBlockedUser
      user.value.blockedByUser = res.data.blockedByUser
      user.value.isOnline = res.data.isOnline
      user.value.lastSeen = res.data.lastSeen
      user.value.avatar = res.data.avatar
      user.value.cover = res.data.cover
      user.value.bio = res.data.bio
      user.value.username = res.data.username
      user.value.name = res.data.name
      user.value.friendsCount = res.data.friendsCount
      user.value.postsCount = res.data.postsCount
    }
  } catch {}
}

async function fetchPhotos() {
  const id = route.params.id || authStore.user?.id
  try { const res = await api.get(`/users/${id}/photos`); photos.value = res.data } catch {}
}

async function fetchVideos() {
  const id = route.params.id || authStore.user?.id
  try { const res = await api.get(`/users/${id}/videos`); videos.value = res.data } catch {}
}

async function fetchArchivedPosts() {
  try { const res = await api.get('/posts/archived'); archivedPosts.value = res.data.posts } catch {}
}

function deleteArchivedPost(id) {
  archivedPosts.value = archivedPosts.value.filter(p => p.id !== id)
}

function updateArchivedPost(updated) {
  const idx = archivedPosts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) {
    if (!updated.isArchived) {
      archivedPosts.value.splice(idx, 1)
      posts.value.unshift(updated)
      posts.value.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    } else {
      archivedPosts.value[idx] = updated
    }
  }
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
  if (editForm.username && !/^[a-zA-Z0-9_]{3,20}$/.test(editForm.username)) {
    notifications.error('Юзернейм: 3-20 символов, только буквы, цифры и _')
    return
  }
  try {
    const res = await api.put('/users/profile', editForm)
    user.value = { ...user.value, ...res.data }
    authStore.updateUser(res.data)
    showEditModal.value = false
  } catch (err) { notifications.error(err.response?.data?.error || err.message) }
}

async function addFriend() { try { await api.post(`/friends/request/${user.value.id}`); user.value.friendStatus = 'pending' } catch (err) { notifications.error(err.message) } }
async function acceptFriend() { try { await api.post(`/friends/accept/${user.value.id}`); user.value.friendStatus = 'friends' } catch (err) { notifications.error(err.message) } }
async function removeFriend() { try { await api.delete(`/friends/${user.value.id}`); user.value.friendStatus = 'none'; showProfileMenu.value = false } catch (err) { notifications.error(err.message) } }

function toggleProfileMenu() { showProfileMenu.value = !showProfileMenu.value }
function closeProfileMenu(e) { if (!e.target.closest('.profile-more-wrap')) showProfileMenu.value = false }

async function blockUser() {
  try {
    await api.post(`/users/${user.value.id}/block`)
    user.value.iBlockedUser = true
    user.value.friendStatus = 'none'
    showProfileMenu.value = false
    notifications.success('Пользователь заблокирован')
  } catch (err) { notifications.error(err.message) }
}

async function unblockUser() {
  try {
    await api.delete(`/users/${user.value.id}/block`)
    user.value.iBlockedUser = false
    showProfileMenu.value = false
    notifications.success('Пользователь разблокирован')
  } catch (err) { notifications.error(err.message) }
}

function addPost(post) { posts.value.unshift(post) }
async function deletePost(id) { try { await api.delete(`/posts/${id}`); posts.value = posts.value.filter(p => p.id !== id) } catch (err) { notifications.error(err.message) } }
function updatePost(updated) { 
  const idx = posts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) {
    if (updated.isArchived) {
      posts.value.splice(idx, 1)
    } else {
      Object.assign(posts.value[idx], updated)
      posts.value.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    }
  }
}

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

async function fetchAudio() {
  const id = route.params.id || authStore.user?.id
  audioLoading.value = true
  try {
    const [libraryRes, historyRes] = await Promise.all([
      api.get(`/music/user/${id}`),
      isOwner.value ? api.get('/music/history') : Promise.resolve({ data: [] })
    ])
    audioLibrary.value = libraryRes.data.map(t => ({
      id: t.trackId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork,
      duration: t.duration
    }))
    audioHistory.value = historyRes.data.map(t => ({
      id: t.trackId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork,
      duration: t.duration
    }))
  } catch {} finally { audioLoading.value = false }
}

async function loadAllTracks() {
  if (!audioSearchQuery.value.trim()) {
    audioLoading.value = true
    try {
      const res = await api.get('/music/trending')
      allTracks.value = res.data
    } catch {} finally { audioLoading.value = false }
  }
}

function handleAudioSearch() {
  clearTimeout(audioSearchTimeout)
  if (!audioSearchQuery.value.trim()) {
    loadAllTracks()
    return
  }
  audioLoading.value = true
  audioSearchTimeout = setTimeout(async () => {
    try {
      const res = await api.get('/music/search', { params: { q: audioSearchQuery.value } })
      allTracks.value = res.data
    } catch {} finally { audioLoading.value = false }
  }, 300)
}

function isTrackPlaying(track) {
  return audioPlayerStore.currentTrack?.id === track.id && audioPlayerStore.isPlaying
}

function isInLibrary(track) {
  return audioLibrary.value.some(t => t.id === track.id)
}

async function playTrack(track) {
  if (audioPlayerStore.currentTrack?.id === track.id) {
    if (audioPlayerStore.isPlaying) {
      audioPlayerStore.pause()
    } else {
      audioPlayerStore.resume()
    }
    return
  }
  
  try {
    const res = await api.get(`/music/stream/${track.id}`)
    audioPlayerStore.play({
      id: track.id,
      url: res.data.url,
      name: track.title,
      source: track.artist,
      artwork: track.artwork
    })
    
    api.post('/music/history', {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      duration: track.duration
    }).catch(() => {})
  } catch (err) {
    notifications.error('Не удалось воспроизвести трек')
  }
}

async function addToLibrary(track) {
  try {
    await api.post('/music/library', {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      duration: track.duration
    })
    audioLibrary.value.unshift(track)
    notifications.success('Добавлено в библиотеку')
  } catch (err) {
    notifications.error('Не удалось добавить')
  }
}

async function removeFromLibrary(track) {
  try {
    await api.delete(`/music/library/${track.id}`)
    audioLibrary.value = audioLibrary.value.filter(t => t.id !== track.id)
  } catch (err) {
    notifications.error('Не удалось удалить')
  }
}

async function pollPostUpdates() {
  if (!posts.value.length) return
  const id = route.params.id || authStore.user?.id
  try {
    const res = await api.get(`/users/${id}/posts`)
    res.data.forEach(newPost => {
      const idx = posts.value.findIndex(p => p.id === newPost.id)
      if (idx !== -1) {
        posts.value[idx].likesCount = newPost.likesCount
        posts.value[idx].commentsCount = newPost.commentsCount
        posts.value[idx].isLiked = newPost.isLiked
      }
    })
  } catch {}
}

let pollInterval = null

watch([() => route.params.id, () => route.params.username], () => { activeTab.value = 'posts'; photos.value = []; videos.value = []; friendsList.value = []; fetchProfile() }, { immediate: true })

onMounted(() => {
  document.addEventListener('click', closeProfileMenu)
  pollInterval = setInterval(() => {
    pollPostUpdates()
    pollFriendStatus()
  }, 500)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfileMenu)
  if (pollInterval) clearInterval(pollInterval)
})
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
.profile-details h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
.username { color: var(--text-muted); font-size: 15px; margin-bottom: 8px; }
.bio { color: var(--text-secondary); margin-bottom: 8px; line-height: 1.5; }
.online-status { margin-bottom: 8px; }
.status { font-size: 14px; color: var(--text-muted); }
.profile-meta { display: flex; gap: 20px; }
.meta-item { color: var(--text-muted); font-size: 14px; }
.profile-actions { display: flex; gap: 10px; flex-shrink: 0; align-items: center; }
.mobile-settings-btn { display: none; }
.btn-icon { width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; }
.btn-icon svg { width: 20px; height: 20px; }
.profile-more-wrap { position: relative; }
.profile-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  padding: 8px;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  z-index: 100;
}
.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.profile-menu-item:hover { background: rgba(255, 255, 255, 0.08); }
.profile-menu-item:active { background: rgba(255, 255, 255, 0.04); }
.profile-menu-item svg { width: 22px; height: 22px; color: var(--text-secondary); flex-shrink: 0; }
.profile-menu-item.danger { color: #ef4444; }
.profile-menu-item.danger svg { color: #ef4444; }
.profile-menu-enter-active { animation: profile-menu-in 0.2s ease-out; }
.profile-menu-leave-active { animation: profile-menu-in 0.15s ease-in reverse; }
@keyframes profile-menu-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.profile-content { max-width: 600px; margin: 0 auto; padding: 0 20px 40px; }
.liquid-tabs { margin-bottom: 20px; justify-content: center; display: flex; position: relative; background: rgba(255,255,255,0.03); border-radius: var(--radius-full); padding: 4px; }
.liquid-tab { padding: 10px 20px; color: var(--text-muted); font-size: 15px; border-radius: var(--radius-full); transition: all 0.2s ease; position: relative; flex: 1; text-align: center; }
.liquid-tab:hover { color: var(--text-secondary); }
.liquid-tab.active { color: #fff; background: rgba(255,255,255,0.08); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.2); }
.liquid-tab.active { color: var(--text-primary); }
.profile-posts { display: flex; flex-direction: column; gap: 16px; }
.media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.media-item { aspect-ratio: 1; overflow: hidden; border-radius: var(--radius); cursor: pointer; position: relative; }
.media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.media-item:hover img, .media-item:hover video { transform: scale(1.05); }
.video-item .play-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); }
.play-icon svg { width: 40px; height: 40px; color: white; }

/* Audio list */
.audio-list { display: flex; flex-direction: column; gap: 4px; }
.audio-list-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-lg); cursor: pointer; transition: background 0.2s ease; }
.audio-list-item:hover { background: rgba(255, 255, 255, 0.06); }
.audio-item-artwork { width: 48px; height: 48px; border-radius: var(--radius); overflow: hidden; position: relative; flex-shrink: 0; }
.audio-item-artwork img { width: 100%; height: 100%; object-fit: cover; }
.audio-item-artwork .artwork-placeholder { width: 100%; height: 100%; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; }
.audio-item-artwork .artwork-placeholder svg { width: 20px; height: 20px; color: var(--text-muted); }
.audio-item-artwork .play-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s ease; }
.audio-list-item:hover .play-overlay, .audio-item-artwork .play-overlay.visible { opacity: 1; }
.audio-item-artwork .play-overlay svg { width: 20px; height: 20px; color: white; }
.audio-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.audio-item-name { font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.audio-item-artist { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.audio-add-btn, .audio-remove-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius); flex-shrink: 0; transition: all 0.15s ease; }
.audio-add-btn:hover, .audio-remove-btn:hover { background: rgba(255, 255, 255, 0.06); color: var(--text-primary); }
.audio-add-btn svg, .audio-remove-btn svg { width: 16px; height: 16px; }
.audio-section { display: flex; flex-direction: column; gap: 16px; }
.audio-tabs { display: flex; gap: 8px; padding: 4px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-full); }
.audio-tab { flex: 1; padding: 10px 16px; font-size: 14px; color: var(--text-muted); border-radius: var(--radius-full); text-align: center; transition: all 0.15s ease; }
.audio-tab:hover { color: var(--text-secondary); }
.audio-tab.active { color: #fff; background: rgba(255, 255, 255, 0.08); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.2); }
.audio-search { margin-bottom: 8px; }
.audio-search .search-input-wrap { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-lg); padding: 12px 16px; }
.audio-search .search-input-wrap svg { width: 20px; height: 20px; color: var(--text-muted); flex-shrink: 0; }
.audio-search .search-input-wrap input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 15px; }
.audio-search .search-input-wrap input::placeholder { color: var(--text-muted); }
.audio-search .search-input-wrap input:focus { outline: none; }
.audio-group { }
.audio-group .group-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.audio-group .group-title .count { color: var(--text-secondary); }

/* Files list */
.files-list { display: flex; flex-direction: column; gap: 4px; }
.file-list-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-lg); text-decoration: none; color: inherit; transition: background 0.2s ease; }
.file-list-item:hover { background: rgba(255, 255, 255, 0.06); }
.file-item-icon { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.08); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.file-item-icon svg { width: 22px; height: 22px; color: rgba(255, 255, 255, 0.6); }
.file-item-info { flex: 1; min-width: 0; }
.file-item-name { display: block; font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-item-size { display: block; font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.file-item-download { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.file-item-download svg { width: 20px; height: 20px; color: rgba(255, 255, 255, 0.4); }

.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); grid-column: 1 / -1; }
.blocked-message { max-width: 400px; margin: 40px auto; padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.blocked-message svg { width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; }
.blocked-message p { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
.blocked-message span { font-size: 14px; color: var(--text-muted); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.close-btn { color: var(--text-muted); padding: 4px; border-radius: var(--radius); }
.close-btn:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-primary); }
.close-btn svg { width: 20px; height: 20px; }
.modal-body { padding: 24px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.username-edit-wrap { display: flex; align-items: center; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; }
.username-edit-wrap .username-prefix { padding-left: 14px; color: var(--text-muted); font-size: 15px; }
.username-edit-wrap input { flex: 1; padding: 12px 14px 12px 4px; background: transparent; border: none; color: var(--text-primary); font-size: 15px; }
.username-edit-wrap input:focus { outline: none; }
.edit-hint { display: block; margin-top: 6px; font-size: 12px; color: #f87171; }
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
  .mobile-settings-btn { display: flex; }
  .media-grid { grid-template-columns: repeat(2, 1fr); }
  
  .liquid-tabs {
    margin: 0 -20px 20px;
    border-radius: 0;
    background: rgba(255,255,255,0.02);
    padding: 0;
    gap: 0;
  }
  
  .liquid-tab {
    padding: 14px 8px;
    font-size: 14px;
    border-radius: 0;
    border-bottom: 2px solid transparent;
  }
  
  .liquid-tab.active {
    background: transparent;
    box-shadow: none;
    border-bottom: 2px solid rgba(255,255,255,0.8);
  }
  
  .audio-tabs {
    margin: 0 -20px 16px;
    padding: 0;
    border-radius: 0;
    background: rgba(255,255,255,0.02);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .audio-tabs::-webkit-scrollbar { display: none; }
  
  .audio-tab {
    padding: 12px 16px;
    font-size: 13px;
    border-radius: 0;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .audio-tab.active {
    background: transparent;
    box-shadow: none;
    border-bottom: 2px solid rgba(255,255,255,0.8);
  }
  
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

@media (hover: none) and (pointer: coarse) {
  .tab:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .profile-actions .btn:active {
    transform: scale(0.92);
    background: rgba(255, 255, 255, 0.15);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .photo-item:active,
  .video-item:active {
    transform: scale(0.96);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .friend-item:active {
    transform: scale(0.97);
    background: rgba(255, 255, 255, 0.06);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .audio-tab:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .audio-list-item:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.08);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}
</style>
