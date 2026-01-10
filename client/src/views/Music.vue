<template>
  <div class="music-page">
    <div class="music-header">
      <h1 class="page-title">{{ t('music') }}</h1>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
        </svg>
        <input v-model="searchQuery" @input="handleSearch" :placeholder="t('search')">
      </div>
    </div>

    <div class="music-tabs">
      <button class="tab" :class="{ active: tab === 'all' }" @click="switchTab('all')">{{ t('allTracks') }}</button>
      <button class="tab" :class="{ active: tab === 'library' }" @click="switchTab('library')">{{ t('myMusic') }}</button>
      <button class="tab" :class="{ active: tab === 'history' }" @click="switchTab('history')">{{ t('history') }}</button>
    </div>

    <div class="music-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else-if="!tracks.length" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        <p>{{ emptyMessage }}</p>
      </div>

      <div v-else class="tracks-list">
        <div 
          v-for="track in tracks" 
          :key="track.id" 
          class="track-item"
          :class="{ playing: isPlaying(track) }"
        >
          <div class="track-artwork" @click="playTrack(track)">
            <img v-if="track.artwork" :src="track.artwork" alt="">
            <div v-else class="artwork-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            <div class="play-overlay">
              <svg v-if="isPlaying(track)" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          
          <div class="track-info" @click="playTrack(track)">
            <span class="track-title">{{ track.title }}</span>
            <span class="track-artist">{{ track.artist }}</span>
          </div>
          
          <span class="track-duration">{{ formatDuration(track.duration) }}</span>
          
          <button class="track-action" @click="toggleLibrary(track)" :title="isInLibrary(track) ? t('removeFromLibrary') : t('addToLibrary')">
            <svg v-if="isInLibrary(track)" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { useI18n } from '../i18n'
import api from '../api'

const { t } = useI18n()
const audioStore = useAudioPlayerStore()

const tab = ref('all')
const searchQuery = ref('')
const tracks = ref([])
const library = ref([])
const loading = ref(false)
let searchTimeout = null

const emptyMessage = computed(() => {
  if (searchQuery.value) return t('noSearchResults')
  if (tab.value === 'library') return t('libraryEmpty')
  if (tab.value === 'history') return t('historyEmpty')
  return t('noTracks')
})

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function isPlaying(track) {
  return audioStore.currentTrack?.id === track.id && audioStore.isPlaying
}

function isInLibrary(track) {
  return library.value.some(t => t.trackId === track.id || t.id === track.id)
}

async function loadTracks() {
  loading.value = true
  try {
    const res = await api.get('/music/trending', { params: { limit: 50 } })
    tracks.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadLibrary() {
  loading.value = true
  try {
    const res = await api.get('/music/library')
    library.value = res.data
    tracks.value = res.data.map(t => ({
      id: t.trackId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork,
      duration: t.duration
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const res = await api.get('/music/history')
    tracks.value = res.data.map(t => ({
      id: t.trackId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork,
      duration: t.duration
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchLibrary() {
  try {
    const res = await api.get('/music/library')
    library.value = res.data
  } catch (err) {
    console.error(err)
  }
}

function switchTab(newTab) {
  tab.value = newTab
  searchQuery.value = ''
  if (newTab === 'all') loadTracks()
  else if (newTab === 'library') loadLibrary()
  else if (newTab === 'history') loadHistory()
}

function handleSearch() {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    if (tab.value === 'all') loadTracks()
    else if (tab.value === 'library') loadLibrary()
    else if (tab.value === 'history') loadHistory()
    return
  }
  loading.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await api.get('/music/search', { params: { q: searchQuery.value, limit: 50 } })
      tracks.value = res.data
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }, 300)
}

async function playTrack(track) {
  if (audioStore.currentTrack?.id === track.id && audioStore.isPlaying) {
    audioStore.pause()
    return
  }
  
  try {
    const res = await api.get(`/music/stream/${track.id}`)
    audioStore.play({
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
    console.error(err)
  }
}

async function toggleLibrary(track) {
  const trackId = track.id
  if (isInLibrary(track)) {
    try {
      await api.delete(`/music/library/${trackId}`)
      library.value = library.value.filter(t => t.trackId !== trackId && t.id !== trackId)
      if (tab.value === 'library') {
        tracks.value = tracks.value.filter(t => t.id !== trackId)
      }
    } catch (err) {
      console.error(err)
    }
  } else {
    try {
      await api.post('/music/library', {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration
      })
      library.value.push({ trackId: track.id, ...track })
    } catch (err) {
      console.error(err)
    }
  }
}

onMounted(() => {
  loadTracks()
  fetchLibrary()
})
</script>


<style scoped>
.music-page {
  min-height: 100vh;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.music-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 8px 0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 200px;
  transition: all 0.2s;
}

.search-box:focus-within {
  background: rgba(255, 255, 255, 0.15);
}

.search-box svg {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

.search-box input:focus {
  outline: none;
}

.search-wrap {
  display: none;
}

.search-wrap input::placeholder {
  color: var(--text-muted);
}

.search-wrap input:focus {
  outline: none;
}

.music-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab {
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-muted);
  border-radius: 20px;
  transition: all 0.15s;
}

.tab:hover {
  color: var(--text-secondary);
}

.tab.active {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.music-content {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 16px;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tracks-list {
  padding: 8px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  transition: background 0.1s;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.track-item.playing {
  background: rgba(255, 255, 255, 0.06);
}

.track-artwork {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.track-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-placeholder svg {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;
}

.track-item:hover .play-overlay,
.track-item.playing .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 22px;
  height: 22px;
  color: white;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: pointer;
}

.track-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-duration {
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 8px;
}

.track-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 50%;
  transition: all 0.15s;
  flex-shrink: 0;
}

.track-action:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

.track-action svg {
  width: 18px;
  height: 18px;
}

.track-action svg[fill="currentColor"] {
  color: #ef4444;
}

@media (max-width: 768px) {
  .music-page {
    padding: 16px;
    padding-bottom: 80px;
  }
  
  .music-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .music-tabs {
    overflow-x: auto;
    padding-bottom: 4px;
  }
  
  .tab {
    white-space: nowrap;
  }
  
  .track-duration {
    display: none;
  }
}

[data-theme="light"] .search-box {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .search-box:focus-within {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .search-wrap {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .tab.active {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .music-content {
  background: rgba(0, 0, 0, 0.02);
}

[data-theme="light"] .track-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .track-item.playing {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .artwork-placeholder {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .track-action:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>
