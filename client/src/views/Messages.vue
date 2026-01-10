<template>
  <div class="messages-page">
    <div class="messages-container" :class="{ 'show-chat': selectedUserId && isMobile }">
      <Transition name="dialogs">
        <div v-if="!selectedUserId || !isMobile" class="dialogs-panel glass">
          <div class="dialogs-header">
            <h1 v-if="!dialogsSearchMode">{{ t('chats') }}</h1>
            <div v-else class="dialogs-search-wrap">
              <input v-model="dialogsSearchQuery" type="text" :placeholder="t('searchChats')" class="dialogs-search-input" ref="dialogsSearchInput" @keydown.esc="closeDialogsSearch">
            </div>
            <button @click="toggleDialogsSearch" class="dialogs-search-btn">
              <svg v-if="!dialogsSearchMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" fill="none"/><path d="M21 21l-4.35-4.35"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="dialogs-list">
            <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
            <div v-else-if="!filteredDialogs.length && dialogsSearchQuery" class="empty-state"><p>{{ t('nothingFound') }}</p></div>
            <div v-else-if="!filteredDialogs.length" class="empty-state"><p>{{ t('noDialogs') }}</p></div>
            <div v-else v-for="dialog in filteredDialogs" :key="dialog.user.id" @click="selectDialog(dialog.user.id)" @contextmenu.prevent="openDialogMenu($event, dialog)" class="dialog-item" :class="{ active: selectedUserId === dialog.user.id, unread: dialog.unreadCount > 0, pinned: dialog.isPinned }">
              <div class="dialog-avatar-wrap">
                <img :src="getAvatarUrl(dialog.user.avatar)" class="avatar" alt="" @error="handleAvatarError">
                <span v-if="dialog.user.isOnline" class="online-indicator"></span>
              </div>
              <div class="dialog-content">
                <div class="dialog-header">
                  <div class="dialog-name-wrap">
                    <span class="dialog-name">{{ dialog.user.name }}</span>
                    <svg v-if="dialog.isMuted" class="muted-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3.63 3.63a.996.996 0 0 0 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 1 0 1.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0 0 14 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>
                  </div>
                  <div class="dialog-icons">
                    <svg v-if="dialog.isPinned" class="pinned-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/></svg>
                    <span class="dialog-time">{{ formatTime(dialog.lastMessage.createdAt) }}</span>
                  </div>
                </div>
                <div class="dialog-bottom">
                  <p class="dialog-preview"><span v-if="dialog.lastMessage.senderId === authStore.user?.id" class="you">{{ t('you') }}: </span>{{ dialog.lastMessage.content || t('media') }}</p>
                  <span v-if="dialog.unreadCount" class="unread-badge">{{ dialog.unreadCount }}</span>
                  <svg v-else-if="dialog.lastMessage.senderId === authStore.user?.id" class="read-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6l-11 11-5-5"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <div v-if="!selectedUserId && !isMobile" class="chat-empty glass">
        <h3>{{ t('yourMessages') }}</h3>
        <p>{{ t('selectDialogToStart') }}</p>
      </div>

      <Transition name="chat-slide">
        <div v-if="selectedUserId" class="chat-panel glass" :key="selectedUserId">
          <div class="chat-header">
            <button v-if="isMobile" @click="goBack" class="back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <router-link v-if="chatUser && !selectMode && !chatSearchMode" :to="`/profile/${chatUser.id}`" class="chat-user">
              <div class="chat-avatar-wrap">
                <img :src="getAvatarUrl(chatUser.avatar)" class="avatar" alt="" @error="handleAvatarError">
                <span v-if="chatUser.isOnline" class="online-indicator"></span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ chatUser.name }}</span>
                <span class="user-status">{{ chatUser.isOnline ? t('online') : formatLastSeen(chatUser.lastSeen) }}</span>
              </div>
            </router-link>
            <div v-if="selectMode" class="select-mode-header">
              <button @click="cancelSelectMode" class="select-cancel-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <span class="select-count">{{ t('selected') }}: {{ selectedMessages.length }}</span>
              <div class="select-actions">
                <button @click="bulkForward" class="select-action-btn" :disabled="!selectedMessages.length" :title="t('forward')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 5l7 7-7 7M20 12H4"/></svg>
                </button>
                <button @click="bulkDeleteForAll" class="select-action-btn danger" :disabled="!canBulkDeleteForAll" :title="t('deleteForAll')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM9 9v8M15 9v8M3 5h18M9 5V3h6v2"/></svg>
                </button>
                <button @click="bulkDeleteForMe" class="select-action-btn" :disabled="!selectedMessages.length" :title="t('deleteForMe')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM3 5h18M9 5V3h6v2"/></svg>
                </button>
              </div>
            </div>
            <div v-if="chatSearchMode" class="chat-search-header">
              <input v-model="chatSearchQuery" type="text" :placeholder="t('searchMessages')" class="chat-search-input" ref="chatSearchInput" @keydown.esc="closeChatSearch" @keydown.enter="navigateSearchResult(1)">
              <div class="chat-search-nav" v-if="searchResults.length > 0">
                <span class="search-count">{{ currentSearchIndex + 1 }} / {{ searchResults.length }}</span>
                <button @click="navigateSearchResult(-1)" class="search-nav-btn" :disabled="currentSearchIndex <= 0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
                </button>
                <button @click="navigateSearchResult(1)" class="search-nav-btn" :disabled="currentSearchIndex >= searchResults.length - 1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
              <span v-else-if="chatSearchQuery && !searchResults.length" class="search-no-results">{{ t('notFound') }}</span>
              <button @click="closeChatSearch" class="chat-search-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <button v-if="!selectMode && !chatSearchMode" @click="toggleChatSearch" class="chat-search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" fill="none"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
          </div>

          <!-- Pinned message banner -->
          <div v-if="pinnedMessage && !chatSearchMode" class="pinned-banner" @click="scrollToPinned">
            <svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/></svg>
            <div class="pinned-content">
              <span class="pinned-label">{{ t('pinnedMessage') }}</span>
              <span class="pinned-text">{{ pinnedMessage.content || t('media') }}</span>
            </div>
            <button @click.stop="unpinMessage" class="unpin-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

        <div class="chat-messages" ref="messagesContainer" @scroll="onChatScroll">
          <Transition name="floating-date">
            <div v-if="showFloatingDate" class="floating-date">
              <span>{{ floatingDateText }}</span>
            </div>
          </Transition>
          <div v-if="chatLoading" class="loading-state"><div class="spinner"></div></div>
          <template v-else>
            <TransitionGroup name="message-list" tag="div" class="messages-wrapper">
            <template v-for="(msg, index) in messages" :key="msg.id">
              <div v-if="shouldShowDateSeparator(index)" class="date-separator">
                <span>{{ formatDateSeparator(msg.createdAt) }}</span>
              </div>
              <!-- System message (pin/unpin) -->
              <div v-if="msg.mediaType === 'system'" class="system-message" :class="{ clickable: msg.content.startsWith('pinned_message:') }" @click="handleSystemMessageClick(msg)" @contextmenu.prevent="openSystemMsgMenu($event, msg)">
                <div class="system-message-content glass-pill">
                  <svg v-if="msg.content.startsWith('pinned_message') || msg.content === 'unpinned_message'" class="system-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/></svg>
                  <span>{{ formatSystemMessage(msg) }}</span>
                </div>
              </div>
              <!-- Regular message -->
              <div v-else class="message" :id="'msg-' + msg.id" :class="{ own: msg.senderId === authStore.user?.id, forwarded: msg.forwarded, 'media-message': msg.mediaType === 'circle' || msg.mediaType === 'voice', selected: selectedMessages.includes(msg.id), 'search-highlight': searchResults.includes(msg.id) && searchResults[currentSearchIndex] === msg.id }" @contextmenu.prevent="openMsgMenu($event, msg)" @click="selectMode ? toggleMessageSelection(msg.id) : null">
                <div v-if="selectMode" class="message-checkbox" @click.stop="toggleMessageSelection(msg.id)">
                  <div class="checkbox-inner" :class="{ checked: selectedMessages.includes(msg.id) }">
                    <svg v-if="selectedMessages.includes(msg.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6l-11 11-5-5"/></svg>
                  </div>
                </div>
                <router-link v-if="msg.senderId !== authStore.user?.id" :to="`/profile/${chatUser?.id}`" class="msg-avatar">
                  <img :src="getAvatarUrl(chatUser?.avatar)" class="avatar avatar-sm" alt="" @error="handleAvatarError">
                </router-link>
                <div class="message-content">
                  <!-- Circle video message -->
                  <div v-if="msg.mediaType === 'circle'" class="circle-message">
                    <div class="circle-video-wrap" :class="{ playing: playingCircles[msg.id] }" @click="toggleCircle($event, msg.id)">
                      <svg v-if="playingCircles[msg.id]" class="circle-playback-ring" viewBox="0 0 200 200">
                        <circle class="circle-playback-bar" cx="100" cy="100" r="96" fill="none" stroke="white" stroke-width="4" :stroke-dasharray="603" :stroke-dashoffset="603 - (circleProgress[msg.id] || 0) * 603" stroke-linecap="round" transform="rotate(-90 100 100)"/>
                      </svg>
                      <video :src="msg.media" :id="'circle-' + msg.id" class="circle-player" playsinline @loadedmetadata="onCircleLoaded($event, msg.id)" @timeupdate="onCircleTimeUpdate($event, msg.id)" @ended="onCircleEnded(msg.id)"></video>
                      <div class="circle-overlay-icon" v-if="!playingCircles[msg.id]">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg>
                      </div>
                      <button class="circle-mute" @click.stop="toggleMute(msg.id)">
                        <svg v-if="mutedCircles[msg.id]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                      </button>
                    </div>
                    <div class="circle-info">
                      <span class="circle-timer">{{ getCircleCurrentTime(msg.id) }}</span>
                      <span class="message-time">{{ formatMsgTime(msg.createdAt) }}<svg v-if="msg.senderId === authStore.user?.id" class="read-status" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="msg.isRead ? 'M1 6l4 5 7-9' : 'M5 6l4 5 7-9'"/><path v-if="msg.isRead" d="M16 2l-7 9"/></svg></span>
                    </div>
                  </div>
                  <!-- Voice message -->
                  <div v-else-if="msg.mediaType === 'voice'" class="voice-message-wrap">
                    <button class="voice-play-btn" @click="toggleVoice($event, msg.id)">
                      <svg v-if="!playingVoices[msg.id]" class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
                      <svg v-else class="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 10 5v14a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 6 19V5zM14 5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 18 5v14a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 14 19V5z"/></svg>
                    </button>
                    <div class="voice-wave-wrap">
                      <div class="voice-waveform">
                        <span v-for="i in 30" :key="i" class="wave-bar" :class="{ active: isWaveBarActive(msg.id, i, 30) }" :style="{ height: getWaveHeight(i) + 'px' }"></span>
                      </div>
                      <div class="voice-bottom">
                        <span class="voice-duration">{{ getVoiceDuration(msg.id) }}</span>
                        <span class="voice-msg-time">{{ formatMsgTime(msg.createdAt) }}<svg v-if="msg.senderId === authStore.user?.id" class="read-status" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="msg.isRead ? 'M1 6l4 5 7-9' : 'M5 6l4 5 7-9'"/><path v-if="msg.isRead" d="M16 2l-7 9"/></svg></span>
                      </div>
                    </div>
                    <audio :src="msg.media" :id="'voice-' + msg.id" @ended="onVoiceEnded(msg.id)" @loadedmetadata="onVoiceLoaded($event, msg.id)" @timeupdate="onVoiceTimeUpdate($event, msg.id)" hidden></audio>
                  </div>
                  <!-- Regular message bubble -->
                  <div v-else class="message-bubble" :class="{ 'files-only': getFileMedia(msg).length > 0 && !msg.content && getVisualMedia(msg).length === 0 }">
                    <!-- Reply preview in message -->
                    <div v-if="msg.replyTo" class="reply-in-message" @click.stop="scrollToMessage(msg.replyTo.id)">
                      <span class="reply-sender">{{ msg.replyTo.senderName }}</span>
                      <span class="reply-text">{{ msg.replyTo.content || t('media') }}</span>
                    </div>
                    <div v-if="msg.forwarded && msg.forwardedFrom" class="forwarded-header">
                      <span class="forwarded-text">{{ t('forwardedFrom') }}</span>
                      <img :src="getAvatarUrl(msg.forwardedFrom.avatar)" class="forwarded-avatar" alt="">
                      <span class="forwarded-name">{{ msg.forwardedFrom.name }}</span>
                    </div>
                    <span v-else-if="msg.forwarded" class="forwarded-label">{{ t('forwarded') }}</span>
                    
                    <!-- Visual media gallery (images, videos, gifs) -->
                    <div v-if="getVisualMedia(msg).length > 0" class="msg-media-gallery" :class="'media-count-' + Math.min(getVisualMedia(msg).length, 4)">
                      <div v-for="(item, idx) in getVisualMedia(msg).slice(0, 4)" :key="item.id || idx" class="msg-gallery-item" :class="{ 'has-more': idx === 3 && getVisualMedia(msg).length > 4 }" @click="openMediaViewer(item.url, item.mediaType)">
                        <img v-if="item.mediaType === 'image' || item.mediaType === 'gif'" :src="item.url" alt="">
                        <video v-else-if="item.mediaType === 'video'" :src="item.url" @click.stop controls></video>
                        <div v-if="idx === 3 && getVisualMedia(msg).length > 4" class="msg-gallery-more">+{{ getVisualMedia(msg).length - 4 }}</div>
                      </div>
                    </div>
                    
                    <!-- File media (audio, documents) - shown as list -->
                    <div v-if="getFileMedia(msg).length > 0" class="msg-files-list">
                      <template v-for="(item, idx) in getFileMedia(msg)" :key="item.id || idx">
                        <!-- Audio -->
                        <div v-if="item.mediaType === 'audio'" class="audio-message-wrap" @click="toggleAudio($event, item)">
                          <button class="audio-play-btn" @click.stop="toggleAudio($event, item)">
                            <svg v-if="!isAudioPlaying(item.url)" class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
                            <svg v-else class="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
                          </button>
                          <div class="audio-info">
                            <div class="audio-name">{{ item.fileName || t('audioFile') }}</div>
                            <div class="audio-meta">{{ getAudioTimeGlobal(item.url) }} · {{ item.artist || t('unknownArtist') }}</div>
                          </div>
                          <span class="file-msg-time">{{ formatMsgTime(msg.createdAt) }}<svg v-if="msg.senderId === authStore.user?.id" class="read-status" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="msg.isRead ? 'M1 6l4 5 7-9' : 'M5 6l4 5 7-9'"/><path v-if="msg.isRead" d="M16 2l-7 9"/></svg></span>
                        </div>
                        <!-- File -->
                        <div v-else class="file-message-wrap" @click="downloadFile(item.url, item.fileName)">
                          <div class="file-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
                          </div>
                          <div class="file-info">
                            <div class="file-name">{{ item.fileName || t('fileAttachment') }}</div>
                            <div class="file-size">{{ formatFileSize(item.fileSize) }}</div>
                          </div>
                          <span class="file-msg-time">{{ formatMsgTime(msg.createdAt) }}<svg v-if="msg.senderId === authStore.user?.id" class="read-status" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="msg.isRead ? 'M1 6l4 5 7-9' : 'M5 6l4 5 7-9'"/><path v-if="msg.isRead" d="M16 2l-7 9"/></svg></span>
                        </div>
                      </template>
                    </div>
                    <!-- Music track -->
                    <div v-if="msg.musicTrackId" class="msg-music-track" @click="playMsgMusic(msg)">
                      <div class="msg-music-track-artwork">
                        <img v-if="msg.musicArtwork" :src="msg.musicArtwork" alt="">
                        <div v-else class="msg-music-track-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
                        <div class="msg-music-track-play" :class="{ playing: isMsgMusicPlaying(msg) }">
                          <svg v-if="isMsgMusicPlaying(msg)" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          <svg v-else class="play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                      <div class="msg-music-track-info">
                        <span class="msg-music-track-title">{{ msg.musicTitle }}</span>
                        <span class="msg-music-track-artist">{{ msg.musicArtist }}</span>
                      </div>
                    </div>
                    <span class="message-text-wrap"><p v-if="msg.content" v-html="formatMsgContent(msg.content)"></p><span class="message-time">{{ formatMsgTime(msg.createdAt) }}<svg v-if="msg.senderId === authStore.user?.id" class="read-status" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="1.5"><path :d="msg.isRead ? 'M1 6l4 5 7-9' : 'M5 6l4 5 7-9'"/><path v-if="msg.isRead" d="M16 2l-7 9"/></svg></span></span>
                  </div>
                </div>
              </div>
            </template>
            </TransitionGroup>
          </template>
        </div>

        <div v-if="isRecording" class="voice-recording-bar">
          <div class="voice-rec-left">
            <div class="voice-rec-dot"></div>
            <span class="voice-rec-time">{{ formatRecTimeMs(recordingTime) }}</span>
          </div>
          <button @click="cancelRecording" class="voice-rec-cancel">{{ t('cancel') }}</button>
          <button @click="stopVoice" class="voice-rec-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
        </div>
        <div v-if="chatUser?.blockedByUser" class="chat-blocked blocked-by-user">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-6.36 3.64l12.72 12.72"/>
          </svg>
          <span>{{ t('cantWriteUser') }}</span>
        </div>
        <div v-else-if="chatUser?.iBlockedUser" class="chat-blocked">
          <button @click="unblockUser" class="unblock-btn">{{ t('unblockUser') }}</button>
        </div>
        <!-- Reply preview above input -->
        <div v-else-if="replyingTo" class="reply-preview">
          <div class="reply-preview-content">
            <span class="reply-preview-name">{{ replyingTo.senderName }}</span>
            <span class="reply-preview-text">{{ replyingTo.content || t('media') }}</span>
          </div>
          <button @click="cancelReply" class="reply-cancel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <!-- Media preview cards above input -->
        <div v-if="mediaFiles.length > 0 && !chatUser?.blockedByUser && !chatUser?.iBlockedUser" class="msg-media-previews">
          <div v-for="item in mediaFiles" :key="item.id" class="msg-media-preview-item">
            <div class="msg-preview-thumb">
              <img v-if="item.type === 'image' || item.type === 'gif'" :src="item.preview" alt="">
              <video v-else-if="item.type === 'video'" :src="item.preview" muted></video>
              <div v-else class="msg-preview-icon" :class="item.type">
                <svg v-if="item.type === 'audio'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                <svg v-else-if="item.type === 'voice'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
              </div>
            </div>
            <button @click="removeMediaFile(item.id)" class="msg-preview-remove-small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <button v-if="mediaFiles.length > 1" @click="clearMedia" class="msg-clear-all">{{ t('clearAllMedia') }}</button>
        </div>
        <div v-if="selectedMusic && !chatUser?.blockedByUser && !chatUser?.iBlockedUser" class="msg-music-preview">
          <div class="msg-music-artwork">
            <img v-if="selectedMusic.artwork" :src="selectedMusic.artwork" alt="">
            <div v-else class="msg-music-placeholder"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
          </div>
          <div class="msg-music-info">
            <span class="msg-music-title">{{ selectedMusic.title }}</span>
            <span class="msg-music-artist">{{ selectedMusic.artist }}</span>
          </div>
          <button @click="selectedMusic = null" class="msg-music-remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form v-if="!chatUser?.blockedByUser && !chatUser?.iBlockedUser" @submit.prevent="sendMessage" class="chat-input" v-show="!isRecording">
          <div class="input-actions-left">
            <div class="attach-wrap">
              <button type="button" class="action-btn" @click="showAttachMenu = !showAttachMenu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <Transition name="attach-dropdown">
                <div v-if="showAttachMenu" class="attach-dropdown glass-modal" @click.stop>
                  <label class="attach-dropdown-item">
                    <input type="file" accept="image/*" @change="handleAttachSelect" multiple hidden>
                    <div class="attach-icon photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5-11 11"/></svg></div>
                    <span>{{ t('photo') }}</span>
                  </label>
                  <label class="attach-dropdown-item">
                    <input type="file" accept="video/*" @change="handleAttachSelect" multiple hidden>
                    <div class="attach-icon video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7zM1 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7z"/></svg></div>
                    <span>{{ t('video') }}</span>
                  </label>
                  <label class="attach-dropdown-item">
                    <input type="file" accept="image/gif" @change="handleAttachSelect" multiple hidden>
                    <div class="attach-icon gif"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4.18a2.18 2.18 0 0 1 2.18-2.18h15.64A2.18 2.18 0 0 1 22 4.18v15.64A2.18 2.18 0 0 1 19.82 22H4.18A2.18 2.18 0 0 1 2 19.82V4.18zM7 10.5v3M10 10v4c0 .5.5 1 1 1h1.5M14 10v4h2.5"/></svg></div>
                    <span>{{ t('gif') }}</span>
                  </label>
                  <label class="attach-dropdown-item">
                    <input type="file" accept="audio/*" @change="handleAttachSelect" multiple hidden>
                    <div class="attach-icon audio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg></div>
                    <span>{{ t('audio') }}</span>
                  </label>
                  <label class="attach-dropdown-item">
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z" @change="handleAttachSelect" multiple hidden>
                    <div class="attach-icon file"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg></div>
                    <span>{{ t('file') }}</span>
                  </label>
                  <button class="attach-dropdown-item" @click="showMusicPicker = true; showAttachMenu = false">
                    <div class="attach-icon music"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg></div>
                    <span>{{ t('music') }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
          <div class="input-wrap">
            <input v-model="newMessage" :placeholder="t('writeMessage')" autocomplete="off" ref="msgInput" @input="handleMessageInput" @keydown="handleMentionKeydown">
            <Transition name="mention-dropdown">
              <div v-if="mentionMode && mentionUsers.length > 0" class="mention-dropdown">
                <div v-for="(user, idx) in mentionUsers" :key="user.id" class="mention-item" :class="{ active: idx === mentionIndex }" @click="selectMention(user)" @mouseenter="mentionIndex = idx">
                  <img :src="getAvatarUrl(user.avatar)" class="mention-avatar" alt="" @error="handleAvatarError">
                  <div class="mention-info">
                    <span class="mention-name">{{ user.name }}</span>
                    <span class="mention-username">@{{ user.username }}</span>
                  </div>
                </div>
              </div>
            </Transition>
            <EmojiPicker @select="insertEmoji" />
          </div>
          <div class="input-actions-right">
            <button type="submit" class="action-btn voice-btn" @click.prevent="onRightBtnClick" @mousedown="onVoiceMouseDown" @mousemove="onVoiceMouseMove" @mouseup="onVoiceMouseUp" @mouseleave="onVoiceMouseUp" @touchstart.prevent="onVoiceBtnDown" @touchend.prevent="onVoiceBtnUp" @touchmove.prevent="onVoiceBtnTouchMove" ref="voiceBtnRef">
              <Transition name="icon-flip" mode="out-in">
                <svg v-if="newMessage.trim() || mediaFiles.length > 0" key="send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                <svg v-else-if="voiceBtnMode === 'voice'" key="mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg>
                <svg v-else key="circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
              </Transition>
            </button>
          </div>
        </form>
      </div>
      </Transition>

      <Transition name="circle-overlay">
        <div v-if="showCircleOverlay" class="circle-overlay">
        <div class="circle-rec-container">
          <div class="circle-rec-video-wrap">
            <svg class="circle-progress-ring" viewBox="0 0 200 200">
              <circle class="circle-progress-bg" cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
              <circle class="circle-progress-bar" cx="100" cy="100" r="96" fill="none" stroke="white" stroke-width="4" :stroke-dasharray="603" :stroke-dashoffset="603 - (recordingTime / 60) * 603" stroke-linecap="round" transform="rotate(-90 100 100)"/>
            </svg>
            <video ref="circlePreviewEl" class="circle-preview-video" autoplay muted playsinline></video>
          </div>
          <button class="circle-rec-pause" @click="toggleCirclePause">
            <svg v-if="!circlePaused" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>
        </div>
        <div class="circle-rec-controls">
          <div class="circle-rec-left">
            <button class="circle-rec-btn" @click="switchCamera">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
            </button>
            <button class="circle-rec-btn" :class="{ active: circleMuted }" @click="toggleCircleRecMute">
              <svg v-if="circleMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
            </button>
          </div>
          <div class="circle-rec-bottom">
            <div class="circle-rec-dot"></div>
            <span class="circle-rec-time">{{ formatRecTimeMs(recordingTime) }}</span>
            <button @click="cancelRecording" class="circle-rec-cancel">{{ t('cancel') }}</button>
          </div>
          <button @click="stopCircle" class="circle-rec-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
      </Transition>

      <Teleport to="body">
        <Transition name="menu">
          <div v-if="showDialogMenu" class="msg-menu glass-modal" :style="{ top: dialogMenuY + 'px', left: dialogMenuX + 'px' }" @click.stop>
            <button class="menu-item" @click="toggleDialogPin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/></svg>{{ selectedDialog?.isPinned ? t('unpinDialog') : t('pinDialog') }}</button>
            <button class="menu-item" @click="toggleDialogMute"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><template v-if="!selectedDialog?.isMuted"><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></template><template v-else><path d="M23 9l-6 6M17 9l6 6"/></template></svg>{{ selectedDialog?.isMuted ? t('unmuteSound') : t('muteSound') }}</button>
            <button class="menu-item muted" @click="confirmDeleteDialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForMe') }}</button>
            <button class="menu-item danger" @click="confirmDeleteDialogForAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM9 9v8M15 9v8M3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForAll') }}</button>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showDeleteDialogModal" class="modal-overlay" @click.self="showDeleteDialogModal = false">
            <div class="delete-modal glass-modal">
              <h3>{{ t('deleteDialog') }}</h3>
              <p>{{ t('deleteDialogDesc') }}</p>
              <div class="delete-actions">
                <button class="delete-btn cancel" @click="showDeleteDialogModal = false">{{ t('cancel') }}</button>
                <button class="delete-btn" @click="deleteDialog(false)">{{ t('delete') }}</button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showDeleteDialogForAllModal" class="modal-overlay" @click.self="showDeleteDialogForAllModal = false">
            <div class="delete-modal glass-modal">
              <h3>{{ t('deleteDialogForAll') }}</h3>
              <p>{{ t('deleteDialogForAllDesc') }}</p>
              <div class="delete-actions">
                <button class="delete-btn cancel" @click="showDeleteDialogForAllModal = false">{{ t('cancel') }}</button>
                <button class="delete-btn danger" @click="deleteDialog(true)">{{ t('delete') }}</button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="menu">
          <div v-if="showMsgMenu" class="msg-menu glass-modal" :style="{ top: msgMenuY + 'px', left: msgMenuX + 'px' }" @click.stop>
            <button class="menu-item" @click="startReply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17l-5-5 5-5M4 12h16"/></svg>{{ t('reply') }}</button>
            <button class="menu-item" @click="forwardMessage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17l5-5-5-5M20 12H4"/></svg>{{ t('forward') }}</button>
            <button class="menu-item" @click="pinMessage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10M9 4v6l-2 3v2h10v-2l-2-3V4M12 15v6"/></svg>{{ pinnedMessage?.id === selectedMsg?.id ? t('unpin') : t('pin') }}</button>
            <button class="menu-item" @click="startSelectMode"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>{{ t('selected') }}</button>
            <button class="menu-item muted" @click="confirmDeleteForMe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForMe') }}</button>
            <button v-if="selectedMsg?.senderId === authStore.user?.id" class="menu-item danger" @click="confirmDeleteForAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM9 9v8M15 9v8M3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForAll') }}</button>
          </div>
        </Transition>

        <Transition name="menu">
          <div v-if="showSystemMsgMenu" class="msg-menu glass-modal" :style="{ top: systemMsgMenuY + 'px', left: systemMsgMenuX + 'px' }" @click.stop>
            <button class="menu-item muted" @click="deleteSystemMsgForMe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForMe') }}</button>
            <button v-if="selectedSystemMsg?.senderId === authStore.user?.id" class="menu-item danger" @click="deleteSystemMsgForAll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21H7a2 2 0 0 1-2-2V5h14v14a2 2 0 0 1-2 2zM9 9v8M15 9v8M3 5h18M9 5V3h6v2"/></svg>{{ t('deleteForAll') }}</button>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showDeleteForAllModal" class="modal-overlay" @click.self="showDeleteForAllModal = false">
            <div class="delete-modal glass-modal">
              <h3>{{ t('deleteForAllQ') }}</h3>
              <p>{{ t('deleteForAllDesc') }}</p>
              <label class="custom-checkbox"><input type="checkbox" v-model="rememberDeleteForAll"><span class="checkmark"></span><span class="label-text">{{ t('rememberChoice') }}</span></label>
              <div class="delete-actions">
                <button class="delete-btn cancel" @click="showDeleteForAllModal = false">{{ t('cancel') }}</button>
                <button class="delete-btn danger" @click="deleteForAll">{{ t('delete') }}</button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showDeleteForMeModal" class="modal-overlay" @click.self="showDeleteForMeModal = false">
            <div class="delete-modal glass-modal">
              <h3>{{ t('deleteForMeQ') }}</h3>
              <p>{{ t('deleteForMeDesc') }}</p>
              <label class="custom-checkbox"><input type="checkbox" v-model="rememberDeleteForMe"><span class="checkmark"></span><span class="label-text">{{ t('rememberChoice') }}</span></label>
              <div class="delete-actions">
                <button class="delete-btn cancel" @click="showDeleteForMeModal = false">{{ t('cancel') }}</button>
                <button class="delete-btn" @click="deleteForMe">{{ t('delete') }}</button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showForwardModal" class="modal-overlay" @click.self="showForwardModal = false">
            <div class="modal glass-modal">
              <div class="modal-header"><h2>{{ bulkForwardMode ? t('forwardCount') + ' (' + selectedMessages.length + ')' : t('forwardMessage') }}</h2><button @click="showForwardModal = false" class="close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
              <div class="forward-list">
                <div v-for="d in dialogs" :key="d.user.id" class="forward-item" @click="doForward(d.user.id)"><img :src="getAvatarUrl(d.user.avatar)" class="avatar" alt=""><span>{{ d.user.name }}</span></div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="modal">
          <div v-if="showMediaViewerModal" class="media-viewer-overlay" @click.self="showMediaViewerModal = false">
            <button class="viewer-close" @click="showMediaViewerModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            <div class="viewer-content"><img v-if="viewerType === 'image'" :src="viewerSrc" alt=""><video v-else :src="viewerSrc" controls autoplay></video></div>
          </div>
        </Transition>

        <Transition name="modal">
          <MusicPicker v-if="showMusicPicker" @close="showMusicPicker = false" @select="onMusicSelect" />
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { currentChatUserId } from '../stores/chat'
import { cache } from '../stores/cache'
import { useSocket } from '../socket'
import { useI18n } from '../i18n'
import EmojiPicker from '../components/EmojiPicker.vue'
import MusicPicker from '../components/MusicPicker.vue'
import api from '../api'

const { t } = useI18n()

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotificationsStore()
const audioPlayerStore = useAudioPlayerStore()
const { on, off } = useSocket()

const dialogs = ref([])
const loading = ref(true)
const selectedUserId = ref(null)
const chatUser = ref(null)
const messages = ref([])
const chatLoading = ref(false)
const newMessage = ref('')
const messagesContainer = ref(null)
const msgInput = ref(null)
const circlePreviewEl = ref(null)

const mediaFiles = ref([])
const isRecording = ref(false)
const showCircleOverlay = ref(false)
const recordingTime = ref(0)
const circlePaused = ref(false)
const circleMuted = ref(false)
const facingMode = ref('user')
const voiceBtnMode = ref('voice')
const voiceBtnStartX = ref(0)
const voiceBtnStartY = ref(0)
const voiceBtnRef = ref(null)
const mouseDownOnVoice = ref(false)
const mouseDragStartY = ref(0)
const voiceRecLevels = ref(Array(24).fill(4))
let mediaRecorder = null, recordedChunks = [], recordingInterval = null, stream = null, pollInterval = null
let audioContext = null, analyser = null, animationId = null

const showMsgMenu = ref(false)
const msgMenuX = ref(0)
const msgMenuY = ref(0)

const showDialogMenu = ref(false)
const dialogMenuX = ref(0)
const dialogMenuY = ref(0)
const selectedDialog = ref(null)
const showDeleteDialogModal = ref(false)
const showDeleteDialogForAllModal = ref(false)

const playingCircles = ref({})
const mutedCircles = ref({})
const playingVoices = ref({})
const playingAudios = ref({})
const voiceDurations = ref({})
const voiceTotalDurations = ref({})
const voiceProgress = ref({})
const audioDurations = ref({})
const audioTotalDurations = ref({})
const audioProgress = ref({})
const circleDurations = ref({})
const circleCurrentTime = ref({})
const circleProgress = ref({})
const selectedMsg = ref(null)
const showForwardModal = ref(false)
const showDeleteForAllModal = ref(false)
const showDeleteForMeModal = ref(false)
const showAttachMenu = ref(false)

const showSystemMsgMenu = ref(false)
const systemMsgMenuX = ref(0)
const systemMsgMenuY = ref(0)
const selectedSystemMsg = ref(null)
const rememberDeleteForAll = ref(false)
const rememberDeleteForMe = ref(false)
const showMediaViewerModal = ref(false)
const viewerSrc = ref('')
const viewerType = ref('image')

const replyingTo = ref(null)
const selectMode = ref(false)
const selectedMessages = ref([])
const pinnedMessage = ref(null)
const bulkForwardMode = ref(false)
const showMusicPicker = ref(false)
const selectedMusic = ref(null)

const dialogsSearchMode = ref(false)
const dialogsSearchQuery = ref('')
const dialogsSearchInput = ref(null)
const chatSearchMode = ref(false)
const chatSearchQuery = ref('')
const chatSearchInput = ref(null)
const searchResults = ref([])
const currentSearchIndex = ref(0)

const mentionMode = ref(false)
const mentionQuery = ref('')
const mentionUsers = ref([])
const mentionIndex = ref(0)
const mentionStartPos = ref(0)
let mentionSearchTimeout = null

const scrollPositions = {}

const showFloatingDate = ref(false)
const floatingDateText = ref('')
let floatingDateHideTimeout = null
let lastScrollTime = 0
let isProgrammaticScroll = false

const canSend = computed(() => newMessage.value.trim() || mediaFiles.value.length > 0 || selectedMusic.value)
const isMobile = ref(window.innerWidth <= 900)

const filteredDialogs = computed(() => {
  if (!dialogsSearchQuery.value.trim()) return dialogs.value
  const q = dialogsSearchQuery.value.toLowerCase()
  return dialogs.value.filter(d => d.user.name.toLowerCase().includes(q))
})

function toggleDialogsSearch() {
  dialogsSearchMode.value = !dialogsSearchMode.value
  if (dialogsSearchMode.value) {
    nextTick(() => dialogsSearchInput.value?.focus())
  } else {
    dialogsSearchQuery.value = ''
  }
}

function closeDialogsSearch() {
  dialogsSearchMode.value = false
  dialogsSearchQuery.value = ''
}

function toggleChatSearch() {
  chatSearchMode.value = !chatSearchMode.value
  if (chatSearchMode.value) {
    nextTick(() => chatSearchInput.value?.focus())
  } else {
    closeChatSearch()
  }
}

function closeChatSearch() {
  chatSearchMode.value = false
  chatSearchQuery.value = ''
  searchResults.value = []
  currentSearchIndex.value = 0
}

watch(chatSearchQuery, (q) => {
  if (!q.trim()) {
    searchResults.value = []
    currentSearchIndex.value = 0
    return
  }
  const query = q.toLowerCase()
  searchResults.value = messages.value
    .filter(m => m.content && m.content.toLowerCase().includes(query))
    .map(m => m.id)
  currentSearchIndex.value = searchResults.value.length > 0 ? searchResults.value.length - 1 : 0
  if (searchResults.value.length > 0) {
    scrollToMessage(searchResults.value[currentSearchIndex.value])
  }
})

function navigateSearchResult(dir) {
  if (!searchResults.value.length) return
  currentSearchIndex.value = Math.max(0, Math.min(searchResults.value.length - 1, currentSearchIndex.value + dir))
  scrollToMessage(searchResults.value[currentSearchIndex.value])
}

function saveScrollPosition() {
  if (selectedUserId.value && messagesContainer.value) {
    scrollPositions[selectedUserId.value] = messagesContainer.value.scrollTop
  }
}

function restoreScrollPosition(userId) {
  nextTick(() => {
    if (messagesContainer.value) {
      isProgrammaticScroll = true
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      setTimeout(() => { isProgrammaticScroll = false }, 100)
    }
  })
}

function goBack() { saveScrollPosition(); selectedUserId.value = null; chatUser.value = null; currentChatUserId.value = null; replyingTo.value = null; selectMode.value = false; selectedMessages.value = []; pinnedMessage.value = null; closeChatSearch() }
function handleResize() { isMobile.value = window.innerWidth <= 900 }
function getAvatarUrl(a) { return a || '/default-avatar.svg' }
function handleAvatarError(e) { e.target.src = '/default-avatar.svg' }
function formatTime(d) { 
  const date = new Date(d), now = new Date()
  const diff = (now - date) / 1000
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  if (isToday) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return t('yesterday')
  if (diff < 604800) return date.toLocaleDateString('ru-RU', { weekday: 'short' })
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: '2-digit', year: '2-digit' }).replace(/\//g, '.')
}
function formatMsgTime(d) { return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }

