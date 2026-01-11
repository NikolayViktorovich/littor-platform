<template>
  <article class="post glass" :class="{ 'menu-open': menuOpen, 'pinned': post.isPinned && !hidePin, 'is-repost': post.originalPost }">
    <div v-if="post.isPinned && !hidePin" class="pinned-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 15v6m-5-17h10m-8 0v6l-2 3v2h10v-2l-2-3V4"/>
      </svg>
      {{ t('pinned') }}
    </div>
    
    <!-- Regular post header (not repost) -->
    <div v-if="!post.originalPost" class="post-header">
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
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
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
    
    <!-- Repost header - shows reposter first -->
    <template v-if="post.originalPost">
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
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
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
              <button @click="copyLink" class="dropdown-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                {{ t('copyLink') }}
              </button>
              <template v-if="isOwner">
                <div class="dropdown-divider"></div>
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
      
      <!-- Reposter's comment -->
      <p v-if="post.content" class="post-content" v-html="formatContent(post.content)" @click="handleContentClick"></p>
      
      <!-- Original post as embedded block -->
      <div class="repost-embedded" @click="goToOriginalPost">
        <div class="repost-embedded-header">
          <router-link :to="`/profile/${post.originalPost.author.id}`" class="repost-embedded-author" @click.stop>
            <img :src="getAvatarUrl(post.originalPost.author.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
            <span class="repost-embedded-name">{{ post.originalPost.author.name }}</span>
          </router-link>
        </div>
        <p v-if="post.originalPost.content" class="repost-embedded-content" v-html="formatContent(post.originalPost.content)" @click="handleContentClick"></p>
        <div v-if="displayMedia.length > 0" class="repost-embedded-media">
          <img v-if="displayMedia[0].mediaType === 'image' || displayMedia[0].mediaType === 'gif'" :src="displayMedia[0].url" alt="" @click.stop="openMediaGallery(0)">
          <video v-else-if="displayMedia[0].mediaType === 'video'" :src="displayMedia[0].url" @click.stop="openVideoPlayer(displayMedia[0].url)"></video>
          <div v-if="displayMedia.length > 1" class="repost-media-count">+{{ displayMedia.length - 1 }}</div>
        </div>
      </div>
    </template>

    <!-- Regular post content (not repost) -->
    <template v-if="!post.originalPost">
      <p v-if="post.content" class="post-content" v-html="formatContent(post.content)" @click="handleContentClick"></p>
      
      <div v-if="displayMedia.length > 0" class="post-media-gallery" :class="'media-count-' + Math.min(displayMedia.length, 4)">
        <div v-for="(item, index) in displayMedia.slice(0, 4)" :key="item.id || index" class="media-gallery-item" :class="{ 'has-more': index === 3 && displayMedia.length > 4, 'is-video': item.mediaType === 'video' }" @click="item.mediaType === 'video' ? openVideoPlayer(item.url) : openMediaGallery(index)">
          <img v-if="item.mediaType === 'image' || item.mediaType === 'gif'" :src="item.url" alt="">
          <template v-else-if="item.mediaType === 'video'">
            <video 
              :src="item.url" 
              :ref="el => setPostVideoRef(el, item.url)"
              muted 
              loop 
              playsinline
              @loadedmetadata="e => handlePostVideoMeta(e, item.url)"
              @timeupdate="e => handlePostVideoTime(e, item.url)"
            ></video>
            <div class="video-inline-controls">
              <span class="video-time-badge">{{ formatVideoTime(postVideoTimes[item.url] || 0) }}</span>
              <span class="video-mute-badge">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              </span>
            </div>
            <div class="video-progress-bar">
              <div class="video-progress-fill" :style="{ width: (postVideoProgress[item.url] || 0) + '%' }"></div>
            </div>
          </template>
          <div v-if="index === 3 && displayMedia.length > 4" class="more-overlay">+{{ displayMedia.length - 4 }}</div>
        </div>
      </div>
    </template>
    
    <div v-if="fileMedia.length > 0 && !post.originalPost" class="post-files-list">
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
          <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span v-if="post.repostsCount" class="count">{{ formatCount(post.repostsCount) }}</span>
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

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showImageViewer" class="media-viewer-overlay" @click="closeImageViewer">
          <div class="viewer-floating-top" @click.stop>
            <button class="viewer-glass-btn" @click="closeImageViewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="viewer-glass-pill">
              <span>{{ currentMediaIndex + 1 }} / {{ totalMediaCount }}</span>
            </div>
            <div class="viewer-glass-btn-group">
              <button class="viewer-glass-btn" @click="showViewerMenu = !showViewerMenu">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
              <Transition name="dropdown">
                <div v-if="showViewerMenu" class="viewer-glass-dropdown">
                  <button class="viewer-dropdown-item" @click="downloadCurrentMedia('image')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    <span>Сохранить</span>
                  </button>
                  <button class="viewer-dropdown-item" @click="shareCurrentMedia">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    <span>Поделиться</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          
          <div class="media-viewer-content" @click="closeImageViewer" @wheel="handleImageWheel">
            <img 
              :src="currentImageUrl" 
              :style="{ transform: `scale(${imageZoom}) translate(${imageOffset.x}px, ${imageOffset.y}px)` }"
              @click.stop
              @mousedown="startImageDrag"
              @touchstart="startImageTouchDrag"
              @dblclick="resetImageZoom"
              draggable="false"
            >
          </div>
          
          <div class="viewer-floating-bottom" @click.stop>
            <button class="viewer-glass-btn" @click="shareCurrentMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            </button>
            <div class="viewer-glass-info">
              <span class="viewer-info-name">{{ post.author.name }}</span>
              <span class="viewer-info-date">{{ formatViewerDate(post.createdAt) }}</span>
            </div>
            <button class="viewer-glass-btn" @click="downloadCurrentMedia('image')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showGifViewer" class="media-viewer-overlay" @click="closeGifViewer">
          <div class="viewer-floating-top" @click.stop>
            <button class="viewer-glass-btn" @click="closeGifViewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="viewer-glass-pill gif-pill">
              <span class="gif-label">GIF</span>
              <span class="gif-size">{{ formatFileSize(currentGifSize) }}</span>
            </div>
            <div class="viewer-glass-btn-group">
              <button class="viewer-glass-btn" @click="showGifMenu = !showGifMenu">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
              <Transition name="dropdown">
                <div v-if="showGifMenu" class="viewer-glass-dropdown">
                  <button class="viewer-dropdown-item" @click="downloadCurrentMedia('gif')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    <span>Сохранить GIF</span>
                  </button>
                  <button class="viewer-dropdown-item" @click="shareCurrentMedia">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    <span>Поделиться</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          
          <div class="media-viewer-content" @click="closeGifViewer">
            <img :src="currentGifUrl" alt="GIF" @click.stop>
          </div>
          
          <div class="viewer-floating-bottom" @click.stop>
            <button class="viewer-glass-btn" @click="shareCurrentMedia">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            </button>
            <div class="viewer-glass-info">
              <span class="viewer-info-name">{{ post.author.name }}</span>
              <span class="viewer-info-date">{{ formatViewerDate(post.createdAt) }}</span>
            </div>
            <button class="viewer-glass-btn" @click="downloadCurrentMedia('gif')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showVideoPlayer" class="video-player-overlay" @click.self="closeVideoPlayer" @mousemove="resetControlsTimeout" @touchstart="resetControlsTimeout">
          <div class="viewer-floating-top">
            <button class="viewer-glass-btn" @click="closeVideoPlayer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="viewer-glass-pill">
              <span>{{ formatVideoTime(fullVideoCurrentTime) }} / {{ formatVideoTime(fullVideoDuration) }}</span>
            </div>
            <button class="viewer-glass-btn" @click="downloadCurrentMedia('video')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
          </div>
          
          <video 
            ref="fullscreenVideoRef"
            :src="videoPlayerSrc"
            class="video-player-video"
            @loadedmetadata="onFullVideoMeta"
            @timeupdate="onFullVideoTime"
            @ended="onFullVideoEnded"
            @click="toggleFullVideoPlay"
            playsinline
          ></video>
          
          <div class="video-floating-bottom" :class="{ hidden: controlsHidden }">
            <div class="video-progress-glass" @click="seekFullVideo" @mousedown="startSeek" @touchstart="startSeek">
              <div class="video-progress-bg"></div>
              <div class="video-progress-buffered" :style="{ width: bufferedProgress + '%' }"></div>
              <div class="video-progress-fill" :style="{ width: fullVideoProgress + '%' }"></div>
              <div class="video-progress-handle" :style="{ left: fullVideoProgress + '%' }"></div>
            </div>
            
            <div class="video-controls-row">
              <button class="viewer-glass-btn small" @click="skipVideo(-10)">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z"/></svg>
              </button>
              <button class="viewer-glass-btn play-btn" @click="toggleFullVideoPlay">
                <svg v-if="!fullVideoPlaying" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              </button>
              <button class="viewer-glass-btn small" @click="skipVideo(10)">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 3C6.85 3 2.92 6.03 1.53 10.22L3.9 11C4.95 7.81 7.96 5.5 11.5 5.5C13.46 5.5 15.23 6.22 16.62 7.38L14 10H21V3L18.4 5.6C16.55 4 14.15 3 11.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H14C12.9 22 12 21.1 12 20V14C12 12.9 12.9 12 14 12H16C17.11 12 18 12.9 18 14M14 14V20H16V14H14Z"/></svg>
              </button>
              <button class="viewer-glass-btn speed-btn" @click="cyclePlaybackSpeed">
                <span>{{ playbackSpeed }}x</span>
              </button>
              <button class="viewer-glass-btn" @click="toggleFullscreen">
                <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showShareModal" class="share-modal-overlay" @click.self="closeShareModal">
          <div class="share-modal glass-modal" @click.stop>
            <div class="share-modal-header">
              <h3>{{ t('share') }}</h3>
              <button class="share-modal-close" @click="closeShareModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="share-options">
              <button class="share-option" @click="openRepostModal">
                <div class="share-option-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                </div>
                <div class="share-option-text">
                  <span class="share-option-title">{{ t('repostToProfile') }}</span>
                  <span class="share-option-desc">{{ t('repostToProfileDesc') }}</span>
                </div>
              </button>
              
              <button class="share-option" @click="openSendToMessageModal">
                <div class="share-option-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="share-option-text">
                  <span class="share-option-title">{{ t('sendToMessage') }}</span>
                  <span class="share-option-desc">{{ t('sendToMessageDesc') }}</span>
                </div>
              </button>
              
              <button class="share-option" @click="copyPostLink">
                <div class="share-option-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <div class="share-option-text">
                  <span class="share-option-title">{{ t('copyLink') }}</span>
                  <span class="share-option-desc">{{ t('copyLinkDesc') }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showRepostModal" class="share-modal-overlay" @click.self="closeRepostModal">
          <div class="share-modal glass-modal" @click.stop>
            <div class="share-modal-header">
              <button class="share-modal-back" @click="backToShareModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h3>{{ t('repostToProfile') }}</h3>
              <button class="share-modal-close" @click="closeRepostModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="repost-preview">
              <div class="repost-original">
                <div class="repost-original-header">
                  <img :src="getAvatarUrl(post.author.avatar)" class="avatar avatar-sm" alt="">
                  <span class="repost-original-name">{{ post.author.name }}</span>
                </div>
                <p v-if="post.content" class="repost-original-content">{{ post.content.slice(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}</p>
                <div v-if="visualMedia.length > 0" class="repost-original-media">
                  <img v-if="visualMedia[0].mediaType === 'image' || visualMedia[0].mediaType === 'gif'" :src="visualMedia[0].url" alt="">
                  <video v-else-if="visualMedia[0].mediaType === 'video'" :src="visualMedia[0].url"></video>
                </div>
              </div>
            </div>
            
            <div class="repost-comment">
              <textarea v-model="repostComment" :placeholder="t('addComment')" rows="2"></textarea>
            </div>
            
            <button class="repost-submit-btn" @click="submitRepost" :disabled="repostLoading">
              <span v-if="!repostLoading">{{ t('repost') }}</span>
              <div v-else class="spinner small"></div>
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="modal">
        <div v-if="showSendToMessageModal" class="share-modal-overlay" @click.self="closeSendToMessageModal">
          <div class="share-modal glass-modal send-modal" @click.stop>
            <div class="share-modal-header">
              <button class="share-modal-back" @click="backToShareModalFromSend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h3>{{ t('sendToMessage') }}</h3>
              <button class="share-modal-close" @click="closeSendToMessageModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="send-search">
              <input v-model="sendSearchQuery" :placeholder="t('searchFriends')" type="text">
            </div>
            
            <div class="send-friends-list">
              <div v-if="loadingFriends" class="send-loading">
                <div class="spinner"></div>
              </div>
              <div v-else-if="filteredFriends.length === 0" class="send-empty">
                {{ t('noFriendsFound') }}
              </div>
              <button v-else v-for="friend in filteredFriends" :key="friend.id" class="send-friend-item" :class="{ selected: selectedFriends.includes(friend.id) }" @click="toggleFriendSelection(friend.id)">
                <img :src="getAvatarUrl(friend.avatar)" class="avatar" alt="">
                <span class="send-friend-name">{{ friend.name }}</span>
                <div class="send-friend-check" :class="{ checked: selectedFriends.includes(friend.id) }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              </button>
            </div>
            
            <!-- Message input with media -->
            <div class="send-message-section">
              <!-- Media preview -->
              <div v-if="sendMessageMedia.length > 0 || sendSelectedMusic" class="send-media-preview">
                <div v-for="(media, idx) in sendMessageMedia" :key="idx" class="send-media-item">
                  <img v-if="media.type.startsWith('image')" :src="media.preview" alt="">
                  <video v-else-if="media.type.startsWith('video')" :src="media.preview"></video>
                  <div v-else class="send-file-preview">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>
                    <span>{{ media.name }}</span>
                  </div>
                  <button class="send-media-remove" @click="removeSendMedia(idx)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <div v-if="sendSelectedMusic" class="send-music-preview">
                  <img v-if="sendSelectedMusic.artwork" :src="sendSelectedMusic.artwork" class="music-art" alt="">
                  <div v-else class="music-art-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  </div>
                  <div class="music-info">
                    <span class="music-title">{{ sendSelectedMusic.title }}</span>
                    <span class="music-artist">{{ sendSelectedMusic.artist }}</span>
                  </div>
                  <button class="send-media-remove" @click="sendSelectedMusic = null">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              
              <div class="send-input-row">
                <div class="send-input-wrap">
                  <input v-model="sendMessageText" :placeholder="t('addMessage')" type="text">
                  <EmojiPicker @select="insertSendEmoji" class="send-emoji-picker" />
                </div>
                <div class="send-media-btns">
                  <button class="send-media-btn" @click="triggerSendMediaInput('image')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </button>
                  <button class="send-media-btn" @click="triggerSendMediaInput('video')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </button>
                  <button class="send-media-btn" @click="triggerSendMediaInput('file')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/></svg>
                  </button>
                  <button class="send-media-btn" @click="showSendMusicPicker = true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  </button>
                </div>
                <input ref="sendMediaInput" type="file" hidden @change="handleSendMediaSelect" multiple>
              </div>
            </div>
            
            <button class="send-submit-btn" @click="submitSendToFriends" :disabled="selectedFriends.length === 0 || sendLoading">
              <span v-if="!sendLoading">{{ t('send') }} {{ selectedFriends.length > 0 ? `(${selectedFriends.length})` : '' }}</span>
              <div v-else class="spinner small"></div>
            </button>
          </div>
        </div>
      </Transition>
      
      <!-- Music Picker for Send Modal -->
      <Transition name="modal">
        <MusicPicker v-if="showSendMusicPicker" @close="showSendMusicPicker = false" @select="selectSendMusic" />
      </Transition>
    </Teleport>
  </article>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { useSocket } from '../socket'
import { useI18n } from '../i18n'
import EmojiPicker from './EmojiPicker.vue'
import MusicPicker from './MusicPicker.vue'
import api from '../api'

const { t } = useI18n()
const router = useRouter()

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
const showImageViewer = ref(false)
const showGifViewer = ref(false)
const showVideoPlayer = ref(false)
const currentImageUrl = ref('')
const currentGifUrl = ref('')
const currentGifSize = ref(0)
const videoPlayerSrc = ref('')
const currentMediaIndex = ref(0)
const totalMediaCount = ref(1)
const showViewerMenu = ref(false)
const showGifMenu = ref(false)

const showShareModal = ref(false)
const showRepostModal = ref(false)
const showSendToMessageModal = ref(false)
const repostComment = ref('')
const repostLoading = ref(false)
const sendSearchQuery = ref('')
const friendsList = ref([])
const loadingFriends = ref(false)
const selectedFriends = ref([])
const sendLoading = ref(false)
const sendMessageText = ref('')
const sendMessageMedia = ref([])
const sendMediaInput = ref(null)
const showSendMusicPicker = ref(false)
const sendSelectedMusic = ref(null)

const imageZoom = ref(1)
const imageOffset = ref({ x: 0, y: 0 })
let isDraggingImage = false
let dragStart = { x: 0, y: 0 }

const postVideoRefs = ref({})
const postVideoTimes = ref({})
const postVideoDurations = ref({})
const postVideoProgress = ref({})

const fullscreenVideoRef = ref(null)
const fullVideoPlaying = ref(false)
const fullVideoCurrentTime = ref(0)
const fullVideoDuration = ref(0)
const fullVideoProgress = ref(0)
const bufferedProgress = ref(0)
const playbackSpeed = ref(1)
const isFullscreen = ref(false)
const controlsHidden = ref(false)
const isSeeking = ref(false)
let controlsTimeout = null
let seekingProgressBar = null

function setPostVideoRef(el, url) {
  if (el) {
    postVideoRefs.value[url] = el
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      })
    }, { threshold: 0.5 })
    observer.observe(el)
  }
}

