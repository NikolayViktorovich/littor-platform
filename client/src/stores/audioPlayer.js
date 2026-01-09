import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAudioPlayerStore = defineStore('audioPlayer', () => {
  const currentTrack = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const isMinimized = ref(false)
  const audioEl = ref(null)

  const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)

  const formattedCurrentTime = computed(() => formatTime(currentTime.value))
  const formattedDuration = computed(() => formatTime(duration.value))

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function initAudio() {
    if (!audioEl.value) {
      audioEl.value = new Audio()
      audioEl.value.addEventListener('timeupdate', () => {
        currentTime.value = audioEl.value.currentTime
      })
      audioEl.value.addEventListener('loadedmetadata', () => {
        duration.value = audioEl.value.duration
      })
      audioEl.value.addEventListener('ended', () => {
        isPlaying.value = false
        currentTime.value = 0
      })
      audioEl.value.addEventListener('play', () => {
        isPlaying.value = true
      })
      audioEl.value.addEventListener('pause', () => {
        isPlaying.value = false
      })
    }
  }

  function play(track) {
    initAudio()
    if (currentTrack.value?.url !== track.url) {
      currentTrack.value = track
      audioEl.value.src = track.url
      audioEl.value.load()
    }
    audioEl.value.play()
    isMinimized.value = false
  }

  function resume() {
    if (audioEl.value && currentTrack.value) {
      audioEl.value.play()
    }
  }

  function pause() {
    if (audioEl.value) {
      audioEl.value.pause()
    }
  }

  function toggle() {
    if (isPlaying.value) {
      pause()
    } else if (currentTrack.value) {
      audioEl.value?.play()
    }
  }

  function seek(percent) {
    if (audioEl.value && duration.value) {
      audioEl.value.currentTime = (percent / 100) * duration.value
    }
  }

  function seekTo(time) {
    if (audioEl.value) {
      audioEl.value.currentTime = time
    }
  }

  function setVolume(val) {
    volume.value = val
    if (audioEl.value) {
      audioEl.value.volume = val
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audioEl.value) {
      audioEl.value.muted = isMuted.value
    }
  }

  function close() {
    pause()
    currentTrack.value = null
    currentTime.value = 0
    duration.value = 0
  }

  function minimize() {
    isMinimized.value = true
  }

  function maximize() {
    isMinimized.value = false
  }

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isMinimized,
    progress,
    formattedCurrentTime,
    formattedDuration,
    play,
    resume,
    pause,
    toggle,
    seek,
    seekTo,
    setVolume,
    toggleMute,
    close,
    minimize,
    maximize
  }
})