function formatMsgContent(content) {
  if (!content) return ''
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/@([a-zA-Z0-9_]{3,20})/g, '<a href="/profile/username/$1" class="mention-link">@$1</a>')
}

function formatDateSeparator(d) {
  const date = new Date(d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (msgDate.getTime() === today.getTime()) return t('today')
  if (msgDate.getTime() === yesterday.getTime()) return t('yesterdayFull')
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function formatSystemMessage(msg) {
  const isMe = msg.senderId === authStore.user?.id
  const name = chatUser.value?.name
  if (msg.content.startsWith('pinned_message:')) {
    return isMe ? t('youPinnedMessage') : t('userPinnedMessage').replace('{name}', name)
  }
  if (msg.content === 'unpinned_message') {
    return isMe ? t('youUnpinnedMessage') : t('userUnpinnedMessage').replace('{name}', name)
  }
  return msg.content
}

function handleSystemMessageClick(msg) {
  if (msg.content.startsWith('pinned_message:')) {
    const pinnedMsgId = msg.content.split(':')[1]
    if (pinnedMsgId) {
      scrollToMessage(pinnedMsgId)
    }
  }
}

function openSystemMsgMenu(e, msg) {
  selectedSystemMsg.value = msg
  systemMsgMenuX.value = Math.min(e.clientX, window.innerWidth - 200)
  systemMsgMenuY.value = Math.min(e.clientY, window.innerHeight - 120)
  showSystemMsgMenu.value = true
}

function closeSystemMsgMenu() {
  showSystemMsgMenu.value = false
  selectedSystemMsg.value = null
}

async function deleteSystemMsgForMe() {
  if (!selectedSystemMsg.value) return
  try {
    await api.delete(`/messages/${selectedSystemMsg.value.id}`)
    messages.value = messages.value.filter(m => m.id !== selectedSystemMsg.value.id)
  } catch (err) { notifications.error(err.message) }
  closeSystemMsgMenu()
}

async function deleteSystemMsgForAll() {
  if (!selectedSystemMsg.value) return
  try {
    await api.delete(`/messages/${selectedSystemMsg.value.id}?forAll=true`)
    messages.value = messages.value.filter(m => m.id !== selectedSystemMsg.value.id)
  } catch (err) { notifications.error(err.message) }
  closeSystemMsgMenu()
}
function shouldShowDateSeparator(index) {
  if (index === 0) return true
  const current = new Date(messages.value[index].createdAt)
  const prev = new Date(messages.value[index - 1].createdAt)
  return current.toDateString() !== prev.toDateString()
}
function formatRecTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` }
function formatRecTimeMs(s) { const mins = Math.floor(s/60); const secs = s % 60; return `${mins}:${secs.toString().padStart(2,'0')},00` }
function formatLastSeen(lastSeen) { if (!lastSeen) return t('wasOnlineLongAgo'); const d = new Date(lastSeen), now = new Date(), diff = (now - d) / 1000; if (diff < 60) return t('wasOnlineJustNow'); if (diff < 3600) return t('wasOnlineMinAgo').replace('{n}', Math.floor(diff / 60)); if (diff < 86400) return t('wasOnlineHoursAgo').replace('{n}', Math.floor(diff / 3600)); return `${t('wasOnlineDate')} ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}` }
function scrollToBottom() { 
  nextTick(() => { 
    if (messagesContainer.value) {
      isProgrammaticScroll = true
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      setTimeout(() => { isProgrammaticScroll = false }, 100)
    }
  }) 
}

function onChatScroll() {
  if (!messagesContainer.value || !messages.value.length) return
  
  if (isProgrammaticScroll) return
  
  const container = messagesContainer.value
  
  const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
  if (isAtBottom) {
    showFloatingDate.value = false
    return
  }
  
  const containerRect = container.getBoundingClientRect()
  const targetY = containerRect.top + 60
  
  const messageEls = container.querySelectorAll('.message')
  let visibleDate = null
  
  for (let i = 0; i < messageEls.length; i++) {
    const el = messageEls[i]
    const rect = el.getBoundingClientRect()
    
    if (rect.bottom >= targetY) {
      if (messages.value[i]) {
        visibleDate = formatDateSeparator(messages.value[i].createdAt)
      }
      break
    }
  }
  
  if (visibleDate) {
    floatingDateText.value = visibleDate
    showFloatingDate.value = true
  }
  
  clearTimeout(floatingDateHideTimeout)
  lastScrollTime = Date.now()
  
  floatingDateHideTimeout = setTimeout(() => {
    showFloatingDate.value = false
  }, 1500)
}

function toggleVideo(e) { const v = e.target.querySelector('video') || e.target; v.paused ? v.play() : v.pause() }

function toggleCircle(e, msgId) {
  const video = document.getElementById('circle-' + msgId)
  if (!video) return
  if (video.paused) {
    video.play()
    playingCircles.value[msgId] = true
  } else {
    video.pause()
    playingCircles.value[msgId] = false
  }
}

function toggleMute(msgId) {
  const video = document.getElementById('circle-' + msgId)
  if (!video) return
  video.muted = !video.muted
  mutedCircles.value[msgId] = video.muted
}

function getCircleDuration(msgId) {
  return circleDurations.value[msgId] || '0:00'
}

function getCircleCurrentTime(msgId) {
  return circleCurrentTime.value[msgId] || circleDurations.value[msgId] || '0:00'
}

function onCircleLoaded(e, msgId) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  circleDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  circleCurrentTime.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
}

function onCircleTimeUpdate(e, msgId) {
  const video = e.target
  const current = video.currentTime
  const duration = video.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  circleCurrentTime.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  circleProgress.value[msgId] = duration > 0 ? current / duration : 0
}

function onCircleEnded(msgId) {
  playingCircles.value[msgId] = false
  circleProgress.value[msgId] = 0
  const video = document.getElementById('circle-' + msgId)
  if (video) video.currentTime = 0
  if (circleDurations.value[msgId]) {
    circleCurrentTime.value[msgId] = circleDurations.value[msgId]
  }
}

function toggleVoice(e, msgId) {
  const audio = document.getElementById('voice-' + msgId)
  if (!audio) return
  
  Object.keys(playingVoices.value).forEach(id => {
    if (id !== msgId && playingVoices.value[id]) {
      const otherAudio = document.getElementById('voice-' + id)
      if (otherAudio) otherAudio.pause()
      playingVoices.value[id] = false
    }
  })
  
  if (audio.paused) {
    audio.play()
    playingVoices.value[msgId] = true
  } else {
    audio.pause()
    playingVoices.value[msgId] = false
  }
}

function onVoiceEnded(msgId) {
  playingVoices.value[msgId] = false
  voiceProgress.value[msgId] = 0
  if (voiceTotalDurations.value[msgId]) {
    voiceDurations.value[msgId] = voiceTotalDurations.value[msgId]
  }
}

function onVoiceLoaded(e, msgId) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`
  voiceDurations.value[msgId] = formatted
  voiceTotalDurations.value[msgId] = formatted
  voiceProgress.value[msgId] = 0
}

