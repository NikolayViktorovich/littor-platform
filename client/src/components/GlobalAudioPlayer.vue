<template>
  <Teleport to="body">
    <Transition name="bar-slide">
      <div v-if="isMobile && audioStore.currentTrack" class="mobile-bar" @click="showModal = true">
        <button class="bar-play" @click.stop="audioStore.toggle">
          <svg v-if="!audioStore.isPlaying" class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
        </button>
        <div class="bar-info">
          <span class="bar-name">{{ audioStore.currentTrack.name }}</span>
          <span class="bar-artist">{{ audioStore.currentTrack.source }}</span>
        </div>
        <button class="bar-close" @click.stop="audioStore.close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </Transition>

    <Transition name="modal-slide">
      <div v-if="isMobile && audioStore.currentTrack && showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-sheet" @click.stop @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" :style="{ transform: `translateY(${dragY}px)` }">
          <div class="modal-handle"></div>
          
          <div class="modal-artwork">
            <img v-if="audioStore.currentTrack.artwork" :src="audioStore.currentTrack.artwork" alt="">
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
          </div>
          
          <div class="modal-info">
            <div class="modal-name">{{ audioStore.currentTrack.name }}</div>
            <div class="modal-artist">{{ audioStore.currentTrack.source }}</div>
          </div>

          <div class="modal-progress" @click="onModalProgressClick">
            <div class="modal-progress-track">
              <div class="modal-progress-fill" :style="{ width: audioStore.progress + '%' }"></div>
              <div class="modal-progress-thumb" :style="{ left: audioStore.progress + '%' }"></div>
            </div>
            <div class="modal-times">
              <span>{{ audioStore.formattedCurrentTime }}</span>
              <span>{{ audioStore.formattedDuration }}</span>
            </div>
          </div>

          <div class="modal-controls">
            <button class="modal-ctrl" @click="skipBack">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
            </button>
            <button class="modal-play" @click="audioStore.toggle">
              <svg v-if="!audioStore.isPlaying" class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
            </button>
            <button class="modal-ctrl" @click="skipForward">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="player-slide">
      <div v-if="!isMobile && audioStore.currentTrack" class="desktop-player glass">
        <Transition name="player-resize" mode="out-in">
          <div v-if="audioStore.isMinimized" key="mini" class="player-mini" @click="audioStore.maximize">
          <button class="mini-play" @click.stop="audioStore.toggle">
            <svg v-if="!audioStore.isPlaying" class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
          </button>
          <div class="mini-info">
            <span class="mini-name">{{ audioStore.currentTrack.name }}</span>
            <div class="mini-progress"><div class="mini-bar" :style="{ width: audioStore.progress + '%' }"></div></div>
          </div>
          <button class="mini-close" @click.stop="audioStore.close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          </div>

          <div v-else key="full" class="player-full">
          <div class="full-header">
            <span class="full-title">Сейчас играет</span>
            <div class="full-actions">
              <button @click="audioStore.minimize" class="full-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg></button>
              <button @click="audioStore.close" class="full-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
          </div>
          <div class="full-content">
            <div class="full-artwork">
              <img v-if="audioStore.currentTrack.artwork" :src="audioStore.currentTrack.artwork" alt="">
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
            </div>
            <div class="full-info">
              <div class="full-name">{{ audioStore.currentTrack.name }}</div>
              <div class="full-artist">{{ audioStore.currentTrack.source }}</div>
            </div>
          </div>
          <div class="full-progress" @mousedown="onProgressMouseDown" ref="progressRef">
            <div class="progress-track"><div class="progress-fill" :style="{ width: audioStore.progress + '%' }"></div><div class="progress-thumb" :style="{ left: audioStore.progress + '%' }"></div></div>
            <div class="progress-times"><span>{{ audioStore.formattedCurrentTime }}</span><span>{{ audioStore.formattedDuration }}</span></div>
          </div>
          <div class="full-controls">
            <button class="ctrl-btn" @click="skipBack"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg></button>
            <button class="ctrl-play" @click="audioStore.toggle">
              <svg v-if="!audioStore.isPlaying" class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72c0 .94 1.02 1.52 1.83 1.04l11.09-6.86c.78-.48.78-1.6 0-2.08L9.83 4.1C9.02 3.62 8 4.2 8 5.14z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M6 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z"/></svg>
            </button>
            <button class="ctrl-btn" @click="skipForward"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg></button>
          </div>
          <div class="full-volume">
            <button class="vol-btn" @click="audioStore.toggleMute">
              <svg v-if="audioStore.isMuted || audioStore.volume === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            </button>
            <div class="vol-track" @mousedown="onVolumeMouseDown" ref="volumeRef">
              <div class="vol-fill" :style="{ width: (audioStore.isMuted ? 0 : audioStore.volume * 100) + '%' }"></div>
              <div class="vol-thumb" :style="{ left: (audioStore.isMuted ? 0 : audioStore.volume * 100) + '%' }"></div>
            </div>
          </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioPlayerStore } from '../stores/audioPlayer'

