<template>
  <div class="profile-page">
    <div class="profile-header">
      <button @click="$router.back()" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div class="profile-cover" :style="coverStyle" :class="{ 'cover-removing': coverRemoving }">
        <div class="cover-gradient"></div>
        <Transition name="cover-btn">
          <button v-if="isOwner && user?.cover" @click="deleteCover" class="cover-delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </Transition>
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
          <div class="profile-meta desktop-only">
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
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
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

    <div v-else-if="user?.isPrivate && !isOwner" class="private-account-notice glass">
      <div class="private-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="private-text">
        <p>{{ t('privateAccount') }}</p>
        <span>{{ t('privateAccountDesc') }}</span>
      </div>
    </div>

    <div class="profile-content" v-if="user && !user.blockedByUser && !user.isPrivate">
      <div class="tabs-container">
        <button v-if="showTabArrows" class="tab-nav-btn prev" @click="scrollTabsLeft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="liquid-tabs" ref="tabsContainer">
          <button class="liquid-tab" :class="{ active: activeTab === 'posts' }" @click="setTab('posts')">{{ t('posts') }}</button>
          <button class="liquid-tab" :class="{ active: activeTab === 'photos' }" @click="setTab('photos')">{{ t('photos') }}</button>
          <button class="liquid-tab" :class="{ active: activeTab === 'videos' }" @click="setTab('videos')">{{ t('videos') }}</button>
          <button class="liquid-tab" :class="{ active: activeTab === 'friends' }" @click="setTab('friends')">{{ t('friends') }}</button>
          <button v-if="isOwner" class="liquid-tab" :class="{ active: activeTab === 'archive' }" @click="setTab('archive')">{{ t('archive') }}</button>
        </div>
        <button v-if="showTabArrows" class="tab-nav-btn next" @click="scrollTabsRight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div v-if="activeTab === 'posts'" class="profile-posts">
        <CreatePost v-if="isOwner" @created="addPost" />
        <PostCard v-for="post in posts" :key="post.id" :post="post" @delete="deletePost" @update="updatePost"/>
        <div v-if="!posts.length" class="empty-state glass"><p>{{ t('noPosts2') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'archive'" class="profile-posts">
        <PostCard v-for="post in archivedPosts" :key="post.id" :post="post" @delete="deleteArchivedPost" @update="updateArchivedPost"/>
        <div v-if="!archivedPosts.length" class="empty-state glass"><p>{{ t('archiveEmpty') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'photos'" class="media-grid">
        <div v-for="(photo, idx) in photos" :key="photo.id" class="media-item" @click="openMedia(photo.image, 'image', idx, photos.map(p => ({ src: p.image, type: 'image' })))">
          <img :src="photo.image" alt="">
        </div>
        <div v-if="!photos.length" class="empty-state glass"><p>{{ t('noPhotos') }}</p></div>
      </div>

      <div v-else-if="activeTab === 'videos'" class="media-grid videos-grid">
        <div v-for="(video, idx) in videos" :key="video.id" class="media-item video-item" @click="openMedia(video.video, 'video', idx, videos.map(v => ({ src: v.video, type: 'video' })))">
          <video :src="video.video" muted preload="metadata"></video>
          <div class="play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
        </div>
        <div v-if="!videos.length" class="empty-state glass"><p>{{ t('noVideos') }}</p></div>
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

      <!-- Media Viewer - Liquid Glass -->
      <Transition name="modal">
        <div v-if="showMediaViewer" class="media-viewer-overlay" @click="closeMedia" @mousemove="showProfileControls" @touchstart="showProfileControls">
          <!-- Floating top controls -->
          <div class="viewer-floating-top" @click.stop>
            <button class="viewer-glass-btn" @click="closeMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="viewer-glass-pill" v-if="mediaList.length > 1">
              <span>{{ mediaIndex + 1 }} / {{ mediaList.length }}</span>
            </div>
            <button class="viewer-glass-btn" @click="downloadCurrentMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
          
          <!-- Navigation arrows -->
          <button v-if="mediaList.length > 1 && mediaIndex > 0" class="viewer-nav-glass prev" @click.stop="prevMedia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div class="media-viewer-content" @click="closeMedia">
            <img v-if="mediaViewerType === 'image'" :src="mediaViewerSrc" alt="" @click.stop>
            <video 
              v-else
              ref="profileVideoRef"
              :src="mediaViewerSrc" 
              class="video-player-video"
              @loadedmetadata="onProfileVideoMeta"
              @timeupdate="onProfileVideoTime"
              @ended="onProfileVideoEnded"
              @click.stop="toggleProfileVideoPlay"
              playsinline
            ></video>
          </div>
          
          <button v-if="mediaList.length > 1 && mediaIndex < mediaList.length - 1" class="viewer-nav-glass next" @click.stop="nextMedia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          
          <!-- Video controls (only for video) -->
          <div v-if="mediaViewerType === 'video'" class="video-floating-bottom" :class="{ hidden: profileControlsHidden }" @click.stop>
            <div class="video-progress-glass" @mousedown="startProfileSeek" @touchstart.prevent="startProfileSeek">
              <div class="video-progress-track">
                <div class="video-progress-fill" :style="{ width: profileVideoProgress + '%' }"></div>
              </div>
              <div class="video-progress-thumb" :style="{ left: profileVideoProgress + '%' }"></div>
            </div>
            
            <div class="video-controls-row">
              <button class="viewer-glass-btn small" @click="skipProfileVideo(-10)">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z"/></svg>
              </button>
              <button class="viewer-glass-btn play-btn" @click="toggleProfileVideoPlay">
                <svg v-if="!profileVideoPlaying" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              </button>
              <button class="viewer-glass-btn small" @click="skipProfileVideo(10)">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 3C6.85 3 2.92 6.03 1.53 10.22L3.9 11C4.95 7.81 7.96 5.5 11.5 5.5C13.46 5.5 15.23 6.22 16.62 7.38L14 10H21V3L18.4 5.6C16.55 4 14.15 3 11.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z"/></svg>
              </button>
              <button class="viewer-glass-btn speed-btn" @click="cycleProfileSpeed">
                <span>{{ profilePlaybackSpeed }}x</span>
              </button>
              <button class="viewer-glass-btn" @click="toggleProfileFullscreen">
                <svg v-if="!profileIsFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              </button>
            </div>
          </div>
          
          <!-- Image info (only for images) -->
          <div v-else class="viewer-floating-bottom image-viewer-bottom" @click.stop>
            <button class="viewer-glass-btn" @click="shareCurrentMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            </button>
            <div class="viewer-glass-info">
              <span class="viewer-info-name">{{ user?.name }}</span>
              <span class="viewer-info-date">{{ formatViewerDate(photos[mediaIndex]?.createdAt) }}</span>
            </div>
            <button class="viewer-glass-btn" @click="downloadCurrentMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
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
const tabsContainer = ref(null)
const showTabArrows = ref(false)

function checkTabsOverflow() {
  if (tabsContainer.value) {
    showTabArrows.value = tabsContainer.value.scrollWidth > tabsContainer.value.clientWidth
  }
}

function scrollTabsLeft() {
  if (tabsContainer.value) {
    tabsContainer.value.scrollBy({ left: -150, behavior: 'smooth' })
  }
}

function scrollTabsRight() {
  if (tabsContainer.value) {
    tabsContainer.value.scrollBy({ left: 150, behavior: 'smooth' })
  }
}

const showCoverEditor = ref(false)
const coverPreview = ref(null)
const coverFile = ref(null)
const coverScale = ref(1)
const coverX = ref(0)
const coverY = ref(0)
const showCoverPreviewMode = ref(false)
const coverRemoving = ref(false)
let isDragging = false, dragStartX = 0, dragStartY = 0, startX = 0, startY = 0

const showMediaViewer = ref(false)
const mediaViewerSrc = ref('')
const mediaViewerType = ref('image')
const mediaIndex = ref(0)
const mediaList = ref([])

const profileVideoRef = ref(null)
const profileVideoPlaying = ref(false)
const profileVideoCurrentTime = ref(0)
const profileVideoDuration = ref(0)
const profileVideoProgress = ref(0)
const profileControlsHidden = ref(false)
const profileIsSeeking = ref(false)
const profilePlaybackSpeed = ref(1)
const profileIsFullscreen = ref(false)
let profileControlsTimeout = null
let profileSeekingBar = null

function handleViewerClick(e) {
  if (e.target.classList.contains('media-viewer-overlay')) {
    closeMedia()
  }
}

function handleContentClick(e) {
  if (e.target.classList.contains('media-viewer-content')) {
    closeMedia()
  }
}

function onProfileVideoMeta() {
  if (profileVideoRef.value) {
    profileVideoDuration.value = profileVideoRef.value.duration
    profileVideoRef.value.play()
    profileVideoPlaying.value = true
    resetProfileControlsTimeout()
  }
}

function onProfileVideoTime() {
  if (profileVideoRef.value && !profileIsSeeking.value) {
    profileVideoCurrentTime.value = profileVideoRef.value.currentTime
    profileVideoProgress.value = (profileVideoRef.value.currentTime / profileVideoRef.value.duration) * 100
  }
}

function onProfileVideoEnded() {
  profileVideoPlaying.value = false
  profileControlsHidden.value = false
}

function toggleProfileVideoPlay() {
  if (!profileVideoRef.value) return
  if (profileVideoRef.value.paused) {
    profileVideoRef.value.play()
    profileVideoPlaying.value = true
  } else {
    profileVideoRef.value.pause()
    profileVideoPlaying.value = false
  }
  resetProfileControlsTimeout()
}

function skipProfileVideo(seconds) {
  if (!profileVideoRef.value) return
  profileVideoRef.value.currentTime = Math.max(0, Math.min(profileVideoRef.value.duration, profileVideoRef.value.currentTime + seconds))
  resetProfileControlsTimeout()
}

function seekProfileVideo(e) {
  if (!profileVideoRef.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  profileVideoRef.value.currentTime = percent * profileVideoRef.value.duration
  profileVideoProgress.value = percent * 100
  resetProfileControlsTimeout()
}

function startProfileSeek(e) {
  e.preventDefault()
  e.stopPropagation()
  profileIsSeeking.value = true
  profileSeekingBar = e.currentTarget
  
  const updateSeek = (clientX) => {
    if (!profileVideoRef.value || !profileSeekingBar) return
    const rect = profileSeekingBar.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    profileVideoProgress.value = percent * 100
    profileVideoRef.value.currentTime = percent * profileVideoRef.value.duration
  }
  
  const onMove = (moveEvent) => {
    const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    updateSeek(clientX)
    resetProfileControlsTimeout()
  }
  
  const onEnd = () => {
    profileIsSeeking.value = false
    profileSeekingBar = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  updateSeek(clientX)
  resetProfileControlsTimeout()
}

function cycleProfileSpeed() {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const currentIndex = speeds.indexOf(profilePlaybackSpeed.value)
  profilePlaybackSpeed.value = speeds[(currentIndex + 1) % speeds.length]
  if (profileVideoRef.value) {
    profileVideoRef.value.playbackRate = profilePlaybackSpeed.value
  }
  resetProfileControlsTimeout()
}

function toggleProfileFullscreen() {
  const container = document.querySelector('.media-viewer-overlay')
  if (!document.fullscreenElement) {
    container?.requestFullscreen()
    profileIsFullscreen.value = true
  } else {
    document.exitFullscreen()
    profileIsFullscreen.value = false
  }
  resetProfileControlsTimeout()
}

function resetProfileControlsTimeout() {
  profileControlsHidden.value = false
  clearTimeout(profileControlsTimeout)
  if (profileVideoPlaying.value) {
    profileControlsTimeout = setTimeout(() => {
      profileControlsHidden.value = true
    }, 3000)
  }
}

function showProfileControls() {
  resetProfileControlsTimeout()
}

function formatVideoTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function downloadCurrentMedia() {
  const link = document.createElement('a')
  link.href = mediaViewerSrc.value
  link.download = mediaViewerType.value === 'image' ? 'photo.jpg' : 'video.mp4'
  link.click()
}

function shareCurrentMedia() {
  if (navigator.share) {
    navigator.share({
      title: 'Фото',
      url: mediaViewerSrc.value
    }).catch(() => {})
  } else {
    navigator.clipboard.writeText(mediaViewerSrc.value)
  }
}

function formatViewerDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
      const wasPrivate = user.value.isPrivate
      const wasFriend = user.value.friendStatus === 'friends'
      
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
      user.value.isPrivate = res.data.isPrivate
      
      if (!wasFriend && res.data.friendStatus === 'friends' && wasPrivate) {
        const postsRes = await api.get(`/users/${id}/posts`)
        posts.value = postsRes.data
      }
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

  if (window.innerWidth <= 768) {
    saveCoverDirect(file)
    return
  }
  
  coverPreview.value = URL.createObjectURL(file)
  coverScale.value = 1; coverX.value = 0; coverY.value = 0
  showCoverEditor.value = true
}

async function saveCoverDirect(file) {
  const formData = new FormData(); formData.append('cover', file)
  try {
    const res = await api.post('/users/cover', formData)
    user.value.cover = res.data.cover
    coverFile.value = null
  } catch (err) { notifications.error(err.message) }
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

async function deleteCover() {
  coverRemoving.value = true
  try {
    await api.delete('/users/cover')
    setTimeout(() => {
      user.value.cover = null
      coverRemoving.value = false
    }, 300)
  } catch (err) { 
    coverRemoving.value = false
    notifications.error(err.message) 
  }
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

function openMedia(src, type, idx = 0, list = []) { 
  mediaViewerSrc.value = src
  mediaViewerType.value = type
  mediaIndex.value = idx
  mediaList.value = list
  showMediaViewer.value = true
  profileVideoPlaying.value = false
  profileVideoCurrentTime.value = 0
  profileVideoProgress.value = 0
  profileControlsHidden.value = false
}
function closeMedia() { 
  showMediaViewer.value = false
  if (profileVideoRef.value) {
    profileVideoRef.value.pause()
  }
  profileVideoPlaying.value = false
  clearTimeout(profileControlsTimeout)
}
function prevMedia() { 
  if (mediaIndex.value > 0) { 
    mediaIndex.value--
    const item = mediaList.value[mediaIndex.value]
    mediaViewerSrc.value = item.src
    mediaViewerType.value = item.type
    profileVideoPlaying.value = false
    profileVideoCurrentTime.value = 0
    profileVideoProgress.value = 0
  } 
}
function nextMedia() { 
  if (mediaIndex.value < mediaList.value.length - 1) { 
    mediaIndex.value++
    const item = mediaList.value[mediaIndex.value]
    mediaViewerSrc.value = item.src
    mediaViewerType.value = item.type
    profileVideoPlaying.value = false
    profileVideoCurrentTime.value = 0
    profileVideoProgress.value = 0
  } 
}

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
  
  nextTick(() => checkTabsOverflow())
  window.addEventListener('resize', checkTabsOverflow)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfileMenu)
  window.removeEventListener('resize', checkTabsOverflow)
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.profile-page { min-height: 100vh; padding-left: var(--sidebar-width); }
.profile-header { position: relative; padding: 20px; }
.back-btn { position: absolute; top: 32px; left: 32px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 10; color: var(--text-primary); background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); border-radius: var(--radius-full); transition: all 0.1s ease; }
.back-btn:active { transform: scale(0.88); }
.back-btn svg { width: 20px; height: 20px; }
.profile-cover { height: 200px; border-radius: var(--radius-2xl); overflow: hidden; position: relative; background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%); transition: background-image 0.3s ease; }
.profile-cover.cover-removing { animation: coverFadeOut 0.3s ease forwards; }
@keyframes coverFadeOut { from { opacity: 1; } to { opacity: 0.5; background-image: none; } }
.cover-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5)); }
.cover-edit { position: absolute; bottom: 16px; right: 16px; width: 40px; height: 40px; background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 20; opacity: 0.7; }
.cover-edit:hover { background: var(--glass-bg-hover); opacity: 1; }
.cover-edit:active { transform: scale(0.88); }
.cover-edit svg { width: 20px; height: 20px; color: white; }
.cover-delete { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition); z-index: 20; opacity: 0.7; }
.cover-delete:hover { opacity: 1; }
.cover-delete:active { transform: scale(0.88); }
.cover-delete svg { width: 18px; height: 18px; color: white; }
.cover-btn-enter-active, .cover-btn-leave-active { transition: all 0.15s ease; }
.cover-btn-enter-from, .cover-btn-leave-to { opacity: 0; transform: scale(0.8); }
.profile-info { max-width: 700px; margin: -60px auto 0; padding: 24px; position: relative; display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); border-radius: var(--radius-xl); }
.profile-avatar-wrap { position: relative; flex-shrink: 0; }
.avatar-xl { border: 4px solid var(--bg-primary); }
.avatar-edit { position: absolute; bottom: 4px; right: 4px; width: 36px; height: 36px; background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.1s ease; }
.avatar-edit:hover { background: var(--glass-bg-hover); }
.avatar-edit:active { transform: scale(0.88); }
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
.btn-icon { width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); border-radius: var(--radius-full); transition: all 0.1s ease; }
.btn-icon:active { transform: scale(0.88); }
.btn-icon svg { width: 22px; height: 22px; }
.profile-more-wrap { position: relative; z-index: 1000; }
.profile-more-wrap .btn-icon svg { width: 20px; height: 20px; }
.profile-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  padding: 8px;
  background: rgba(28, 28, 30, 0.92);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  z-index: 10000;
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
  transition: background 0.1s cubic-bezier(0.2, 0, 0, 1);
}
.profile-menu-item:hover { background: rgba(255, 255, 255, 0.08); }
.profile-menu-item:active { background: rgba(255, 255, 255, 0.04); }
.profile-menu-item svg { width: 22px; height: 22px; color: var(--text-secondary); flex-shrink: 0; }
.profile-menu-item.danger { color: #ef4444; }
.profile-menu-item.danger svg { color: #ef4444; }
.profile-menu-enter-active { animation: profile-menu-in 0.15s cubic-bezier(0.2, 0, 0, 1); }
.profile-menu-leave-active { animation: profile-menu-in 0.1s cubic-bezier(0.4, 0, 1, 1) reverse; }
@keyframes profile-menu-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.profile-content { max-width: 600px; margin: 0 auto; padding: 0 20px 40px; }
.tabs-container { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.tab-nav-btn { display: none; width: 32px; height: 32px; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); color: var(--text-muted); flex-shrink: 0; transition: all 0.1s cubic-bezier(0.2, 0, 0, 1); }
.tab-nav-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
.tab-nav-btn:active { transform: scale(0.9); }
.tab-nav-btn svg { width: 16px; height: 16px; }
.liquid-tabs { display: flex; position: relative; background: transparent; border: none; border-radius: 0; padding: 0; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; gap: 8px; justify-content: center; }
.liquid-tabs::-webkit-scrollbar { display: none; }
.liquid-tab { padding: 10px 20px; color: var(--text-secondary); font-size: 14px; font-weight: 500; border-radius: var(--radius-full); background: var(--glass-bg); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--glass-border); transition: all 0.15s cubic-bezier(0.2, 0, 0, 1); position: relative; text-align: center; white-space: nowrap; }
.liquid-tab:active { transform: scale(0.95); }
.liquid-tab.active { color: var(--text-primary); background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.2); }
.profile-posts { display: flex; flex-direction: column; gap: 16px; }
.media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.media-grid.videos-grid { grid-template-columns: repeat(2, 1fr); }
.media-grid.videos-grid .media-item { aspect-ratio: 16/9; }
.media-item { aspect-ratio: 1; overflow: hidden; border-radius: var(--radius); cursor: pointer; position: relative; background: rgba(0, 0, 0, 0.3); }
.media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1); }
.media-item:hover img, .media-item:hover video { transform: scale(1.05); }
.video-item .play-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); pointer-events: none; }
.play-icon svg { width: 40px; height: 40px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
.audio-list { display: flex; flex-direction: column; gap: 4px; }
.audio-list-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-lg); cursor: pointer; transition: background 0.1s cubic-bezier(0.2, 0, 0, 1); }
.audio-list-item:hover { background: rgba(255, 255, 255, 0.06); }
.audio-item-artwork { width: 48px; height: 48px; border-radius: var(--radius); overflow: hidden; position: relative; flex-shrink: 0; }
.audio-item-artwork img { width: 100%; height: 100%; object-fit: cover; }
.audio-item-artwork .artwork-placeholder { width: 100%; height: 100%; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; }
.audio-item-artwork .artwork-placeholder svg { width: 20px; height: 20px; color: var(--text-muted); }
.audio-item-artwork .play-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.1s cubic-bezier(0.2, 0, 0, 1); }
.audio-list-item:hover .play-overlay, .audio-item-artwork .play-overlay.visible { opacity: 1; }
.audio-item-artwork .play-overlay svg { width: 20px; height: 20px; color: white; }
.audio-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.audio-item-name { font-size: 15px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.audio-item-artist { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.audio-add-btn, .audio-remove-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius); flex-shrink: 0; transition: all 0.1s cubic-bezier(0.2, 0, 0, 1); }
.audio-add-btn:hover, .audio-remove-btn:hover { background: rgba(255, 255, 255, 0.06); color: var(--text-primary); }
.audio-add-btn svg, .audio-remove-btn svg { width: 16px; height: 16px; }
.audio-section { display: flex; flex-direction: column; gap: 16px; }
.audio-tabs { display: flex; gap: 4px; padding: 4px; background: var(--glass-bg); border-radius: var(--radius-full); }
.audio-tab { flex: 1; padding: 10px 16px; font-size: 14px; color: var(--text-muted); border-radius: var(--radius-full); text-align: center; transition: color 0.1s cubic-bezier(0.2, 0, 0, 1); font-weight: 500; }
.audio-tab:hover { color: var(--text-secondary); }
.audio-tab.active { color: var(--text-primary); background: var(--glass-bg-active); }
.audio-search { margin-bottom: 8px; }
.audio-search .search-input-wrap { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-full); padding: 12px 16px; }
.audio-search .search-input-wrap svg { width: 20px; height: 20px; color: var(--text-muted); flex-shrink: 0; }
.audio-search .search-input-wrap input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 15px; }
.audio-search .search-input-wrap input::placeholder { color: var(--text-muted); }
.audio-search .search-input-wrap input:focus { outline: none; }
.audio-group { }
.audio-group .group-title { font-size: 14px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.audio-group .group-title .count { color: var(--text-secondary); }
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
.private-account-notice { max-width: 600px; margin: 20px auto; padding: 20px 24px; display: flex; align-items: center; gap: 16px; border-radius: var(--radius-xl); }
.private-icon { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.private-icon svg { width: 24px; height: 24px; color: var(--text-muted); }
.private-text { display: flex; flex-direction: column; gap: 2px; }
.private-text p { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
.private-text span { font-size: 14px; color: var(--text-muted); opacity: 0.8; }
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

.media-viewer-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.92); 
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  z-index: 100000; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer;
}

.viewer-floating-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top));
  z-index: 10;
  pointer-events: none;
}