function onVoiceTimeUpdate(e, msgId) {
  const audio = e.target
  const current = audio.currentTime
  const duration = audio.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  voiceDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  voiceProgress.value[msgId] = duration > 0 ? (current / duration) * 100 : 0
}

function getVoiceDuration(msgId) {
  return voiceDurations.value[msgId] || '0:00'
}

function getVoiceProgress(msgId) {
  return voiceProgress.value[msgId] || 0
}

function isWaveBarActive(msgId, barIndex, totalBars) {
  const progress = voiceProgress.value[msgId] || 0
  const barProgress = (barIndex / totalBars) * 100
  return barProgress <= progress
}

function getWaveHeight(i) {
  const heights = [8, 12, 18, 14, 22, 16, 20, 12, 24, 18, 14, 20, 16, 22, 12, 18, 14, 20, 16, 10]
  return heights[(i - 1) % heights.length]
}

function toggleAudio(e, item) {
  if (audioPlayerStore.currentTrack?.url === item.url && audioPlayerStore.isPlaying) {
    audioPlayerStore.pause()
  } else {
    audioPlayerStore.play({
      url: item.url,
      name: item.fileName || t('audioFile'),
      source: chatUser.value?.name || t('message')
    })
  }
}

function isAudioPlaying(url) {
  return audioPlayerStore.currentTrack?.url === url && audioPlayerStore.isPlaying
}

