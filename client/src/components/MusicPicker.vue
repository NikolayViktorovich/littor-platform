<template>
  <div class="music-picker-overlay" @click.self="$emit('close')">
    <div class="music-picker glass-modal">
      <div class="picker-header">
        <h2>{{ t('selectMusic') }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="picker-tabs">
        <button class="picker-tab" :class="{ active: tab === 'search' }" @click="tab = 'search'">{{ t('search') }}</button>
        <button class="picker-tab" :class="{ active: tab === 'trending' }" @click="tab = 'trending'; loadTrending()">{{ t('trending') }}</button>
        <button class="picker-tab" :class="{ active: tab === 'library' }" @click="tab = 'library'; loadLibrary()">{{ t('myMusic') }}</button>
      </div>

      <div v-if="tab === 'search'" class="search-section">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
          <input v-model="searchQuery" @input="handleSearch" :placeholder="t('searchTracks')" ref="searchInput">
        </div>
      </div>

      <div class="tracks-list">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="!tracks.length" class="empty-state">
          <p>{{ tab === 'search' ? t('enterSearchQuery2') : t('noTracks') }}</p>
        </div>

        <div v-else class="tracks-scroll">
          <div 
            v-for="track in tracks" 
            :key="track.id" 
            class="track-item"
            :class="{ playing: currentPlaying === track.id }"
            @click="selectTrack(track)"
          >
            <div class="track-artwork" @click.stop="togglePreview(track)">
              <img v-if="track.artwork" :src="track.artwork" alt="">
              <div v-else class="artwork-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <div class="play-overlay">
                <svg v-if="currentPlaying === track.id" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div class="track-info">
              <span class="track-title">{{ track.title }}</span>
              <span class="track-artist">{{ track.artist }}</span>
            </div>
            <span class="track-duration">{{ formatDuration(track.duration) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAudioPlayerStore } from '../stores/audioPlayer'
import { useI18n } from '../i18n'
import api from '../api'

const { t } = useI18n()
const emit = defineEmits(['close', 'select'])
const audioStore = useAudioPlayerStore()

const tab = ref('search')
const searchQuery = ref('')
const tracks = ref([])
const loading = ref(false)
const searchInput = ref(null)
let searchTimeout = null

const currentPlaying = computed(() => {
  if (!audioStore.currentTrack?.id) return null
  return audioStore.isPlaying ? audioStore.currentTrack.id : null
})

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleSearch() {
  clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    tracks.value = []
    return
  }
  loading.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await api.get('/music/search', { params: { q: searchQuery.value } })
      tracks.value = res.data
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }, 300)
}

async function loadTrending() {
  loading.value = true
  try {
    const res = await api.get('/music/trending')
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

async function togglePreview(track) {
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
  } catch (err) {
    console.error(err)
  }
}

function selectTrack(track) {
  emit('select', {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    duration: track.duration
  })
  emit('close')
}

onMounted(() => {
  searchInput.value?.focus()
})
</script>

<style scoped>
.music-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.music-picker {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.picker-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.picker-tabs {
  display: flex;
  padding: 12px 24px;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.picker-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
}

.picker-tab:hover {
  color: var(--text-secondary);
}

.picker-tab.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.search-section {
  padding: 16px 24px;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
}

.search-input-wrap svg {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input-wrap input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
}

.search-input-wrap input::placeholder {
  color: var(--text-muted);
}

.search-input-wrap input:focus {
  outline: none;
}

.tracks-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tracks-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
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

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.15s ease;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.track-item.playing {
  background: rgba(255, 255, 255, 0.06);
}

.track-artwork {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
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
  transition: opacity 0.15s ease;
}

.track-item:hover .play-overlay,
.track-item.playing .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 20px;
  height: 20px;
  color: white;
}

.track-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}

@media (max-width: 768px) {
  .music-picker {
    max-height: 90vh;
  }
}
</style>