const audioStore = useAudioPlayerStore()
const progressRef = ref(null)
const volumeRef = ref(null)
const isMobile = ref(window.innerWidth <= 768)
const showModal = ref(false)
const dragY = ref(0)
const startY = ref(0)
const isDragging = ref(false)

function handleResize() { isMobile.value = window.innerWidth <= 768 }

function onTouchStart(e) {
  startY.value = e.touches[0].clientY
  isDragging.value = true
}
function onTouchMove(e) {
  if (!isDragging.value) return
  const diff = e.touches[0].clientY - startY.value
  if (diff > 0) dragY.value = diff
}
function onTouchEnd() {
  isDragging.value = false
  if (dragY.value > 100) showModal.value = false
  dragY.value = 0
}

function onModalProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  audioStore.seek(Math.max(0, Math.min(100, percent)))
}

function updateProgress(e) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  audioStore.seek(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
}
function onProgressMouseDown(e) {
  updateProgress(e)
  document.addEventListener('mousemove', updateProgress)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', updateProgress)
  }, { once: true })
}

function updateVolume(e) {
  if (!volumeRef.value) return
  const rect = volumeRef.value.getBoundingClientRect()
  audioStore.setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
}
function onVolumeMouseDown(e) {
  updateVolume(e)
  document.addEventListener('mousemove', updateVolume)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', updateVolume)
  }, { once: true })
}