function handlePostVideoMeta(e, url) {
  postVideoDurations.value[url] = e.target.duration
}

function handlePostVideoTime(e, url) {
  postVideoTimes.value[url] = e.target.currentTime
  if (postVideoDurations.value[url]) {
    postVideoProgress.value[url] = (e.target.currentTime / postVideoDurations.value[url]) * 100
  }
}

function formatVideoTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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

const displayMedia = computed(() => {
  if (props.post.originalPost) {
    const media = props.post.originalPost.media || []
    const visualTypes = ['image', 'video', 'gif']
    return media.filter(item => visualTypes.includes(item.mediaType))
  }
  return visualMedia.value
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
  openImageViewer(props.post.image, 0, 1)
}

function openMediaGallery(index) {
  const items = displayMedia.value
  const item = items[index]
  if (!item) return
  
  if (item.mediaType === 'video') {
    openVideoPlayerFunc(item.url)
    return
  }
  
  if (item.mediaType === 'gif') {
    openGifViewerFunc(item.url, item.fileSize || 0)
    return
  }

  const imageItems = items.filter(m => m.mediaType === 'image')
  const imageIndex = imageItems.findIndex(m => m.url === item.url)
  openImageViewer(item.url, imageIndex >= 0 ? imageIndex : 0, imageItems.length || 1)
}

function openImageViewer(url, index, total) {
  currentImageUrl.value = url
  currentMediaIndex.value = index
  totalMediaCount.value = total
  imageZoom.value = 1
  imageOffset.value = { x: 0, y: 0 }
  showImageViewer.value = true
  showViewerMenu.value = false
}

function closeImageViewer() {
  showImageViewer.value = false
  showViewerMenu.value = false
  imageZoom.value = 1
  imageOffset.value = { x: 0, y: 0 }
}

function zoomImage(delta) {
  imageZoom.value = Math.max(0.5, Math.min(4, imageZoom.value + delta))
  if (imageZoom.value === 1) {
    imageOffset.value = { x: 0, y: 0 }
  }
}

function resetImageZoom() {
  imageZoom.value = 1
  imageOffset.value = { x: 0, y: 0 }
}

function handleImageWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoomImage(delta)
}