.viewer-floating-top > * {
  pointer-events: auto;
}

.viewer-glass-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
  cursor: pointer;
}

.viewer-glass-btn:active {
  transform: scale(0.85);
  background: rgba(60, 60, 60, 0.7);
}

.viewer-glass-btn svg {
  width: 24px;
  height: 24px;
}

.viewer-glass-btn.small {
  width: 40px;
  height: 40px;
  border-radius: 20px;
}

.viewer-glass-btn.small svg {
  width: 20px;
  height: 20px;
}

.viewer-glass-btn.play-btn {
  width: 56px;
  height: 56px;
  border-radius: 28px;
}

.viewer-glass-btn.play-btn svg {
  width: 28px;
  height: 28px;
}

.viewer-glass-btn.speed-btn {
  width: auto;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
}

.viewer-glass-pill {
  padding: 10px 18px;
  border-radius: 22px;
  background: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.viewer-glass-pill.time-pill {
  padding: 8px 14px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.viewer-nav-glass {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
  cursor: pointer;
}

.viewer-nav-glass:active {
  transform: translateY(-50%) scale(0.85);
  background: rgba(60, 60, 60, 0.7);
}

.viewer-nav-glass.prev { left: 16px; }
.viewer-nav-glass.next { right: 16px; }

.viewer-nav-glass svg {
  width: 24px;
  height: 24px;
}

.viewer-floating-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 10;
  pointer-events: none;
}

.viewer-floating-bottom > * {
  pointer-events: auto;
}

.viewer-floating-bottom.image-viewer-bottom {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  justify-items: center;
}

.viewer-floating-bottom.image-viewer-bottom > *:first-child {
  justify-self: start;
}

.viewer-floating-bottom.image-viewer-bottom > *:last-child {
  justify-self: end;
}

.video-floating-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.video-floating-bottom > * {
  pointer-events: auto;
}

.video-floating-bottom.hidden {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
}

.viewer-glass-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 20px;
  border-radius: 18px;
  background: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.viewer-info-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.viewer-info-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.video-progress-glass {
  position: relative;
  width: 100%;
  height: 24px;
  padding: 10px 0;
  cursor: pointer;
}

.video-progress-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: visible;
}