function skipBack() { audioStore.seekTo(Math.max(0, audioStore.currentTime - 10)) }
function skipForward() { audioStore.seekTo(Math.min(audioStore.duration, audioStore.currentTime + 10)) }

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.mobile-bar {
  position: fixed;
  top: 8px;
  left: 12px;
  right: 12px;
  z-index: 9999;
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02) 100%);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}
.bar-play {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bar-play svg { width: 20px; height: 20px; color: rgba(255,255,255,0.9); }
.bar-info { flex: 1; min-width: 0; text-align: center; }
.bar-name { font-size: 13px; font-weight: 600; color: white; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-artist { font-size: 11px; color: rgba(255,255,255,0.5); display: block; }
.bar-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); flex-shrink: 0; }
.bar-close svg { width: 18px; height: 18px; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
}
.modal-sheet {
  width: 100%;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  border-bottom: none;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
  padding: 12px 24px 40px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
  will-change: transform;
}
.modal-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto 24px; }
.modal-artwork { width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.modal-artwork img { width: 100%; height: 100%; object-fit: cover; }
.modal-artwork svg { width: 40px; height: 40px; color: rgba(255,255,255,0.5); }
.modal-info { text-align: center; margin-bottom: 24px; }
.modal-name { font-size: 18px; font-weight: 600; color: white; margin-bottom: 4px; }
.modal-artist { font-size: 14px; color: rgba(255,255,255,0.5); }
.modal-progress { margin-bottom: 24px; }
.modal-progress-track { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; position: relative; }
.modal-progress-fill { height: 100%; background: white; border-radius: 2px; }
.modal-progress-thumb { position: absolute; top: 50%; left: 0; transform: translate(-50%, -50%); width: 14px; height: 14px; background: white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.modal-times { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.5); }
.modal-controls { display: flex; align-items: center; justify-content: center; gap: 32px; }
.modal-ctrl { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: white; }
.modal-ctrl svg { width: 32px; height: 32px; }
.modal-play { width: 72px; height: 72px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.modal-play svg { width: 32px; height: 32px; color: #1a1a1a; }

.desktop-player { position: fixed; bottom: 20px; right: 20px; z-index: 9999; border-radius: 24px; overflow: hidden; will-change: transform, opacity; }
.player-mini { display: flex; align-items: center; gap: 12px; padding: 10px 14px; cursor: pointer; min-width: 200px; max-width: 300px; }
.mini-play { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mini-play svg { width: 16px; height: 16px; color: white; }
.mini-info { flex: 1; min-width: 0; }
.mini-name { font-size: 13px; font-weight: 500; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; margin-bottom: 4px; }
.mini-progress { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; }
.mini-bar { height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; }
.mini-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); flex-shrink: 0; }
.mini-close:hover { color: white; }
.mini-close svg { width: 16px; height: 16px; }

.player-full { width: 320px; padding: 16px; }
.full-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.full-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.4); }
.full-actions { display: flex; gap: 4px; }
.full-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); border-radius: 8px; }
.full-btn:hover { color: white; background: rgba(255,255,255,0.1); }
.full-btn svg { width: 18px; height: 18px; }
.full-content { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.full-artwork { width: 56px; height: 56px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.full-artwork img { width: 100%; height: 100%; object-fit: cover; }
.full-artwork svg { width: 28px; height: 28px; color: rgba(255,255,255,0.4); }
.full-info { flex: 1; min-width: 0; }
.full-name { font-size: 15px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.full-artist { font-size: 13px; color: rgba(255,255,255,0.5); }
.full-progress { margin-bottom: 16px; cursor: pointer; user-select: none; }
.progress-track { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; position: relative; }
.progress-fill { height: 100%; background: rgba(255,255,255,0.9); border-radius: 2px; }
.progress-thumb { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: white; border-radius: 50%; opacity: 0; transition: opacity 0.1s; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
.full-progress:hover .progress-thumb { opacity: 1; }
.progress-times { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: rgba(255,255,255,0.4); }
.full-controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px; }
.ctrl-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; border-radius: 50%; }
.ctrl-btn:hover { background: rgba(255,255,255,0.1); }
.ctrl-btn svg { width: 20px; height: 20px; }
.ctrl-play { width: 52px; height: 52px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1); }
.ctrl-play:hover { background: rgba(255,255,255,0.15); transform: scale(1.05); }
.ctrl-play svg { width: 24px; height: 24px; color: white; }
.full-volume { display: flex; align-items: center; gap: 10px; }
.vol-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); }
.vol-btn:hover { color: white; }
.vol-btn svg { width: 18px; height: 18px; }
.vol-track { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; cursor: pointer; position: relative; }
.vol-fill { height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; }
.vol-thumb { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: white; border-radius: 50%; opacity: 0; transition: opacity 0.1s; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
.full-volume:hover .vol-thumb { opacity: 1; }

.glass {
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
}

.bar-slide-enter-active { transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), opacity 0.12s cubic-bezier(0.2, 0, 0, 1); }
.bar-slide-leave-active { transition: transform 0.1s cubic-bezier(0.4, 0, 1, 1), opacity 0.1s cubic-bezier(0.4, 0, 1, 1); }
.bar-slide-enter-from, .bar-slide-leave-to { transform: translateY(-100%); opacity: 0; }
.modal-slide-enter-active { transition: opacity 0.12s cubic-bezier(0.2, 0, 0, 1); }
.modal-slide-leave-active { transition: opacity 0.1s cubic-bezier(0.4, 0, 1, 1); }
.modal-slide-enter-active .modal-sheet { transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1); }
.modal-slide-leave-active .modal-sheet { transition: transform 0.1s cubic-bezier(0.4, 0, 1, 1); }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; }
.modal-slide-enter-from .modal-sheet, .modal-slide-leave-to .modal-sheet { transform: translateY(100%); }
.player-slide-enter-active { transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), opacity 0.12s cubic-bezier(0.2, 0, 0, 1); }
.player-slide-leave-active { transition: transform 0.1s cubic-bezier(0.4, 0, 1, 1), opacity 0.1s cubic-bezier(0.4, 0, 1, 1); }
.player-slide-enter-from, .player-slide-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }

.player-resize-enter-active, .player-resize-leave-active { transition: opacity 0.1s cubic-bezier(0.2, 0, 0, 1), transform 0.1s cubic-bezier(0.2, 0, 0, 1); }
.player-resize-enter-from { opacity: 0; transform: scale(0.95); }
.player-resize-leave-to { opacity: 0; transform: scale(0.95); }

.icon-play { margin-left: -1px; }

@media (hover: none) and (pointer: coarse) {
  .bar-play:active,
  .bar-close:active {
    transform: scale(0.85);
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .modal-play:active {
    transform: scale(0.9);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .modal-ctrl:active {
    transform: scale(0.85);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
  
  .mobile-bar:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.08);
    transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.08s cubic-bezier(0.2, 0, 0, 1);
  }
}

[data-theme="light"] .mobile-bar {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .bar-play svg {
  color: var(--text-primary);
}

[data-theme="light"] .bar-name {
  color: var(--text-primary);
}

[data-theme="light"] .bar-artist {
  color: var(--text-muted);
}

[data-theme="light"] .bar-close {
  color: var(--text-muted);
}

[data-theme="light"] .modal-sheet {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .modal-handle {
  background: rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .modal-artwork {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .modal-name {
  color: var(--text-primary);
}

[data-theme="light"] .modal-artist {
  color: var(--text-muted);
}

[data-theme="light"] .modal-progress-track {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .modal-progress-fill {
  background: var(--text-primary);
}

[data-theme="light"] .modal-progress-thumb {
  background: var(--text-primary);
}

[data-theme="light"] .modal-times {
  color: var(--text-muted);
}

[data-theme="light"] .modal-ctrl {
  color: var(--text-primary);
}

[data-theme="light"] .modal-play {
  background: var(--text-primary);
}

[data-theme="light"] .modal-play svg {
  color: white;
}

[data-theme="light"] .desktop-player.glass {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

[data-theme="light"] .mini-play {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .mini-play svg {
  color: var(--text-primary);
}

[data-theme="light"] .mini-name {
  color: var(--text-primary);
}

[data-theme="light"] .mini-progress {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .mini-bar {
  background: var(--text-primary);
}

[data-theme="light"] .mini-close {
  color: var(--text-muted);
}

[data-theme="light"] .mini-close:hover {
  color: var(--text-primary);
}

[data-theme="light"] .full-title {
  color: var(--text-muted);
}

[data-theme="light"] .full-btn {
  color: var(--text-muted);
}

[data-theme="light"] .full-btn:hover {
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .full-artwork {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .full-artwork svg {
  color: var(--text-muted);
}

[data-theme="light"] .full-name {
  color: var(--text-primary);
}

[data-theme="light"] .full-artist {
  color: var(--text-muted);
}

[data-theme="light"] .progress-track {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .progress-fill {
  background: var(--text-primary);
}

[data-theme="light"] .progress-thumb {
  background: var(--text-primary);
}

[data-theme="light"] .progress-times {
  color: var(--text-muted);
}

[data-theme="light"] .ctrl-btn {
  color: var(--text-primary);
}

[data-theme="light"] .ctrl-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .ctrl-play {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .ctrl-play:hover {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .ctrl-play svg {
  color: var(--text-primary);
}

[data-theme="light"] .vol-btn {
  color: var(--text-muted);
}

[data-theme="light"] .vol-btn:hover {
  color: var(--text-primary);
}

[data-theme="light"] .vol-track {
  background: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .vol-fill {
  background: var(--text-primary);
}

[data-theme="light"] .vol-thumb {
  background: var(--text-primary);
}
</style>