function startImageDrag(e) {
  if (imageZoom.value <= 1) return
  e.stopPropagation()
  isDraggingImage = true
  dragStart = { x: e.clientX - imageOffset.value.x, y: e.clientY - imageOffset.value.y }
  
  const onMove = (moveE) => {
    if (!isDraggingImage) return
    imageOffset.value = {
      x: moveE.clientX - dragStart.x,
      y: moveE.clientY - dragStart.y
    }
  }
  
  const onUp = () => {
    isDraggingImage = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startImageTouchDrag(e) {
  if (imageZoom.value <= 1) return
  e.stopPropagation()
  const touch = e.touches[0]
  isDraggingImage = true
  dragStart = { x: touch.clientX - imageOffset.value.x, y: touch.clientY - imageOffset.value.y }
  
  const onMove = (moveE) => {
    if (!isDraggingImage) return
    const touch = moveE.touches[0]
    imageOffset.value = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    }
  }
  
  const onUp = () => {
    isDraggingImage = false
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onUp)
  }
  
  document.addEventListener('touchmove', onMove)
  document.addEventListener('touchend', onUp)
}

function openGifViewerFunc(url, size) {
  currentGifUrl.value = url
  currentGifSize.value = size
  showGifViewer.value = true
  showGifMenu.value = false
}