function getAudioProgressGlobal(url) {
  if (audioPlayerStore.currentTrack?.url === url) {
    return audioPlayerStore.progress
  }
  return 0
}

function getAudioTimeGlobal(url) {
  if (audioPlayerStore.currentTrack?.url === url) {
    return audioPlayerStore.formattedCurrentTime
  }
  return '0:00'
}

function seekAudioGlobal(e, url) {
  if (audioPlayerStore.currentTrack?.url !== url) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  audioPlayerStore.seek(percent)
}

function onAudioEnded(msgId) {
  playingAudios.value[msgId] = false
  audioProgress.value[msgId] = 0
  if (audioTotalDurations.value[msgId]) {
    audioDurations.value[msgId] = audioTotalDurations.value[msgId]
  }
}

function onAudioLoaded(e, msgId) {
  const duration = e.target.duration
  const mins = Math.floor(duration / 60)
  const secs = Math.floor(duration % 60)
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`
  audioDurations.value[msgId] = formatted
  audioTotalDurations.value[msgId] = formatted
  audioProgress.value[msgId] = 0
}

function onAudioTimeUpdate(e, msgId) {
  const audio = e.target
  const current = audio.currentTime
  const duration = audio.duration
  const mins = Math.floor(current / 60)
  const secs = Math.floor(current % 60)
  audioDurations.value[msgId] = `${mins}:${secs.toString().padStart(2, '0')}`
  audioProgress.value[msgId] = duration > 0 ? (current / duration) * 100 : 0
}

function seekAudio(e, msgId) {
  const audio = document.getElementById('audio-' + msgId)
  if (!audio) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audio.currentTime = percent * audio.duration
}

function getAudioDuration(msgId) {
  return audioDurations.value[msgId] || '0:00'
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

function downloadFile(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'file'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function insertEmoji(emoji) { const input = msgInput.value; if (input) { const start = input.selectionStart, end = input.selectionEnd; newMessage.value = newMessage.value.substring(0, start) + emoji + newMessage.value.substring(end); nextTick(() => { input.focus(); input.setSelectionRange(start + emoji.length, start + emoji.length) }) } else newMessage.value += emoji }

function handleMessageInput(e) {
  const input = e.target
  const value = input.value
  const cursorPos = input.selectionStart
  
  const textBeforeCursor = value.substring(0, cursorPos)
  const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)
  
  if (atMatch) {
    mentionMode.value = true
    mentionQuery.value = atMatch[1]
    mentionStartPos.value = cursorPos - atMatch[0].length
    mentionIndex.value = 0
    
    clearTimeout(mentionSearchTimeout)
    if (mentionQuery.value.length > 0) {
      mentionSearchTimeout = setTimeout(async () => {
        try {
          const res = await api.get('/users/mention-search', { params: { q: mentionQuery.value } })
          mentionUsers.value = res.data
        } catch { mentionUsers.value = [] }
      }, 150)
    } else {
      mentionUsers.value = []
    }
  } else {
    closeMention()
  }
}

function closeMention() {
  mentionMode.value = false
  mentionQuery.value = ''
  mentionUsers.value = []
  mentionIndex.value = 0
}

function selectMention(user) {
  const input = msgInput.value
  if (!input) return
  
  const before = newMessage.value.substring(0, mentionStartPos.value)
  const after = newMessage.value.substring(input.selectionStart)
  newMessage.value = before + '@' + user.username + ' ' + after
  
  closeMention()
  nextTick(() => {
    input.focus()
    const newPos = mentionStartPos.value + user.username.length + 2
    input.setSelectionRange(newPos, newPos)
  })
}

function handleMentionKeydown(e) {
  if (!mentionMode.value || !mentionUsers.value.length) return
  
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    mentionIndex.value = Math.min(mentionIndex.value + 1, mentionUsers.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mentionIndex.value = Math.max(mentionIndex.value - 1, 0)
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault()
    selectMention(mentionUsers.value[mentionIndex.value])
  } else if (e.key === 'Escape') {
    closeMention()
  }
}

function getMediaType(file) {
  if (file.type === 'image/gif') return 'gif'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'file'
}

function parseMessageMedia(msg) {
  if (msg.mediaType === 'multiple' && msg.media) {
    try {
      const items = JSON.parse(msg.media)
      return { ...msg, mediaItems: items.map((item, i) => ({ ...item, id: msg.id + '-' + i, mediaType: item.type, fileName: item.name, fileSize: item.size })) }
    } catch {
      return msg
    }
  }
  return msg
}

function getVisualMedia(msg) {
  const items = msg.mediaItems || []
  const visualTypes = ['image', 'video', 'gif']
  
  if (items.length > 0) {
    return items.filter(item => visualTypes.includes(item.mediaType))
  }
  
  if (msg.media && visualTypes.includes(msg.mediaType)) {
    return [{ url: msg.media, mediaType: msg.mediaType, id: msg.id }]
  }
  
  return []
}

function getFileMedia(msg) {
  const items = msg.mediaItems || []
  const fileTypes = ['audio', 'file']
  
  if (items.length > 0) {
    return items.filter(item => fileTypes.includes(item.mediaType))
  }
  
  if (msg.media && fileTypes.includes(msg.mediaType)) {
    return [{ url: msg.media, mediaType: msg.mediaType, fileName: msg.fileName, fileSize: msg.fileSize, id: msg.id }]
  }
  
  return []
}

function handleMediaSelect(e) { 
  const files = Array.from(e.target.files)
  if (!files.length) return
  
  files.forEach(file => {
    if (mediaFiles.value.length >= 10) return
    const type = getMediaType(file)
    const preview = (type === 'image' || type === 'gif' || type === 'video') ? URL.createObjectURL(file) : null
    mediaFiles.value.push({ file, preview, type, id: Date.now() + Math.random() })
  })
  e.target.value = ''
}

function handleAttachSelect(e) {
  const fileList = e.target.files
  if (!fileList || !fileList.length) {
    showAttachMenu.value = false
    return
  }
  
  const files = Array.from(fileList)
  
  files.forEach(file => {
    if (mediaFiles.value.length >= 10) return
    const type = getMediaType(file)
    const preview = (type === 'image' || type === 'gif' || type === 'video') ? URL.createObjectURL(file) : null
    mediaFiles.value.push({ file, preview, type, id: Date.now() + Math.random() })
  })
  
  e.target.value = ''
  nextTick(() => {
    showAttachMenu.value = false
  })
}

function formatFileSizeMsg(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

function removeMediaFile(id) {
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

async function startVoice() { 
  try { 
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    function updateLevels() {
      analyser.getByteFrequencyData(dataArray)
      const levels = []
      for (let i = 0; i < 24; i++) {
        const idx = Math.floor(i * dataArray.length / 24)
        const val = dataArray[idx] / 255
        levels.push(Math.max(4, val * 28))
      }
      voiceRecLevels.value = levels
      animationId = requestAnimationFrame(updateLevels)
    }
    updateLevels()
    
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => { 
      if (recordedChunks.length > 0) { 
        const blob = new Blob(recordedChunks, { type: 'audio/webm' })
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' })
        mediaFiles.value = [{ file, preview: null, type: 'voice', id: Date.now() }]
        sendMessage() 
      } 
      stream.getTracks().forEach(t => t.stop())
      recordedChunks = []
      if (animationId) cancelAnimationFrame(animationId)
      if (audioContext) audioContext.close()
      voiceRecLevels.value = Array(24).fill(4)
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000) 
  } catch { 
    notifications.error(t('noMicAccess')) 
  } 
}
function stopVoice() { if (mediaRecorder && mediaRecorder.state !== 'inactive' && isRecording.value) { mediaRecorder.stop(); isRecording.value = false; clearInterval(recordingInterval) } }

let clickPrevented = false

function onVoiceBtnClick() {
  if (clickPrevented) {
    clickPrevented = false
    return
  }
  if (voiceBtnMode.value === 'voice') {
    startVoice()
  } else {
    startCircle()
  }
}

function onRightBtnClick() {
  if (newMessage.value.trim() || mediaFiles.value.length > 0) {
    sendMessage()
  } else {
    onVoiceBtnClick()
  }
}

function onVoiceMouseDown(e) {
  mouseDownOnVoice.value = true
  mouseDragStartY.value = e.clientY
}
function onVoiceMouseMove(e) {
  if (!mouseDownOnVoice.value) return
  const diff = e.clientY - mouseDragStartY.value
  if (diff > 30) {
    voiceBtnMode.value = voiceBtnMode.value === 'voice' ? 'circle' : 'voice'
    mouseDownOnVoice.value = false
    clickPrevented = true
  }
}
function onVoiceMouseUp() {
  mouseDownOnVoice.value = false
}

function onVoiceBtnDown(e) {
  const touch = e.touches[0]
  voiceBtnStartX.value = touch.clientX
  voiceBtnStartY.value = touch.clientY
}
function onVoiceBtnUp() {
  if (voiceBtnStartX.value) {
    if (voiceBtnMode.value === 'voice') {
      startVoice()
    } else {
      startCircle()
    }
  }
  voiceBtnStartX.value = 0
  voiceBtnStartY.value = 0
}
function onVoiceBtnTouchMove(e) {
  if (!voiceBtnStartY.value || !e.touches[0]) return
  const touch = e.touches[0]
  const diffY = voiceBtnStartY.value - touch.clientY
  if (diffY > 30) {
    voiceBtnMode.value = voiceBtnMode.value === 'voice' ? 'circle' : 'voice'
    voiceBtnStartX.value = 0
    voiceBtnStartY.value = 0
  }
}
async function startCircle() { 
  try { 
    circlePaused.value = false
    circleMuted.value = false
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value, width: 480, height: 480 }, audio: true })
    showCircleOverlay.value = true
    await nextTick()
    if (circlePreviewEl.value) circlePreviewEl.value.srcObject = stream
    mediaRecorder = new MediaRecorder(stream)
    recordedChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data) }
    mediaRecorder.onstop = () => { 
      if (recordedChunks.length > 0) { 
        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        const file = new File([blob], 'circle.webm', { type: 'video/webm' })
        mediaFiles.value = [{ file, preview: URL.createObjectURL(blob), type: 'circle', id: Date.now() }]
        sendMessage() 
      } 
      stream.getTracks().forEach(t => t.stop())
      showCircleOverlay.value = false 
    }
    mediaRecorder.start()
    recordingTime.value = 0
    recordingInterval = setInterval(() => recordingTime.value++, 1000) 
  } catch { 
    notifications.error(t('noCameraAccess'))
    showCircleOverlay.value = false 
  } 
}
function stopCircle() { if (mediaRecorder) { mediaRecorder.stop(); clearInterval(recordingInterval) } }
function toggleCirclePause() { if (!mediaRecorder) return; if (circlePaused.value) { mediaRecorder.resume(); recordingInterval = setInterval(() => recordingTime.value++, 1000); circlePaused.value = false } else { mediaRecorder.pause(); clearInterval(recordingInterval); circlePaused.value = true } }
function toggleCircleRecMute() { circleMuted.value = !circleMuted.value; if (stream) { stream.getAudioTracks().forEach(t => t.enabled = !circleMuted.value) } }
async function switchCamera() { facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'; if (stream) { stream.getTracks().forEach(t => t.stop()); try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode.value, width: 480, height: 480 }, audio: !circleMuted.value }); if (circlePreviewEl.value) circlePreviewEl.value.srcObject = stream } catch { notifications.error(t('couldNotSwitchCamera')) } } }
function cancelRecording() { 
  const wasRecording = isRecording.value
  isRecording.value = false
  showCircleOverlay.value = false
  clearInterval(recordingInterval)
  recordedChunks = []
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.ondataavailable = null
    mediaRecorder.onstop = () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (animationId) cancelAnimationFrame(animationId)
      if (audioContext) { audioContext.close(); audioContext = null }
    }
    mediaRecorder.stop()
  } else {
    if (stream) stream.getTracks().forEach(t => t.stop())
    if (animationId) cancelAnimationFrame(animationId)
    if (audioContext) { audioContext.close(); audioContext = null }
  }
  
  clearMedia()
}

async function fetchDialogs() { try { const res = await api.get('/messages/dialogs'); dialogs.value = res.data } catch (err) { console.log('Failed to fetch dialogs:', err) } finally { loading.value = false } }
async function selectDialog(userId) { 
  saveScrollPosition()
  selectedUserId.value = userId
  currentChatUserId.value = userId
  chatLoading.value = true
  messages.value = []
  replyingTo.value = null
  selectMode.value = false
  selectedMessages.value = []
  pinnedMessage.value = null
  try { 
    const [userRes, msgRes] = await Promise.all([api.get(`/users/${userId}`), api.get(`/messages/${userId}`)])
    chatUser.value = userRes.data
    messages.value = msgRes.data.map(parseMessageMedia)
    restoreScrollPosition(userId)
    await api.post(`/messages/${userId}/read`)
    fetchPinnedMessage()
  } catch (err) { notifications.error(err.message) } finally { chatLoading.value = false } 
}
async function pollMessages() { 
  if (!selectedUserId.value) return
  try { 
    const res = await api.get(`/messages/${selectedUserId.value}`)
    const newIds = res.data.map(m => m.id).join(',')
    const oldIds = messages.value.map(m => m.id).join(',')
    
    if (newIds !== oldIds) { 
      const container = messagesContainer.value
      const wasAtBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight < 100)
      
      messages.value = res.data.map(parseMessageMedia)
      
      if (wasAtBottom) {
        isProgrammaticScroll = true
        nextTick(() => { 
          if (container) container.scrollTop = container.scrollHeight
          setTimeout(() => { isProgrammaticScroll = false }, 100)
        })
      }
      
      await api.post(`/messages/${selectedUserId.value}/read`) 
    }
  } catch {} 
}

async function pollPinnedMessage() {
  if (!selectedUserId.value) return
  fetchPinnedMessage()
}

async function sendMessage() { 
  if (!canSend.value || !selectedUserId.value) return
  
  try {
    const formData = new FormData()
    
    if (newMessage.value.trim()) {
      formData.append('content', newMessage.value.trim())
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
    
    if (mediaFiles.value.length === 1 && (mediaFiles.value[0].type === 'voice' || mediaFiles.value[0].type === 'circle')) {
      formData.append('mediaType', mediaFiles.value[0].type)
    }
    
    if (replyingTo.value) {
      formData.append('replyToId', replyingTo.value.id)
    }
    
    if (selectedMusic.value) {
      formData.append('musicTrackId', selectedMusic.value.id)
      formData.append('musicTitle', selectedMusic.value.title)
      formData.append('musicArtist', selectedMusic.value.artist)
      if (selectedMusic.value.artwork) formData.append('musicArtwork', selectedMusic.value.artwork)
    }
    
    const res = await api.post(`/messages/${selectedUserId.value}`, formData)
    messages.value.push(parseMessageMedia(res.data))
    
    newMessage.value = ''
    clearMedia()
    selectedMusic.value = null
    replyingTo.value = null
    scrollToBottom()
    fetchDialogs()
  } catch (err) { 
    notifications.error(err.message) 
  } 
}

function onMusicSelect(track) {
  selectedMusic.value = track
}

function isMsgMusicPlaying(msg) {
  return audioPlayerStore.currentTrack?.id === msg.musicTrackId && audioPlayerStore.isPlaying
}

async function playMsgMusic(msg) {
  if (!msg.musicTrackId) return
  
  if (audioPlayerStore.currentTrack?.id === msg.musicTrackId) {
    if (audioPlayerStore.isPlaying) {
      audioPlayerStore.pause()
    } else {
      audioPlayerStore.resume()
    }
    return
  }
  
  try {
    const res = await api.get(`/music/stream/${msg.musicTrackId}`)
    audioPlayerStore.play({
      id: msg.musicTrackId,
      url: res.data.url,
      name: msg.musicTitle,
      source: msg.musicArtist,
      artwork: msg.musicArtwork
    })
    
    api.post('/music/history', {
      trackId: msg.musicTrackId,
      title: msg.musicTitle,
      artist: msg.musicArtist,
      artwork: msg.musicArtwork
    }).catch(() => {})
  } catch (err) {
    notifications.error(t('couldNotPlayTrack'))
  }
}

async function unblockUser() {
  if (!chatUser.value) return
  try {
    await api.delete(`/users/${chatUser.value.id}/block`)
    chatUser.value.iBlockedUser = false
    notifications.success(t('userUnblocked'))
  } catch (err) { notifications.error(err.message) }
}

function openMsgMenu(e, msg) {
  selectedMsg.value = msg
  const menuWidth = 200
  const menuHeight = msg.senderId === authStore.user?.id ? 280 : 240
  msgMenuX.value = Math.min(Math.max(e.clientX, 10), window.innerWidth - menuWidth - 10)
  msgMenuY.value = Math.min(Math.max(e.clientY, 10), window.innerHeight - menuHeight - 10)
  showMsgMenu.value = true
}
function closeMsgMenu() { showMsgMenu.value = false; selectedMsg.value = null }

function openDialogMenu(e, dialog) {
  selectedDialog.value = dialog
  const menuWidth = 200
  const menuHeight = 180
  dialogMenuX.value = Math.min(Math.max(e.clientX, 10), window.innerWidth - menuWidth - 10)
  dialogMenuY.value = Math.min(Math.max(e.clientY, 10), window.innerHeight - menuHeight - 10)
  showDialogMenu.value = true
}

function closeDialogMenu() {
  showDialogMenu.value = false
  selectedDialog.value = null
}

async function toggleDialogPin() {
  if (!selectedDialog.value) return
  try {
    const res = await api.post(`/messages/dialogs/${selectedDialog.value.user.id}/pin`)
    const idx = dialogs.value.findIndex(d => d.user.id === selectedDialog.value.user.id)
    if (idx !== -1) {
      dialogs.value[idx].isPinned = res.data.isPinned
    }
    fetchDialogs()
  } catch (err) { notifications.error(err.message) }
  closeDialogMenu()
}

async function toggleDialogMute() {
  if (!selectedDialog.value) return
  try {
    const res = await api.post(`/messages/dialogs/${selectedDialog.value.user.id}/mute`)
    const idx = dialogs.value.findIndex(d => d.user.id === selectedDialog.value.user.id)
    if (idx !== -1) {
      dialogs.value[idx].isMuted = res.data.isMuted
    }
  } catch (err) { notifications.error(err.message) }
  closeDialogMenu()
}

function confirmDeleteDialog() {
  showDialogMenu.value = false
  showDeleteDialogModal.value = true
}

function confirmDeleteDialogForAll() {
  showDialogMenu.value = false
  showDeleteDialogForAllModal.value = true
}

async function deleteDialog(forAll = false) {
  if (!selectedDialog.value) return
  try {
    await api.delete(`/messages/dialogs/${selectedDialog.value.user.id}${forAll ? '?forAll=true' : ''}`)
    dialogs.value = dialogs.value.filter(d => d.user.id !== selectedDialog.value.user.id)
    if (selectedUserId.value === selectedDialog.value.user.id) {
      goBack()
    }
    showDeleteDialogModal.value = false
    showDeleteDialogForAllModal.value = false
    selectedDialog.value = null
  } catch (err) { notifications.error(err.message) }
}
function forwardMessage() { showMsgMenu.value = false; bulkForwardMode.value = false; showForwardModal.value = true }
async function doForward(toUserId) { 
  try { 
    if (bulkForwardMode.value && selectedMessages.value.length) {
      for (const msgId of selectedMessages.value) {
        await api.post('/messages/forward', { messageId: msgId, toUserId })
      }
      cancelSelectMode()
      bulkForwardMode.value = false
    } else if (selectedMsg.value) {
      await api.post('/messages/forward', { messageId: selectedMsg.value.id, toUserId })
      selectedMsg.value = null
    }
    showForwardModal.value = false
  } catch (err) { notifications.error(err.message) } 
}
function confirmDeleteForAll() { 
  showMsgMenu.value = false
  if (rememberDeleteForAll.value) { deleteForAll(); return }
  showDeleteForAllModal.value = true 
}
function confirmDeleteForMe() { 
  showMsgMenu.value = false
  if (rememberDeleteForMe.value) { deleteForMe(); return }
  showDeleteForMeModal.value = true 
}
async function deleteForAll() { 
  if (!selectedMsg.value) return
  showDeleteForAllModal.value = false
  try { 
    await api.delete(`/messages/${selectedMsg.value.id}?forAll=true`)
    messages.value = messages.value.filter(m => m.id !== selectedMsg.value.id)
    selectedMsg.value = null
  } catch (err) { notifications.error(err.message) } 
}
async function deleteForMe() { 
  if (!selectedMsg.value) return
  showDeleteForMeModal.value = false
  try { 
    await api.delete(`/messages/${selectedMsg.value.id}`)
    messages.value = messages.value.filter(m => m.id !== selectedMsg.value.id)
    selectedMsg.value = null
  } catch (err) { notifications.error(err.message) } 
}
function openMediaViewer(src, type) { viewerSrc.value = src; viewerType.value = type; showMediaViewerModal.value = true }

function startReply() {
  if (!selectedMsg.value) return
  const msg = selectedMsg.value
  replyingTo.value = {
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderName: msg.senderId === authStore.user?.id ? t('you') : chatUser.value?.name
  }
  showMsgMenu.value = false
  selectedMsg.value = null
  nextTick(() => msgInput.value?.focus())
}

function cancelReply() {
  replyingTo.value = null
}

function startSelectMode() {
  selectMode.value = true
  if (selectedMsg.value) {
    selectedMessages.value = [selectedMsg.value.id]
  }
  showMsgMenu.value = false
  selectedMsg.value = null
}

function cancelSelectMode() {
  selectMode.value = false
  selectedMessages.value = []
}

function toggleMessageSelection(msgId) {
  const idx = selectedMessages.value.indexOf(msgId)
  if (idx === -1) {
    selectedMessages.value.push(msgId)
  } else {
    selectedMessages.value.splice(idx, 1)
  }
}

function bulkForward() {
  if (!selectedMessages.value.length) return
  bulkForwardMode.value = true
  showForwardModal.value = true
}

const canBulkDeleteForAll = computed(() => {
  if (!selectedMessages.value.length) return false
  return selectedMessages.value.every(msgId => {
    const msg = messages.value.find(m => m.id === msgId)
    return msg && msg.senderId === authStore.user?.id
  })
})

async function bulkDeleteForAll() {
  if (!selectedMessages.value.length) return
  try {
    for (const msgId of selectedMessages.value) {
      await api.delete(`/messages/${msgId}?forAll=true`)
    }
    messages.value = messages.value.filter(m => !selectedMessages.value.includes(m.id))
    cancelSelectMode()
  } catch (err) { notifications.error(err.message) }
}

async function bulkDeleteForMe() {
  if (!selectedMessages.value.length) return
  try {
    for (const msgId of selectedMessages.value) {
      await api.delete(`/messages/${msgId}`)
    }
    messages.value = messages.value.filter(m => !selectedMessages.value.includes(m.id))
    cancelSelectMode()
  } catch (err) { notifications.error(err.message) }
}

async function fetchPinnedMessage() {
  if (!selectedUserId.value) return
  try {
    const res = await api.get(`/messages/${selectedUserId.value}/pinned`)
    pinnedMessage.value = res.data
  } catch { pinnedMessage.value = null }
}

async function pinMessage() {
  if (!selectedMsg.value) return
  const msgId = pinnedMessage.value?.id === selectedMsg.value.id ? null : selectedMsg.value.id
  try {
    await api.post(`/messages/${selectedUserId.value}/pin`, { messageId: msgId })
    if (msgId) {
      pinnedMessage.value = {
        ...selectedMsg.value,
        senderName: selectedMsg.value.senderId === authStore.user?.id ? t('you') : chatUser.value?.name
      }
    } else {
      pinnedMessage.value = null
    }
    const res = await api.get(`/messages/${selectedUserId.value}`)
    messages.value = res.data
    scrollToBottom()
  } catch (err) { notifications.error(err.message) }
  showMsgMenu.value = false
  selectedMsg.value = null
}

async function unpinMessage() {
  try {
    await api.post(`/messages/${selectedUserId.value}/pin`, { messageId: null })
    pinnedMessage.value = null
  } catch (err) { notifications.error(err.message) }
}

function scrollToPinned() {
  if (!pinnedMessage.value) return
  scrollToMessage(pinnedMessage.value.id)
}

function scrollToMessage(msgId) {
  const el = document.getElementById('msg-' + msgId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 1500)
  }
}

function handleClickOutside(e) { 
  if (showMsgMenu.value && !e.target.closest('.msg-menu')) closeMsgMenu()
  if (showDialogMenu.value && !e.target.closest('.msg-menu')) closeDialogMenu()
  if (showSystemMsgMenu.value && !e.target.closest('.msg-menu')) closeSystemMsgMenu()
  if (showAttachMenu.value && !e.target.closest('.attach-wrap')) showAttachMenu.value = false
}

function onNewMessage(msg) {
  if (selectedUserId.value === msg.senderId) {
    messages.value.push(parseMessageMedia(msg))
    scrollToBottom()
    api.post(`/messages/${msg.senderId}/read`)
  }
  fetchDialogs()
}

function onMessageRead(data) {
  if (selectedUserId.value === data.by) {
    messages.value.forEach(m => {
      if (m.senderId === authStore.user?.id) {
        m.isRead = 1
      }
    })
  }
}

function onMessagePin(data) {
  if (selectedUserId.value) {
    fetchPinnedMessage()
  }
}

onMounted(async () => { 
  fetchDialogs()
  pollInterval = setInterval(() => { 
    pollMessages()
    fetchDialogs() 
  }, 500)
  if (route.params.id) {
    await selectDialog(route.params.id)
    if (route.query.msg) {
      nextTick(() => scrollToMessage(route.query.msg))
    }
  }
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  
  on('message:new', onNewMessage)
  on('message:read', onMessageRead)
  on('message:pin', onMessagePin)
})

onUnmounted(() => { 
  clearInterval(pollInterval)
  if (stream) stream.getTracks().forEach(t => t.stop())
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  currentChatUserId.value = null
  clearTimeout(floatingDateHideTimeout)
  off('message:new', onNewMessage)
  off('message:read', onMessageRead)
  off('message:pin', onMessagePin)
})
watch(() => route.params.id, id => { if (id) selectDialog(id) })
</script>

<style scoped>
.messages-page { min-height: 100vh; padding: 20px; padding-left: calc(var(--sidebar-width) + 20px); display: flex; justify-content: center; }
.messages-container { display: grid; grid-template-columns: 380px 1fr; gap: 20px; max-width: 1100px; width: 100%; height: calc(100vh - 40px); }
.dialogs-panel, .chat-panel, .chat-empty { display: flex; flex-direction: column; overflow: hidden; }
.dialogs-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; }
.dialogs-header h1 { font-size: 20px; font-weight: 600; }
.dialogs-search-wrap { flex: 1; animation: searchExpand 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes searchExpand { from { opacity: 0; transform: scaleX(0.8); } to { opacity: 1; transform: scaleX(1); } }
.dialogs-search-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.03); border: none; border-radius: var(--radius-full); font-size: 15px; color: var(--text-primary); transition: all 0.2s ease; }
.dialogs-search-input:focus { background: rgba(255,255,255,0.05); outline: none; }
.dialogs-search-input::placeholder { color: var(--text-muted); }
.dialogs-search-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: 50%; transition: all 0.2s ease; flex-shrink: 0; }
.dialogs-search-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
.dialogs-search-btn:active { transform: scale(0.9); }
.dialogs-search-btn svg { width: 20px; height: 20px; transition: transform 0.2s ease; }
.dialogs-list { flex: 1; overflow-y: auto; padding: 8px; }
.loading-state, .empty-state { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-secondary); }
.spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: rgba(255,255,255,0.5); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.dialog-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
.dialog-item:hover, .dialog-item.active { background: rgba(255,255,255,0.04); }
.dialog-item:active { transform: scale(0.98); }
.dialog-item.unread { background: rgba(255,255,255,0.03); }
.dialog-avatar-wrap, .chat-avatar-wrap { position: relative; flex-shrink: 0; }
.online-indicator { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background: #3b82f6; border: 3px solid var(--bg-primary); border-radius: 50%; }
.dialog-content { flex: 1; min-width: 0; }
.dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.dialog-name-wrap { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
.dialog-name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dialog-name-wrap .muted-icon { width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0; }
.dialog-icons { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.dialog-icons .pinned-icon { width: 14px; height: 14px; color: var(--text-muted); }
.dialog-time { font-size: 12px; color: var(--text-muted); }
.dialog-item.pinned { background: rgba(255,255,255,0.02); }
.dialog-bottom { display: flex; align-items: center; gap: 8px; }
.dialog-preview { flex: 1; font-size: 14px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dialog-preview .you { color: var(--text-muted); }
.unread-badge { min-width: 20px; height: 20px; padding: 0 6px; background: #3b82f6; color: white; font-size: 12px; font-weight: 600; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.read-check { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
.chat-empty { align-items: center; justify-content: center; gap: 16px; text-align: center; }
.empty-icon { width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--text-muted); }
.chat-empty h3 { font-size: 20px; font-weight: 600; }
.chat-empty p { color: var(--text-secondary); }
.chat-panel { display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; min-height: 64px; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border-radius: var(--radius-lg); flex-shrink: 0; transition: all 0.2s ease; }
.back-btn:hover { background: rgba(255,255,255,0.04); }
.back-btn:active { transform: scale(0.9); }
.back-btn svg { width: 20px; height: 20px; }
.chat-user { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; flex: 1; min-width: 0; }
.chat-user .avatar { width: 40px; height: 40px; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; font-size: 15px; }
.user-status { font-size: 13px; color: var(--text-muted); }
.chat-search-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: 50%; transition: all 0.2s ease; flex-shrink: 0; margin-left: auto; }
.chat-search-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
.chat-search-btn:active { transform: scale(0.9); }
.chat-search-btn svg { width: 20px; height: 20px; }
.chat-search-header { display: flex; align-items: center; gap: 12px; flex: 1; animation: chatSearchExpand 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes chatSearchExpand { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
.chat-search-input { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.03); border: none; border-radius: var(--radius-full); font-size: 15px; color: var(--text-primary); transition: all 0.2s ease; }
.chat-search-input:focus { background: rgba(255,255,255,0.05); outline: none; }
.chat-search-input::placeholder { color: var(--text-muted); }
.chat-search-nav { display: flex; align-items: center; gap: 4px; }
.search-count { font-size: 13px; color: var(--text-muted); white-space: nowrap; padding: 0 4px; }
.search-no-results { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
.search-nav-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: 50%; transition: all 0.15s ease; }
.search-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: var(--text-primary); }
.search-nav-btn:active:not(:disabled) { transform: scale(0.9); }
.search-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.search-nav-btn svg { width: 18px; height: 18px; }
.chat-search-close { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: 50%; transition: all 0.15s ease; }
.chat-search-close:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
.chat-search-close:active { transform: scale(0.9); }
.chat-search-close svg { width: 18px; height: 18px; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; background: url('/chat-pattern.svg') repeat; background-size: 400px 400px; position: relative; }
.message { display: flex; gap: 8px; max-width: 70%; animation: messageIn 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.message.search-highlight .message-bubble { box-shadow: 0 0 0 2px rgba(255, 200, 0, 0.7); animation: highlightPulse 0.5s ease; }
@keyframes highlightPulse { 0%, 100% { box-shadow: 0 0 0 2px rgba(255, 200, 0, 0.7); } 50% { box-shadow: 0 0 0 4px rgba(255, 200, 0, 0.4); } }
@keyframes messageIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.message.own { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { flex-shrink: 0; align-self: flex-end; }
.msg-avatar .avatar-sm { width: 28px; height: 28px; }
.message-content { display: flex; flex-direction: column; min-width: 0; }
.msg-sender { display: none; }
.message.own .msg-avatar { display: none; }
.message-bubble { display: inline-block; padding: 10px 14px; border-radius: 20px; position: relative; }
.message:not(.own) .message-bubble { background: rgba(38, 38, 38, 0.95); }
.message.own .message-bubble { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.message.own .message-bubble.files-only { background: transparent; padding: 0; }
.message:not(.own) .message-bubble.files-only { background: transparent; padding: 0; }
.forwarded-label { display: block; font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 4px; font-style: italic; }
.forwarded-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.forwarded-text { font-size: 12px; color: rgba(255,255,255,0.5); }
.forwarded-avatar { width: 16px; height: 16px; border-radius: 50%; object-fit: cover; }
.forwarded-name { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500; }
.date-separator { display: flex; justify-content: center; padding: 16px 0; }
.date-separator span { font-size: 13px; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 12px; }
.system-message { display: flex; justify-content: center; padding: 8px 0; }
.system-message.clickable { cursor: pointer; }
.system-message-content.glass-pill {
  display: flex;
  align-items: center;
  gap: 6px; 
  font-size: 13px; 
  color: var(--text-secondary); 
  background: rgba(255, 255, 255, 0.08); 
  backdrop-filter: blur(20px); 
  -webkit-backdrop-filter: blur(20px); 
  border: 1px solid rgba(255, 255, 255, 0.1); 
  padding: 6px 14px; 
  border-radius: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.system-message.clickable .glass-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
}
.system-message.clickable .glass-pill:active {
  transform: scale(0.98);
}
.system-icon { width: 14px; height: 14px; flex-shrink: 0; }
.floating-date { position: sticky; top: 12px; z-index: 10; display: flex; justify-content: center; pointer-events: none; margin-bottom: -40px; }
.floating-date span { font-size: 13px; color: var(--text-muted); background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 12px; }
.floating-date-enter-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.floating-date-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.floating-date-enter-from, .floating-date-leave-to { opacity: 0; }
.message-text-wrap { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 4px 8px; }
.message-bubble.files-only .message-text-wrap { display: none; }
.message-bubble p { display: inline; word-break: break-word; line-height: 1.4; font-size: 15px; }
.message-bubble p :deep(.mention-link) { color: #5b9aff; text-decoration: none; font-weight: 500; }
.message-bubble p :deep(.mention-link:hover) { text-decoration: underline; }
.message.own .message-bubble p :deep(.mention-link) { color: #ffffff; }
.message-time { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,0.5); white-space: nowrap; margin-left: auto; }
.message.own .message-time { color: rgba(255,255,255,0.7); }
.read-status { width: 14px; height: 8px; color: rgba(255,255,255,0.5); }
.message.own .read-status { color: rgba(255,255,255,0.7); }
.message-media { max-width: 100%; max-height: 250px; border-radius: 12px; margin-bottom: 6px; cursor: pointer; display: block; }
.circle-video { width: 180px; height: 180px; border-radius: 50%; overflow: hidden; margin-bottom: 6px; cursor: pointer; }
.circle-player { width: 100%; height: 100%; object-fit: cover; }
.voice-message { width: 180px; height: 36px; margin-bottom: 6px; }

.circle-message { display: flex; flex-direction: column; align-items: flex-end; }
.message:not(.own) .circle-message { align-items: flex-start; }
.circle-video-wrap { position: relative; width: 240px; height: 240px; border-radius: 50%; overflow: hidden; cursor: pointer; border: 2px solid rgba(255,255,255,0.1); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #000; }
.circle-video-wrap.playing { transform: scale(1.4); border-color: transparent; z-index: 10; }
.message.own .circle-video-wrap.playing { transform: scale(1.4) translateX(-15%); }
.message:not(.own) .circle-video-wrap.playing { transform: scale(1.4) translateX(15%); }
.circle-video-wrap .circle-player { width: 100%; height: 100%; object-fit: cover; background: #000; }
.circle-playback-ring { position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); z-index: 5; pointer-events: none; }
.circle-playback-bar { transition: stroke-dashoffset 0.25s linear; }
.circle-overlay-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: opacity 0.2s ease; }
.circle-overlay-icon svg { width: 64px; height: 64px; color: white; }
.circle-mute { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.circle-mute svg { width: 18px; height: 18px; color: white; }
.circle-info { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 6px; padding: 0 4px; }
.circle-timer { font-size: 10px; color: var(--text-secondary); }
.circle-info .message-time { font-size: 10px; color: rgba(255,255,255,0.35); margin-left: 0; }

.voice-message-wrap { display: flex; align-items: center; gap: 10px; background: rgba(30,30,30,0.95); padding: 10px 14px; border-radius: 20px; min-width: 200px; max-width: 280px; }
.message.own .voice-message-wrap { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.voice-play-btn { width: 44px; height: 44px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; transition: transform 0.15s; }
.voice-play-btn:hover { transform: scale(1.05); }
.voice-play-btn:active { transform: scale(0.95); }
.voice-play-btn svg { width: 24px; height: 24px; color: #1a1a1a; }
.voice-play-btn .play-icon { margin-left: -2px; }
.voice-play-btn .pause-icon { margin: 0; }
.voice-wave-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.voice-waveform { display: flex; align-items: center; gap: 2px; height: 28px; }
.wave-bar { width: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; transition: background 0.15s; }
.wave-bar.active { background: rgba(255,255,255,0.9); }
.message.own .wave-bar { background: rgba(255,255,255,0.4); }
.message.own .wave-bar.active { background: rgba(255,255,255,1); }
.voice-bottom { display: flex; justify-content: space-between; align-items: center; }
.voice-duration { font-size: 10px; color: rgba(255,255,255,0.6); }
.message.own .voice-duration { color: rgba(255,255,255,0.8); }
.voice-msg-time { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,0.35); }
.message.own .voice-msg-time { color: rgba(255,255,255,0.5); }
.voice-msg-time .read-status { width: 14px; height: 8px; }

.message.media-message .message-content { background: none; }
.message.media-message { max-width: none; }

.media-preview { position: absolute; bottom: 70px; left: 16px; right: 16px; padding: 12px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-radius: 16px; }
.media-preview img, .media-preview video { max-height: 120px; max-width: 160px; border-radius: 12px; }
.media-preview video.circle { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
.voice-preview { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
.voice-preview svg { width: 24px; height: 24px; }
.clear-media { position: absolute; top: 8px; right: 16px; width: 28px; height: 28px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.clear-media svg { width: 14px; height: 14px; }
.recording-indicator { display: flex; align-items: center; gap: 12px; padding: 16px 20px; color: var(--text-secondary); }
.recording-dot { width: 12px; height: 12px; background: #ff4444; border-radius: 50%; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.cancel-rec { margin-left: auto; color: var(--text-muted); font-size: 14px; }

.select-mode-header { display: flex; align-items: center; gap: 12px; flex: 1; }
.select-cancel-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border-radius: var(--radius-lg); transition: all 0.2s ease; }
.select-cancel-btn:hover { background: rgba(255,255,255,0.04); }
.select-cancel-btn svg { width: 20px; height: 20px; }
.select-count { font-size: 16px; font-weight: 500; flex: 1; }
.select-actions { display: flex; gap: 8px; }
.select-action-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border-radius: var(--radius-lg); transition: all 0.2s ease; }
.select-action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.select-action-btn:disabled { opacity: 0.3; }
.select-action-btn svg { width: 20px; height: 20px; }
.select-action-btn.danger { color: #ff6666; }
.select-action-btn.danger:hover:not(:disabled) { background: rgba(255, 100, 100, 0.1); color: #ff5555; }

.pinned-banner { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid rgba(255, 255, 255, 0.08); cursor: pointer; transition: background 0.2s ease; }
.pinned-banner:hover { background: rgba(255, 255, 255, 0.06); }
.pinned-banner .pin-icon { width: 20px; height: 20px; color: var(--text-secondary); flex-shrink: 0; }
.pinned-content { flex: 1; min-width: 0; }
.pinned-label { display: block; font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.pinned-text { display: block; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.unpin-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius); transition: all 0.2s ease; }
.unpin-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.unpin-btn svg { width: 16px; height: 16px; }

.message-checkbox { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; cursor: pointer; }
.checkbox-inner { width: 22px; height: 22px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.checkbox-inner.checked { background: white; border-color: white; }
.checkbox-inner svg { width: 14px; height: 14px; color: #1a1a1a; }
.message.selected .message-bubble { background: rgba(120, 90, 200, 0.5) !important; }
.message.selected .voice-message-wrap { background: rgba(120, 90, 200, 0.5) !important; }
.message.selected .circle-video-wrap { background: rgba(120, 90, 200, 0.5) !important; }

.reply-in-message { display: flex; flex-direction: column; padding: 6px 10px; margin-bottom: 6px; background: rgba(255,255,255,0.1); border-left: 3px solid rgba(255, 255, 255, 0.5); border-radius: 4px; cursor: pointer; transition: background 0.2s ease; }
.reply-in-message:hover { background: rgba(255,255,255,0.15); }
.reply-sender { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
.reply-text { font-size: 13px; color: rgba(255, 255, 255, 0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.reply-preview { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: rgba(255, 255, 255, 0.06); border-left: 3px solid rgba(255, 255, 255, 0.4); margin: 0 12px; border-radius: 8px; }
.reply-preview-content { flex: 1; min-width: 0; }
.reply-preview-name { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.reply-preview-text { display: block; font-size: 14px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reply-cancel { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius); transition: all 0.2s ease; flex-shrink: 0; }
.reply-cancel:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.reply-cancel svg { width: 16px; height: 16px; }

.message.highlight .message-bubble,
.message.highlight .voice-message-wrap,
.message.highlight .circle-video-wrap { 
  animation: highlightFade 1.5s cubic-bezier(0.4, 0, 0.2, 1); 
}
@keyframes highlightFade { 
  0% { background-color: rgba(128, 128, 128, 0); } 
  15% { background-color: rgba(128, 128, 128, 0.25); } 
  100% { background-color: rgba(128, 128, 128, 0); } 
}
.message.highlight.own .message-bubble {
  animation: highlightFadeOwn 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes highlightFadeOwn {
  0% { filter: brightness(1); }
  15% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
}

.messages-wrapper { display: flex; flex-direction: column; gap: 6px; }
.message-list-enter-active { transition: all 0.2s cubic-bezier(0.2, 0, 0, 1); }
.message-list-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 1, 1); }
.message-list-enter-from { opacity: 0; transform: translateY(12px); }
.message-list-leave-to { opacity: 0; transform: scale(0.95); }
.message-list-move { transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1); }

.voice-rec-left { display: flex; align-items: center; gap: 10px; }
.voice-rec-dot { width: 10px; height: 10px; background: #ff4466; border-radius: 50%; animation: pulse 1s infinite; }
.voice-rec-time { font-size: 15px; color: var(--text-primary); font-variant-numeric: tabular-nums; transition: all 0.1s ease; }
.voice-rec-cancel { flex: 1; text-align: center; color: var(--text-secondary); font-size: 15px; transition: color 0.2s ease; }
.voice-rec-cancel:hover { color: var(--text-primary); }
.voice-rec-cancel:active { transform: scale(0.95); }
.voice-rec-send { width: 44px; height: 44px; background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; transition: all 0.2s ease; }
.voice-rec-send:hover { background: rgba(255,255,255,0.15); transform: scale(1.05); }
.voice-rec-send:active { transform: scale(0.95); }
.voice-rec-send svg { width: 20px; height: 20px; }

.voice-recording-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.circle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.circle-rec-container { position: relative; display: flex; align-items: center; justify-content: center; }
.circle-rec-video-wrap { position: relative; width: 300px; height: 300px; }
.circle-progress-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.circle-progress-bar { transition: stroke-dashoffset 0.3s linear; }
.circle-preview-video { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 280px; height: 280px; border-radius: 50%; object-fit: cover; }
.circle-rec-pause { position: absolute; right: -70px; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; background: rgba(60,60,60,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s ease; }
.circle-rec-pause:hover { background: rgba(80,80,80,1); transform: translateY(-50%) scale(1.05); }
.circle-rec-pause:active { transform: translateY(-50%) scale(0.95); }
.circle-rec-pause svg { width: 20px; height: 20px; }
.circle-rec-controls { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; max-width: 400px; margin-top: 40px; padding: 0 10px; }
.circle-rec-left { display: flex; gap: 12px; }
.circle-rec-btn { width: 44px; height: 44px; background: rgba(60,60,60,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s ease; }
.circle-rec-btn:hover { background: rgba(80,80,80,0.8); transform: scale(1.05); }
.circle-rec-btn:active { transform: scale(0.95); }
.circle-rec-btn.active { background: rgba(255,100,100,0.3); color: #ff6666; }
.circle-rec-btn svg { width: 22px; height: 22px; }
.circle-rec-bottom { display: flex; align-items: center; gap: 10px; }
.circle-rec-dot { width: 10px; height: 10px; background: #ff4466; border-radius: 50%; animation: pulse 1s infinite; }
.circle-rec-time { font-size: 15px; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.circle-rec-cancel { color: var(--text-secondary); font-size: 15px; margin-left: 16px; transition: color 0.2s ease; }
.circle-rec-cancel:hover { color: var(--text-primary); }
.circle-rec-send { width: 56px; height: 56px; background: rgba(60,60,60,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s ease; }
.circle-rec-send:hover { background: rgba(80,80,80,1); transform: scale(1.05); }
.circle-rec-send:active { transform: scale(0.95); }
.circle-rec-send svg { width: 26px; height: 26px; }

.chat-blocked { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; color: var(--text-muted); font-size: 14px; text-align: center; }
.chat-blocked.blocked-by-user { flex-direction: row; justify-content: flex-start; text-align: left; gap: 10px; }
.chat-blocked svg { width: 24px; height: 24px; opacity: 0.4; flex-shrink: 0; }
.chat-blocked span { opacity: 0.7; }
.unblock-btn { 
  margin-top: 4px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.unblock-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
  transform: scale(1.02);
}
.unblock-btn:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.06);
}

.chat-input { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 10px 12px;
  margin: 8px 12px;
  margin-bottom: calc(8px + env(safe-area-inset-bottom));
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 26px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03);
}
.voice-recording-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin: 8px 12px; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid rgba(255,255,255,0.06); border-radius: 26px; }
.input-actions-left, .input-actions-right { display: flex; }
.action-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); border-radius: 50%; transition: all 0.2s; cursor: pointer; background: transparent; border: none; }
.action-btn:hover { color: white; }
.action-btn svg { width: 22px; height: 22px; }
.input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.input-wrap input { width: 100%; border-radius: 18px; padding: 8px 44px 8px 14px; background: transparent; border: none; font-size: 16px; color: white; }
.input-wrap input::placeholder { color: rgba(255,255,255,0.35); }
.input-wrap input:focus { outline: none; }
.input-wrap :deep(.emoji-wrap) { position: absolute; right: 8px; }

.mention-dropdown { position: absolute; bottom: 100%; left: 0; right: 0; margin-bottom: 8px; background: rgba(28, 28, 30, 0.95); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 8px; max-height: 240px; overflow-y: auto; z-index: 100; }
.mention-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: background 0.15s; }
.mention-item:hover, .mention-item.active { background: rgba(255, 255, 255, 0.08); }
.mention-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.mention-info { display: flex; flex-direction: column; gap: 2px; }
.mention-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.mention-username { font-size: 13px; color: var(--text-muted); }
.mention-dropdown-enter-active { animation: mention-in 0.15s ease-out; }
.mention-dropdown-leave-active { animation: mention-in 0.1s ease-in reverse; }
@keyframes mention-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.send-btn { width: 36px; height: 36px; background: transparent; border: none; color: rgba(255,255,255,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.send-btn:hover:not(:disabled) { color: white; transform: scale(1.05); }
.send-btn:disabled { opacity: 0.5; }
.send-btn svg { width: 20px; height: 20px; }
.voice-btn { background: transparent; border: none; color: rgba(255,255,255,0.6); }
.voice-btn:hover { color: white; }

.audio-preview, .file-preview { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
.audio-preview svg, .file-preview svg { width: 24px; height: 24px; flex-shrink: 0; }
.audio-preview span, .file-preview span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.message-gif { cursor: default; }

.audio-message-wrap { display: flex; align-items: center; gap: 12px; background: rgba(30,30,30,0.95); padding: 12px 16px; border-radius: 20px; min-width: 200px; max-width: 280px; cursor: pointer; }
.message.own .audio-message-wrap { background: rgba(30,30,30,0.95); }
.audio-play-btn { width: 44px; height: 44px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; transition: transform 0.15s; }
.audio-play-btn:hover { transform: scale(1.05); }
.audio-play-btn:active { transform: scale(0.95); }
.audio-play-btn svg { width: 24px; height: 24px; color: #1a1a1a; }
.audio-play-btn .play-icon { margin-left: -2px; }
.audio-info { flex: 1; min-width: 0; }
.audio-name { font-size: 15px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.audio-meta { font-size: 13px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.file-msg-time { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,0.5); white-space: nowrap; flex-shrink: 0; margin-left: auto; padding-left: 8px; }
.file-msg-time .read-status { width: 14px; height: 8px; color: rgba(255,255,255,0.5); }

.file-message-wrap { display: flex; align-items: center; gap: 12px; background: rgba(30,30,30,0.95); padding: 12px 14px; border-radius: 20px; min-width: 200px; max-width: 300px; cursor: pointer; transition: background 0.2s ease; }
.file-message-wrap:hover { background: rgba(40,40,40,0.95); }
.message.own .file-message-wrap { background: rgba(30,30,30,0.95); }
.message.own .file-message-wrap:hover { background: rgba(40,40,40,0.95); }
.file-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.file-icon svg { width: 22px; height: 22px; color: rgba(255,255,255,0.7); }
.message.own .file-icon { background: rgba(255,255,255,0.1); }
.message.own .file-icon svg { color: rgba(255,255,255,0.7); }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.message.own .file-name { color: white; }
.message.own .file-size { color: rgba(255,255,255,0.5); }

.msg-menu { position: fixed; z-index: 500; min-width: 180px; padding: 6px; }
.menu-enter-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.menu-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.menu-enter-from { opacity: 0; transform: scale(0.9); }
.menu-leave-to { opacity: 0; transform: scale(0.9); }
.menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; color: var(--text-secondary); border-radius: var(--radius); font-size: 14px; transition: all 0.15s ease; }
.menu-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.menu-item:active { transform: scale(0.98); }
.menu-item.danger { color: #ff6666; }
.menu-item.danger:hover { background: rgba(255,100,100,0.1); }
.menu-item.muted { color: var(--text-secondary); }
.menu-item.muted:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.menu-item svg { width: 18px; height: 18px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.delete-modal { width: 100%; max-width: 400px; padding: 20px 24px; text-align: left; }
.delete-modal h3 { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.delete-modal p { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.4; }
.custom-checkbox { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; cursor: pointer; user-select: none; }
.custom-checkbox input { display: none; }
.checkmark { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0; }
.custom-checkbox input:checked + .checkmark { background: white; border-color: white; }
.checkmark::after { content: ''; width: 6px; height: 10px; border: solid #1a1a1a; border-width: 0 2px 2px 0; transform: rotate(45deg) scale(0); transition: transform 0.15s ease; margin-top: -2px; }
.custom-checkbox input:checked + .checkmark::after { transform: rotate(45deg) scale(1); }
.label-text { font-size: 14px; color: var(--text-secondary); }
.delete-actions { display: flex; gap: 16px; justify-content: flex-end; }
.delete-btn { padding: 8px 0; font-size: 15px; font-weight: 500; transition: all 0.2s ease; background: none; }
.delete-btn.cancel { color: var(--text-muted); }
.delete-btn.cancel:hover { color: var(--text-primary); }
.delete-btn.danger { color: #ff6666; }
.delete-btn.danger:hover { color: #ff5555; }
.delete-btn:not(.cancel):not(.danger) { color: var(--text-secondary); }
.delete-btn:not(.cancel):not(.danger):hover { color: var(--text-primary); }
.delete-btn:active { transform: scale(0.95); }
.close-btn { color: var(--text-muted); padding: 4px; }
.close-btn svg { width: 20px; height: 20px; }
.forward-list { padding: 8px; }
.forward-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-lg); cursor: pointer; }
.forward-item:hover { background: rgba(255,255,255,0.08); }
.forward-item span { font-weight: 500; }
.media-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 300; display: flex; align-items: center; justify-content: center; }
.viewer-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; background: rgba(255,255,255,0.1); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; z-index: 10; }
.viewer-close:hover { background: rgba(255,255,255,0.2); }
.viewer-close svg { width: 24px; height: 24px; }
.viewer-content img, .viewer-content video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.chat-slide-enter-active { transition: opacity 0.2s ease; }
.chat-slide-leave-active { transition: opacity 0.15s ease; }
.chat-slide-enter-from { opacity: 0; }
.chat-slide-leave-to { opacity: 0; }

.dialogs-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.dialogs-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.dialogs-enter-from { opacity: 0; transform: translateX(-30px); }
.dialogs-leave-to { opacity: 0; transform: translateX(-30px); }

.circle-overlay-enter-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.circle-overlay-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.circle-overlay-enter-from { opacity: 0; transform: scale(0.95); }
.circle-overlay-leave-to { opacity: 0; transform: scale(0.95); }

.btn-morph-enter-active, .btn-morph-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.btn-morph-enter-from { opacity: 0; transform: scale(0.8); }
.btn-morph-leave-to { opacity: 0; transform: scale(0.8); }

.icon-flip-enter-active, .icon-flip-leave-active { transition: all 0.12s cubic-bezier(0.4, 0, 0.2, 1); }
.icon-flip-enter-from { opacity: 0; transform: scale(0.6); }
.icon-flip-leave-to { opacity: 0; transform: scale(0.6); }

.btn-swap-enter-active, .btn-swap-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.btn-swap-enter-from { opacity: 0; transform: scale(0.8); }
.btn-swap-leave-to { opacity: 0; transform: scale(0.8); }

.attach-wrap { position: relative; }
.attach-dropdown { 
  position: absolute; 
  bottom: calc(100% + 8px); 
  left: 0; 
  min-width: 180px; 
  padding: 8px; 
  z-index: 100;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
}
.attach-dropdown-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; }
.attach-dropdown-item:hover { background: rgba(255, 255, 255, 0.06); }
.attach-dropdown-item:active { transform: scale(0.98); }
.attach-dropdown-item span { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.attach-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.attach-icon svg { width: 20px; height: 20px; color: white; }
.attach-icon.photo { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.attach-icon.video { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.attach-icon.gif { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.attach-icon.audio { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.attach-icon.file { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.attach-dropdown-enter-active { transition: all 0.15s cubic-bezier(0.2, 0, 0, 1); }
.attach-dropdown-leave-active { transition: all 0.1s cubic-bezier(0.4, 0, 1, 1); }
.attach-dropdown-enter-from { opacity: 0; transform: translateY(8px) scale(0.96); }
.attach-dropdown-leave-to { opacity: 0; transform: translateY(8px) scale(0.96); }

.msg-media-previews { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 12px 8px; padding: 10px 12px; background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; align-items: center; }
.msg-media-preview-item { position: relative; }
.msg-preview-thumb { width: 56px; height: 56px; border-radius: 10px; overflow: hidden; background: rgba(255, 255, 255, 0.06); }
.msg-preview-thumb img, .msg-preview-thumb video { width: 100%; height: 100%; object-fit: cover; }
.msg-preview-icon { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.msg-preview-icon svg { width: 24px; height: 24px; color: white; }
.msg-preview-icon.audio { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.msg-preview-icon.voice { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.msg-preview-icon.file { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.msg-preview-remove-small { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; background: rgba(0, 0, 0, 0.7); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.msg-preview-remove-small:hover { background: rgba(255, 100, 100, 0.9); transform: scale(1.1); }
.msg-preview-remove-small svg { width: 12px; height: 12px; }
.msg-clear-all { font-size: 12px; color: var(--text-muted); padding: 6px 12px; border-radius: 8px; transition: all 0.2s ease; }
.msg-clear-all:hover { background: rgba(255, 255, 255, 0.06); color: var(--text-primary); }

@media (max-width: 900px) {
  .messages-container { grid-template-columns: 1fr; }
  .messages-container .chat-empty { display: none; }
}
@media (max-width: 768px) { 
  .messages-page { padding: 0; padding-bottom: 0; }
  .messages-container { height: 100vh; gap: 0; }
  .messages-container:not(.show-chat) { padding-bottom: 72px; }
  
  .dialogs-panel { 
    background: transparent; 
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .dialogs-header { 
    padding: 20px 16px 16px;
    border-bottom: none;
  }
  
  .dialogs-header h1 { 
    font-size: 28px; 
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  
  .dialogs-search-input {
    padding: 12px 16px;
    font-size: 15px;
    background: rgba(255,255,255,0.03);
  }
  
  .dialogs-search-btn {
    width: 40px;
    height: 40px;
  }
  
  .chat-search-input {
    padding: 12px 16px;
    font-size: 15px;
    background: rgba(255,255,255,0.03);
  }
  
  .chat-search-header {
    flex: 1;
    gap: 8px;
  }
  
  .search-count {
    font-size: 13px;
  }
  
  .search-nav-btn {
    width: 34px;
    height: 34px;
  }
  
  .chat-search-close {
    width: 34px;
    height: 34px;
  }
  
  .dialogs-list { 
    padding: 0 8px; 
  }
  
  .dialog-item { 
    padding: 10px 12px;
    border-radius: 16px;
    gap: 14px;
    margin-bottom: 2px;
  }
  
  .dialog-item:hover,
  .dialog-item.active { 
    background: rgba(255,255,255,0.04); 
  }
  
  .dialog-item:active {
    background: rgba(255,255,255,0.06);
  }
  
  .dialog-item.unread {
    background: rgba(59, 130, 246, 0.08);
  }
  
  .dialog-avatar-wrap .avatar {
    width: 56px;
    height: 56px;
  }
  
  .online-indicator {
    width: 14px;
    height: 14px;
    border-width: 2px;
    background: #22c55e;
  }
  
  .dialog-name { 
    font-size: 16px;
    font-weight: 600;
  }
  
  .dialog-item.unread .dialog-name {
    font-weight: 700;
  }
  
  .dialog-time { 
    font-size: 13px;
  }
  
  .dialog-preview { 
    font-size: 14px;
    color: var(--text-muted);
  }
  
  .read-check {
    color: #3b82f6;
    width: 16px;
    height: 16px;
  }
  
  .messages-container.show-chat {
    padding-bottom: 0;
  }
  
  .chat-panel {
    background: transparent;
    border: none;
    border-radius: 0;
    height: 100vh;
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  
  .app.has-audio-player .chat-panel {
    top: 64px;
    height: calc(100vh - 64px);
  }
  
  .chat-header {
    padding: 10px 12px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    gap: 10px;
    min-height: auto;
  }
  
  .chat-search-header {
    gap: 8px;
  }
  
  .chat-search-input {
    padding: 12px 16px;
    background: rgba(255,255,255,0.03);
    border: none;
    font-size: 15px;
  }
  
  .chat-search-btn {
    width: 38px;
    height: 38px;
  }
  
  .search-nav-btn,
  .chat-search-close {
    width: 34px;
    height: 34px;
  }
  
  .back-btn {
    width: 40px;
    height: 40px;
    margin-left: -4px;
  }
  
  .back-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .chat-user .avatar {
    width: 42px;
    height: 42px;
  }
  
  .chat-avatar-wrap .online-indicator {
    width: 12px;
    height: 12px;
  }
  
  .user-name {
    font-size: 16px;
    font-weight: 600;
  }
  
  .user-status {
    font-size: 13px;
  }
  
  .chat-messages {
    padding: 8px 12px;
    flex: 1;
    -webkit-overflow-scrolling: touch;
  }
  
  .message {
    max-width: 80%;
  }
  
  .message-bubble {
    padding: 10px 14px;
    border-radius: 20px;
  }
  
  .message:not(.own) .message-bubble {
    background: rgba(38, 38, 38, 0.95);
  }
  
  .message.own .message-bubble {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .message-bubble p {
    font-size: 16px;
  }
  
  .message-time {
    font-size: 10px;
  }
  
  .message-media {
    max-width: 240px;
    border-radius: 16px;
  }
  
  .circle-video {
    width: 200px;
    height: 200px;
  }
  
  .msg-avatar {
    display: block;
  }
  
  .msg-avatar .avatar-sm {
    width: 24px;
    height: 24px;
  }
  
  .chat-input {
    padding: 8px 10px;
    margin: 8px;
    margin-bottom: calc(8px + env(safe-area-inset-bottom));
    gap: 6px;
    background: transparent;
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .input-wrap input {
    padding: 10px 14px;
    padding-right: 40px;
    font-size: 16px;
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 18px;
  }
  
  .action-btn {
    width: 34px;
    height: 34px;
  }
  
  .action-btn svg {
    width: 22px;
    height: 22px;
  }
  
  .send-btn {
    width: 34px;
    height: 34px;
  }
  
  .media-preview {
    padding: 10px 12px;
  }
  
  .circle-video-wrap {
    width: 200px;
    height: 200px;
  }
  
  .message.own .circle-video-wrap.playing { transform: scale(1.4) translateX(-20%); }
  .message:not(.own) .circle-video-wrap.playing { transform: scale(1.4) translateX(20%); }
  
  .play-circle {
    width: 48px;
    height: 48px;
  }
  
  .play-circle svg {
    width: 20px;
    height: 20px;
  }
  
  .circle-mute {
    width: 32px;
    height: 32px;
  }
  
  .circle-mute svg {
    width: 16px;
    height: 16px;
  }
  
  .circle-timer,
  .circle-info .message-time {
    font-size: 10px;
  }
  
  .voice-message-wrap {
    min-width: 180px;
    max-width: 260px;
    padding: 8px 12px;
    gap: 8px;
  }
  
  .voice-play-btn {
    width: 40px;
    height: 40px;
  }
  
  .voice-play-btn svg {
    width: 22px;
    height: 22px;
  }
  
  .voice-waveform {
    height: 24px;
  }
  
  .wave-bar {
    width: 2.5px;
  }
  
  .voice-duration,
  .voice-msg-time {
    font-size: 10px;
  }
}

.msg-media-gallery {
  display: grid;
  gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 6px;
}
.msg-media-gallery.media-count-1 { grid-template-columns: 1fr; }
.msg-media-gallery.media-count-2 { grid-template-columns: 1fr 1fr; }
.msg-media-gallery.media-count-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.msg-media-gallery.media-count-3 .msg-gallery-item:first-child { grid-row: span 2; }
.msg-media-gallery.media-count-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.msg-gallery-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
}
.msg-media-gallery.media-count-1 .msg-gallery-item { aspect-ratio: auto; max-height: 300px; }
.msg-media-gallery.media-count-2 .msg-gallery-item { aspect-ratio: 4/3; }
.msg-gallery-item img,
.msg-gallery-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.msg-gallery-item video { cursor: default; }
.msg-gallery-file {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}
.msg-gallery-file svg {
  width: 28px;
  height: 28px;
  color: rgba(255, 255, 255, 0.6);
}
.msg-gallery-more {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: white;
}

.msg-files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}
.msg-files-list .audio-message-wrap,
.msg-files-list .file-message-wrap {
  margin: 0;
}

.msg-music-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.msg-music-artwork {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.msg-music-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.msg-music-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.msg-music-placeholder svg {
  width: 22px;
  height: 22px;
  color: var(--text-muted);
}
.msg-music-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg-music-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-music-artist {
  font-size: 12px;
  color: var(--text-muted);
}
.msg-music-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 8px;
  flex-shrink: 0;
}
.msg-music-remove:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}
.msg-music-remove svg {
  width: 16px;
  height: 16px;
}

.msg-music-track {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.msg-music-track:hover {
  background: rgba(255, 255, 255, 0.08);
}
.msg-music-track-artwork {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.msg-music-track-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.msg-music-track-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.msg-music-track-placeholder svg {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
}
.msg-music-track-play {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.msg-music-track:hover .msg-music-track-play,
.msg-music-track-play.playing {
  opacity: 1;
}
.msg-music-track-play svg {
  width: 18px;
  height: 18px;
  color: white;
}
.msg-music-track-play .play-icon {
  margin-left: -1px;
}
.msg-music-track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg-music-track-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.msg-music-track-artist {
  font-size: 12px;
  color: var(--text-muted);
}

.attach-icon.music {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
}

@media (hover: none) and (pointer: coarse) {
  .dialog-item:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.08);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .voice-play-btn:active,
  .audio-play-btn:active {
    transform: scale(0.9);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .chat-back:active,
  .chat-action:active,
  .attach-btn:active,
  .send-btn:active,
  .emoji-btn:active {
    transform: scale(0.88);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .message-bubble:active {
    transform: scale(0.98);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .attach-option:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .file-message-wrap:active,
  .audio-message-wrap:active {
    transform: scale(0.97);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}

[data-theme="light"] .context-menu {
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="light"] .context-menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .forward-modal {
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="light"] .forward-user:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .media-viewer-overlay {
  background: rgba(0, 0, 0, 0.9);
}

[data-theme="light"] .msg-menu {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .dialogs-panel {
  background: rgba(255, 255, 255, 0.85);
}

[data-theme="light"] .dialog-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .dialog-item.active {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .chat-panel {
  background: rgba(255, 255, 255, 0.85);
}

[data-theme="light"] .chat-empty {
  background: rgba(255, 255, 255, 0.85);
}

[data-theme="light"] .chat-header {
  border-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .chat-input {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .chat-input input {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .message:not(.own) .message-bubble {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

[data-theme="light"] .message.own .message-bubble {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
}

[data-theme="light"] .pinned-banner {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .reply-preview {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .reply-in-message {
  background: rgba(0, 0, 0, 0.06);
  border-left-color: rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .message.own .reply-in-message {
  background: rgba(255, 255, 255, 0.15);
  border-left-color: rgba(255, 255, 255, 0.4);
}

[data-theme="light"] .voice-message-wrap {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .message.own .voice-message-wrap {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
}

[data-theme="light"] .circle-video-wrap {
  border-color: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .attach-dropdown {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .attach-dropdown-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .date-separator span {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-muted);
}

[data-theme="light"] .floating-date span {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-secondary);
}

[data-theme="light"] .system-message-content.glass-pill {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
  color: var(--text-secondary);
}

[data-theme="light"] .system-message.clickable .glass-pill:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .chat-search-input {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .chat-search-input:focus {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .select-mode-header {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .message.selected .message-bubble {
  background: rgba(99, 102, 241, 0.15);
}

[data-theme="light"] .message.own.selected .message-bubble {
  filter: brightness(1.1);
}

[data-theme="light"] .msg-media-previews {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .msg-music-preview {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .voice-recording-bar {
  background: rgba(255, 255, 255, 0.95);
}

[data-theme="light"] .file-message-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .message.own .file-message-wrap {
  background: rgba(255, 255, 255, 0.15);
}

[data-theme="light"] .audio-message-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .message.own .audio-message-wrap {
  background: rgba(255, 255, 255, 0.15);
}

[data-theme="light"] .message-time {
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .message.own .message-time {
  color: rgba(255, 255, 255, 0.7);
}

[data-theme="light"] .read-status {
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .message.own .read-status {
  color: rgba(255, 255, 255, 0.7);
}

[data-theme="light"] .dialogs-search-input {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .back-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .chat-search-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .action-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .emoji-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .send-btn {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .send-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .message.highlight .message-bubble,
[data-theme="light"] .message.highlight .voice-message-wrap,
[data-theme="light"] .message.highlight .circle-video-wrap {
  animation: highlightFadeLight 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes highlightFadeLight {
  0% { background-color: rgba(99, 102, 241, 0); }
  15% { background-color: rgba(99, 102, 241, 0.15); }
  100% { background-color: rgba(99, 102, 241, 0); }
}
</style>