.video-progress-fill {
  height: 100%;
  background: white;
  border-radius: 3px;
  transition: none !important;
}

.video-progress-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transition: none !important;
}

.video-progress-glass:hover .video-progress-thumb {
  transform: translate(-50%, -50%) scale(1.2);
}

.video-controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 28px;
  background: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  align-self: center;
}

.media-viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 80px 16px;
  width: 100%;
  cursor: default;
}

.media-viewer-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  cursor: default;
}

.video-player-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: default;
}
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
  .profile-page { padding-left: 0; padding-bottom: 80px; }
  .profile-header { padding: 0; }
  
  .back-btn {
    position: fixed;
    top: 12px;
    left: 12px;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: none;
    z-index: 50;
  }
  
  .profile-cover { 
    height: 180px; 
    border-radius: 0; 
    margin-bottom: 0;
  }
  
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: 0;
    padding: 0 16px 20px;
    background: transparent;
    border: none;
    border-radius: 0;
    gap: 12px;
  }
  
  .profile-avatar-wrap {
    margin-top: -50px;
    z-index: 10;
  }
  
  .profile-avatar-wrap .avatar-xl {
    width: 100px !important;
    height: 100px !important;
    border: 4px solid var(--bg-primary);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .avatar-edit {
    width: 28px;
    height: 28px;
    bottom: 2px;
    right: 2px;
  }
  
  .avatar-edit svg {
    width: 14px;
    height: 14px;
  }
  
  .profile-details {
    width: 100%;
    min-width: unset;
  }
  
  .profile-details h1 {
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  .username {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .bio {
    font-size: 14px;
    margin-bottom: 8px;
    padding: 0 20px;
    line-height: 1.4;
  }
  
  .online-status {
    margin-bottom: 8px;
  }
  
  .status {
    font-size: 13px;
  }

  .profile-actions {
    width: 100%;
    justify-content: center;
    gap: 8px;
    padding: 0 4px;
    margin-top: 0;
  }
  
  .profile-actions .btn {
    flex: 1;
    max-width: 160px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .mobile-settings-btn { 
    display: flex !important;
    flex: 0 0 auto !important;
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    max-width: 44px !important;
    border-radius: 50% !important;
    padding: 0 !important;
    align-items: center;
    justify-content: center;
  }
  
  .mobile-settings-btn svg {
    width: 22px !important;
    height: 22px !important;
  }
  
  .profile-more-wrap .btn-icon {
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    border-radius: 50% !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .profile-more-wrap .btn-icon svg {
    width: 24px !important;
    height: 24px !important;
  }
  
  .profile-actions .profile-more-wrap .btn-icon svg {
    width: 24px !important;
    height: 24px !important;
  }
  
  .profile-meta.desktop-only {
    display: none !important;
  }

  .profile-content {
    padding: 0 0 40px;
  }
  
  .tabs-container {
    margin: 0 0 16px;
    padding: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tab-nav-btn {
    display: none;
  }
  
  .liquid-tabs {
    flex: 1;
    display: flex;
    justify-content: space-around;
    background: transparent;
    padding: 0;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    border-radius: 0;
  }
  
  .liquid-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .liquid-tab {
    flex: 1;
    padding: 14px 8px;
    font-size: 14px;
    font-weight: 400;
    border-radius: 0;
    white-space: nowrap;
    text-align: center;
    background: transparent;
    border: none;
    color: var(--text-muted);
    position: relative;
  }
  
  .liquid-tab:first-child,
  .liquid-tab:last-child {
    border-radius: 0;
  }
  
  .liquid-tab.active {
    background: transparent;
    color: var(--text-primary);
    border: none;
  }
  
  .liquid-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 3px;
    background: var(--accent);
    border-radius: 3px 3px 0 0;
  }

  .media-grid { 
    grid-template-columns: repeat(3, 1fr); 
    gap: 2px;
    margin: 0;
  }
  
  .media-grid.videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .media-grid.videos-grid .media-item {
    aspect-ratio: 16/9;
  }
  
  .media-item {
    border-radius: 0;
  }
  
  .profile-posts {
    gap: 12px;
    padding: 0 12px;
  }
  
  .friends-section {
    gap: 16px;
    padding: 0 12px;
  }
  
  .friends-list-view {
    gap: 2px;
  }
  
  .friend-row {
    padding: 10px 12px;
  }
  
  .empty-state {
    padding: 40px 20px;
    margin: 0 12px;
  }
  
  .private-account-notice,
  .blocked-message {
    margin: 20px 12px;
  }
  
  .cover-edit {
    width: 40px;
    height: 40px;
    bottom: 12px;
    top: auto;
    right: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: none;
    box-shadow: none;
  }
  
  .cover-edit:active {
    transform: scale(0.95);
  }
  
  .cover-delete {
    width: 40px;
    height: 40px;
    top: 12px;
    right: 12px;
  }
  
  .cover-delete svg {
    width: 18px;
    height: 18px;
  }
  
  .cover-edit svg {
    width: 20px;
    height: 20px;
    opacity: 0.7;
  }
  
  .cover-editor {
    max-width: 100%;
    width: 100%;
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .cover-editor .modal-header {
    padding: 12px 16px;
  }
  
  .cover-editor .modal-header h2 {
    font-size: 16px;
  }
  
  .cover-editor-hint {
    font-size: 12px;
    padding: 8px 16px 4px;
  }
  
  .cover-preview-wrap {
    padding: 12px 16px;
    flex: 1;
    display: flex;
    align-items: center;
  }
  
  .cover-preview-container {
    height: 200px;
    width: 100%;
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
    flex-direction: column;
  }
  
  .cover-editor-actions .btn {
    padding: 12px 16px;
    font-size: 14px;
    width: 100%;
  }
  
  .cover-editor-right {
    gap: 8px;
    width: 100%;
    display: flex;
  }
  
  .cover-editor-right .btn {
    flex: 1;
  }
  
  .friends-section {
    gap: 16px;
  }
  
  .friends-list-view {
    gap: 2px;
  }
  
  .friend-row {
    padding: 10px 12px;
  }

  .empty-state {
    padding: 40px 20px;
  }
  
  .profile-more-wrap {
    position: relative;
    z-index: 10000 !important;
  }
  
  .profile-menu-dropdown {
    position: fixed !important;
    top: auto !important;
    bottom: 80px !important;
    left: 16px !important;
    right: 16px !important;
    z-index: 100000 !important;
    min-width: auto !important;
    max-width: none !important;
    background: rgba(10, 10, 12, 0.97) !important;
    backdrop-filter: blur(50px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(50px) saturate(200%) !important;
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

[data-theme="light"] .profile-header {
  background: rgba(255, 255, 255, 0.85);
}

[data-theme="light"] .profile-info {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .back-btn {
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: white;
}

[data-theme="light"] .back-btn:hover {
  background: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .avatar-edit {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .avatar-edit:hover {
  background: rgba(255, 255, 255, 1);
}

[data-theme="light"] .avatar-edit svg {
  color: var(--text-secondary);
}

[data-theme="light"] .cover-edit {
  background: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .cover-edit:hover {
  background: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .cover-edit svg {
  color: white;
}

[data-theme="light"] .cover-delete {
  background: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .cover-delete:hover {
  background: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .cover-delete svg {
  color: white;
}

[data-theme="light"] .profile-menu-dropdown {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .profile-menu-item {
  color: var(--text-primary);
}

[data-theme="light"] .profile-menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .profile-menu-item.danger {
  color: #ff3b30;
}

[data-theme="light"] .blocked-message {
  background: rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .liquid-tabs {
  background: transparent;
}

[data-theme="light"] .liquid-tab {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
  color: var(--text-secondary);
}

[data-theme="light"] .liquid-tab.active {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
}

[data-theme="light"] .audio-tabs {
  background: var(--glass-bg);
}

[data-theme="light"] .audio-tab.active {
  background: var(--glass-bg-active);
}

[data-theme="light"] .audio-search .search-input-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .audio-list-item {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .audio-list-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .artwork-placeholder {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .friends-group .group-title {
  color: var(--text-secondary);
}

[data-theme="light"] .friend-row:hover {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .cover-editor {
  background: rgba(255, 255, 255, 0.95);
}

@media (max-width: 768px) {
  [data-theme="light"] .back-btn {
    background: rgba(0, 0, 0, 0.4);
  }
  
  [data-theme="light"] .tabs-container {
    border-color: rgba(0, 0, 0, 0.1);
  }
  
  [data-theme="light"] .liquid-tab {
    background: transparent;
    border: none;
  }
  
  [data-theme="light"] .liquid-tab.active {
    background: transparent;
  }
}
</style>