function closeGifViewer() {
  showGifViewer.value = false
  showGifMenu.value = false
}

function openVideoPlayer(url) {
  videoPlayerSrc.value = url
  showVideoPlayer.value = true
  fullVideoPlaying.value = false
  fullVideoCurrentTime.value = 0
  fullVideoProgress.value = 0
  controlsHidden.value = false
  playbackSpeed.value = 1
  nextTick(() => {
    if (fullscreenVideoRef.value) {
      fullscreenVideoRef.value.playbackRate = 1
      fullscreenVideoRef.value.play()
      fullVideoPlaying.value = true
      resetControlsTimeout()
    }
  })
}

function closeVideoPlayer() {
  showVideoPlayer.value = false
  if (fullscreenVideoRef.value) {
    fullscreenVideoRef.value.pause()
  }
  fullVideoPlaying.value = false
}

function toggleFullVideoPlay() {
  if (!fullscreenVideoRef.value) return
  if (fullVideoPlaying.value) {
    fullscreenVideoRef.value.pause()
    fullVideoPlaying.value = false
  } else {
    fullscreenVideoRef.value.play()
    fullVideoPlaying.value = true
    resetControlsTimeout()
  }
}

function onFullVideoMeta() {
  if (!fullscreenVideoRef.value) return
  fullVideoDuration.value = fullscreenVideoRef.value.duration
}

function onFullVideoTime() {
  if (!fullscreenVideoRef.value || isSeeking.value) return
  fullVideoCurrentTime.value = fullscreenVideoRef.value.currentTime
  fullVideoProgress.value = (fullVideoCurrentTime.value / fullVideoDuration.value) * 100
  
  const video = fullscreenVideoRef.value
  if (video.buffered.length > 0) {
    bufferedProgress.value = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100
  }
}

function onFullVideoEnded() {
  fullVideoPlaying.value = false
  controlsHidden.value = false
}

function seekFullVideo(e) {
  if (!fullscreenVideoRef.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  fullscreenVideoRef.value.currentTime = percent * fullVideoDuration.value
  fullVideoProgress.value = percent * 100
  resetControlsTimeout()
}

function startSeek(e) {
  e.preventDefault()
  e.stopPropagation()
  isSeeking.value = true
  seekingProgressBar = e.currentTarget
  
  const updateSeek = (clientX) => {
    if (!fullscreenVideoRef.value || !seekingProgressBar) return
    const rect = seekingProgressBar.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    fullVideoProgress.value = percent * 100
    fullscreenVideoRef.value.currentTime = percent * fullVideoDuration.value
  }
  
  const onMove = (moveEvent) => {
    const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    updateSeek(clientX)
    resetControlsTimeout()
  }
  
  const onEnd = () => {
    isSeeking.value = false
    seekingProgressBar = null
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
  resetControlsTimeout()
}

function skipVideo(seconds) {
  if (!fullscreenVideoRef.value) return
  fullscreenVideoRef.value.currentTime = Math.max(0, Math.min(fullVideoDuration.value, fullscreenVideoRef.value.currentTime + seconds))
  resetControlsTimeout()
}

function cyclePlaybackSpeed() {
  const speeds = [0.5, 1, 1.5, 2]
  const currentIndex = speeds.indexOf(playbackSpeed.value)
  playbackSpeed.value = speeds[(currentIndex + 1) % speeds.length]
  if (fullscreenVideoRef.value) {
    fullscreenVideoRef.value.playbackRate = playbackSpeed.value
  }
  resetControlsTimeout()
}

function toggleFullscreen() {
  const container = document.querySelector('.video-player-overlay')
  if (!document.fullscreenElement) {
    container?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  resetControlsTimeout()
}

function resetControlsTimeout() {
  controlsHidden.value = false
  if (controlsTimeout) clearTimeout(controlsTimeout)
  if (fullVideoPlaying.value) {
    controlsTimeout = setTimeout(() => {
      controlsHidden.value = true
    }, 3000)
  }
}

function formatViewerDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function downloadCurrentMedia(type) {
  const url = type === 'image' ? currentImageUrl.value : type === 'gif' ? currentGifUrl.value : videoPlayerSrc.value
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    const ext = type === 'video' ? 'mp4' : type === 'gif' ? 'gif' : 'jpg'
    a.download = `littor_${Date.now()}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('Download failed:', err)
  }
  showViewerMenu.value = false
  showGifMenu.value = false
}

function shareCurrentMedia() {
  const url = currentImageUrl.value || currentGifUrl.value || videoPlayerSrc.value
  if (navigator.share) {
    navigator.share({ url })
  } else {
    navigator.clipboard.writeText(url)
  }
  showViewerMenu.value = false
  showGifMenu.value = false
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
  let text = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  text = text.replace(urlRegex, '<a href="$1" class="content-link external-link" target="_blank" rel="noopener noreferrer">$1</a>')
  text = text.replace(/(?<!href=")\/post\/([a-zA-Z0-9-]+)/g, '<a href="/post/$1" class="content-link internal-link" data-route="/post/$1">/post/$1</a>')
  text = text.replace(/@([a-zA-Z0-9_]{3,20})/g, '<a href="/profile/username/$1" class="mention-link internal-link" data-route="/profile/username/$1">@$1</a>')
  
  return text
}

function handleContentClick(e) {
  const link = e.target.closest('a')
  if (link) {
    e.stopPropagation()
    if (link.classList.contains('internal-link')) {
      e.preventDefault()
      const route = link.dataset.route
      if (route) {
        router.push(route)
      }
    }
  }
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
  showShareModal.value = true
}

function closeShareModal() {
  showShareModal.value = false
}

function openRepostModal() {
  showShareModal.value = false
  repostComment.value = ''
  showRepostModal.value = true
}

function closeRepostModal() {
  showRepostModal.value = false
  repostComment.value = ''
}

function backToShareModal() {
  showRepostModal.value = false
  showShareModal.value = true
}

async function submitRepost() {
  repostLoading.value = true
  try {
    const res = await api.post(`/posts/${props.post.id}/repost`, {
      comment: repostComment.value.trim() || null
    })
    closeRepostModal()
    emit('update', { ...props.post, repostsCount: (props.post.repostsCount || 0) + 1 })
  } catch (err) {
    console.error('Repost failed:', err)
  }
  repostLoading.value = false
}

async function openSendToMessageModal() {
  showShareModal.value = false
  showSendToMessageModal.value = true
  sendSearchQuery.value = ''
  selectedFriends.value = []
  loadingFriends.value = true
  try {
    const res = await api.get('/friends')
    friendsList.value = res.data || []
  } catch (err) {
    console.error('Failed to load friends:', err)
    friendsList.value = []
  }
  loadingFriends.value = false
}

function closeSendToMessageModal() {
  showSendToMessageModal.value = false
  selectedFriends.value = []
  sendMessageText.value = ''
  sendMessageMedia.value = []
  sendSelectedMusic.value = null
}

function backToShareModalFromSend() {
  showSendToMessageModal.value = false
  showShareModal.value = true
}

const filteredFriends = computed(() => {
  if (!sendSearchQuery.value.trim()) return friendsList.value
  const query = sendSearchQuery.value.toLowerCase()
  return friendsList.value.filter(f => f.name.toLowerCase().includes(query))
})

function toggleFriendSelection(friendId) {
  const idx = selectedFriends.value.indexOf(friendId)
  if (idx === -1) {
    selectedFriends.value.push(friendId)
  } else {
    selectedFriends.value.splice(idx, 1)
  }
}

function insertSendEmoji(emoji) {
  sendMessageText.value += emoji
}

function triggerSendMediaInput(type) {
  const input = sendMediaInput.value
  if (!input) return
  
  if (type === 'image') {
    input.accept = 'image/*'
  } else if (type === 'video') {
    input.accept = 'video/*'
  } else {
    input.accept = '*/*'
  }
  input.click()
}

function handleSendMediaSelect(e) {
  const files = Array.from(e.target.files || [])
  files.forEach(file => {
    const preview = URL.createObjectURL(file)
    sendMessageMedia.value.push({
      file,
      type: file.type,
      name: file.name,
      preview
    })
  })
  e.target.value = ''
}

function removeSendMedia(idx) {
  const media = sendMessageMedia.value[idx]
  if (media?.preview) URL.revokeObjectURL(media.preview)
  sendMessageMedia.value.splice(idx, 1)
}

function selectSendMusic(track) {
  sendSelectedMusic.value = track
  showSendMusicPicker.value = false
}

async function submitSendToFriends() {
  if (selectedFriends.value.length === 0) return
  sendLoading.value = true
  try {
    const formData = new FormData()
    formData.append('userIds', JSON.stringify(selectedFriends.value))
    if (sendMessageText.value.trim()) {
      formData.append('message', sendMessageText.value.trim())
    }
    if (sendSelectedMusic.value) {
      formData.append('musicTrackId', sendSelectedMusic.value.id)
      formData.append('musicTitle', sendSelectedMusic.value.title)
      formData.append('musicArtist', sendSelectedMusic.value.artist)
      formData.append('musicArtwork', sendSelectedMusic.value.artwork || '')
    }
    sendMessageMedia.value.forEach(m => {
      formData.append('media', m.file)
    })
    
    await api.post(`/posts/${props.post.id}/share`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    closeSendToMessageModal()
  } catch (err) {
    console.error('Share failed:', err)
  }
  sendLoading.value = false
}

function copyPostLink() {
  const url = `${window.location.origin}/post/${props.post.id}`
  navigator.clipboard.writeText(url)
  closeShareModal()
}

function goToOriginalPost() {
  if (props.post.originalPost?.id) {
    router.push(`/post/${props.post.originalPost.id}`)
  }
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
  background: var(--glass-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}

.post.pinned {
  border: 1px solid rgba(255, 255, 255, 0.18);
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

.post-content :deep(.content-link) {
  color: #5b9aff;
  text-decoration: none;
  word-break: break-all;
}

.post-content :deep(.content-link:hover) {
  text-decoration: underline;
}

.repost-embedded {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.1s ease;
}

.repost-embedded:hover {
  background: rgba(255, 255, 255, 0.06);
}

.repost-embedded:active {
  transform: scale(0.99);
}

.repost-embedded-header {
  margin-bottom: 8px;
}

.repost-embedded-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.repost-embedded-author:hover .repost-embedded-name {
  text-decoration: underline;
}

.repost-embedded-author .avatar-sm {
  width: 24px;
  height: 24px;
}

.repost-embedded-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.repost-embedded-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.repost-embedded-content :deep(.post-link),
.repost-embedded-content :deep(.mention-link) {
  color: #5b9aff;
  text-decoration: none;
}

.repost-embedded-content :deep(.post-link:hover),
.repost-embedded-content :deep(.mention-link:hover) {
  text-decoration: underline;
}

.repost-embedded-media {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  max-height: 200px;
}

.repost-embedded-media img,
.repost-embedded-media video {
  width: 100%;
  height: 100%;
  max-height: 200px;
  object-fit: cover;
  cursor: pointer;
}

.repost-media-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
}

[data-theme="light"] .repost-embedded {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .repost-embedded:hover {
  background: rgba(0, 0, 0, 0.05);
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

.post-gif {
  cursor: default;
}

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
  cursor: pointer;
}
.media-gallery-item.is-video {
  cursor: pointer;
}

.video-inline-controls {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 5;
}

.video-time-badge,
.video-mute-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.video-mute-badge {
  padding: 4px 6px;
}

.video-mute-badge svg {
  width: 14px;
  height: 14px;
}

.video-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 5;
}

.media-gallery-item .video-progress-fill {
  position: relative;
  height: 100%;
  background: #3390ec;
  transition: none !important;
}

.video-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.video-play-overlay svg {
  width: 48px;
  height: 48px;
  color: white;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
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
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .dropdown-item {
  color: var(--text-primary);
}

[data-theme="light"] .dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-primary);
}

[data-theme="light"] .dropdown-item svg {
  color: var(--text-secondary);
}

[data-theme="light"] .dropdown-item:hover svg {
  color: var(--text-primary);
}

[data-theme="light"] .dropdown-item.danger {
  color: #ff3b30;
}

[data-theme="light"] .dropdown-item.danger svg {
  color: #ff3b30;
}

[data-theme="light"] .post-menu-btn {
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .post-menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.7);
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

.media-viewer-overlay,
.video-player-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100000;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.viewer-glass-pill.gif-pill {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewer-glass-pill .gif-label {
  font-weight: 700;
  font-size: 12px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.viewer-glass-pill .gif-size {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.viewer-glass-btn-group {
  position: relative;
}

.viewer-glass-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  padding: 8px;
  border-radius: 16px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.viewer-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.viewer-dropdown-item:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.1);
}

.viewer-dropdown-item svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.viewer-floating-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 10;
  pointer-events: none;
}

.viewer-floating-bottom > * {
  pointer-events: auto;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  user-select: none;
  -webkit-user-drag: none;
  border-radius: 12px;
  cursor: default;
}

.video-player-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: default;
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.video-floating-bottom.hidden {
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
}

.video-progress-glass {
  position: relative;
  width: 100%;
  height: 24px;
  padding: 10px 0;
  cursor: pointer;
}

.video-progress-bg {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.video-progress-buffered {
  position: absolute;
  top: 50%;
  left: 0;
  height: 6px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
}

.video-progress-fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 6px;
  transform: translateY(-50%);
  background: white;
  border-radius: 3px;
  transition: none !important;
}

.video-progress-handle {
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

.video-progress-glass:hover .video-progress-handle {
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  align-self: center;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .viewer-glass-btn {
    width: 40px;
    height: 40px;
    border-radius: 20px;
  }
  
  .viewer-glass-btn svg {
    width: 22px;
    height: 22px;
  }
  
  .viewer-glass-btn.small {
    width: 36px;
    height: 36px;
    border-radius: 18px;
  }
  
  .viewer-glass-btn.small svg {
    width: 18px;
    height: 18px;
  }
  
  .viewer-glass-btn.play-btn {
    width: 48px;
    height: 48px;
    border-radius: 24px;
  }
  
  .viewer-glass-btn.play-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .viewer-glass-pill {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .viewer-glass-info {
    padding: 8px 16px;
  }
  
  .viewer-info-name {
    font-size: 13px;
  }
  
  .viewer-info-date {
    font-size: 11px;
  }
  
  .video-controls-row {
    gap: 8px;
    padding: 6px 12px;
  }
  
  .media-viewer-content {
    padding: 70px 12px;
  }
}

.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
}

.share-modal {
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  overflow: hidden;
}

.share-modal.send-modal {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.share-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.share-modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
}

.share-modal-close,
.share-modal-back {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.share-modal-close:active,
.share-modal-back:active {
  transform: scale(0.85);
  background: rgba(255, 255, 255, 0.1);
}

.share-modal-close svg,
.share-modal-back svg {
  width: 22px;
  height: 22px;
}

.share-options {
  padding: 8px;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
  text-align: left;
}

.share-option:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.08);
}

.share-option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.share-option-icon svg {
  width: 22px;
  height: 22px;
  color: var(--text-primary);
}

.share-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-option-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.share-option-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.repost-preview {
  padding: 16px 20px;
}

.repost-original {
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.repost-original-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.repost-original-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.repost-original-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

.repost-original-media {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  max-height: 120px;
}

.repost-original-media img,
.repost-original-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-height: 120px;
}

.repost-comment {
  padding: 0 20px 16px;
}

.repost-comment textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 15px;
  resize: none;
  transition: border-color 0.1s ease;
}

.repost-comment textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
}

.repost-comment textarea::placeholder {
  color: var(--text-muted);
}

.repost-submit-btn,
.send-submit-btn {
  margin: 0 20px 20px;
  padding: 14px;
  border-radius: 12px;
  background: white;
  color: #1a1a1a;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.repost-submit-btn:active:not(:disabled),
.send-submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.repost-submit-btn:disabled,
.send-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-search {
  padding: 12px 20px;
}

.send-search input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 15px;
}

.send-search input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
}

.send-search input::placeholder {
  color: var(--text-muted);
}

.send-friends-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  max-height: 300px;
}

.send-loading,
.send-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.send-friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.send-friend-item:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.08);
}

.send-friend-item.selected {
  background: rgba(255, 255, 255, 0.06);
}

.send-friend-item .avatar {
  width: 44px;
  height: 44px;
}

.send-friend-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: left;
}

.send-friend-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}

.send-friend-check.checked {
  background: white;
  border-color: white;
}

.send-friend-check svg {
  width: 14px;
  height: 14px;
  color: #1a1a1a;
  opacity: 0;
  transition: opacity 0.1s ease;
}

.send-friend-check.checked svg {
  opacity: 1;
}

.spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

.send-message-section {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.send-media-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.send-media-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.send-media-item img,
.send-media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.send-file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 4px;
}

.send-file-preview svg {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
}

.send-file-preview span {
  font-size: 8px;
  color: var(--text-muted);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
}

.send-media-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-media-remove svg {
  width: 12px;
  height: 12px;
  color: white;
}

.send-music-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  position: relative;
  flex: 1;
  min-width: 150px;
}

.send-music-preview .music-art,
.send-music-preview .music-art-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.send-music-preview .music-art-placeholder {
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-music-preview .music-art-placeholder svg {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
}

.send-music-preview .music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.send-music-preview .music-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.send-music-preview .music-artist {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.send-input-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.send-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px 8px 4px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.send-input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  padding: 10px 0;
}

.send-input-wrap input:focus {
  outline: none;
}

.send-input-wrap input::placeholder {
  color: var(--text-muted);
}

.send-emoji-picker {
  flex-shrink: 0;
}

.send-media-btns {
  display: flex;
  gap: 6px;
}

.send-media-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s cubic-bezier(0.2, 0, 0, 1);
}

.send-media-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.1);
}

.send-media-btn svg {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

[data-theme="light"] .share-modal-overlay {
  background: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .share-option-icon {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .repost-original {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .repost-comment textarea,
[data-theme="light"] .send-search input {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .repost-submit-btn,
[data-theme="light"] .send-submit-btn {
  background: #1a1a1a;
  color: white;
}

[data-theme="light"] .send-friend-check {
  border-color: rgba(0, 0, 0, 0.3);
}

[data-theme="light"] .send-friend-check.checked {
  background: #1a1a1a;
  border-color: #1a1a1a;
}

[data-theme="light"] .send-friend-check.checked svg {
  color: white;
}
</style>
