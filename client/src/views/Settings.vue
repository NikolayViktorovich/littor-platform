<template>
  <div class="settings-page">
    <div class="settings-container glass">
      <div class="settings-header">
        <button @click="$router.back()" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1>{{ t('settings') }}</h1>
      </div>

      <div class="settings-content">
        <div class="settings-section">
          <div class="settings-item" @click="openSection('devices')">
            <div class="settings-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
            </div>
            <span class="settings-label">{{ t('devices') }}</span>
            <span class="settings-value">{{ devices.length || '' }}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div class="settings-item" @click="openSection('notifications')">
            <div class="settings-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <span class="settings-label">{{ t('notificationsAndSounds') }}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div class="settings-item" @click="openSection('privacy')">
            <div class="settings-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <span class="settings-label">{{ t('privacy') }}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div class="settings-item" @click="openSection('appearance')">
            <div class="settings-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <span class="settings-label">{{ t('appearance') }}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div class="settings-item" @click="openSection('language')">
            <div class="settings-icon violet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <span class="settings-label">{{ t('language') }}</span>
            <span class="settings-value">{{ currentLanguageName }}</span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="activeSection" class="settings-modal-overlay" @click.self="activeSection = null">
          <div class="settings-modal glass-modal">
            <div class="modal-header">
              <button @click="activeSection = null" class="back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h2>{{ sectionTitles[activeSection] }}</h2>
            </div>

            <div class="modal-content">
              <template v-if="activeSection === 'devices'">
                <div v-if="loadingDevices" class="loading-state"><div class="spinner"></div></div>
                <template v-else>
                  <div class="devices-list">
                    <div v-for="device in devices" :key="device.id" class="device-item" :class="{ current: device.current }">
                      <div class="device-icon" :class="device.deviceType">
                        <svg v-if="device.deviceType === 'desktop'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        <svg v-else-if="device.deviceType === 'mobile'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/></svg>
                      </div>
                      <div class="device-info">
                        <span class="device-name">{{ device.deviceName }}</span>
                        <span class="device-details">{{ device.ip || '' }} · {{ formatDeviceTime(device.lastActive) }}</span>
                      </div>
                      <span v-if="device.current" class="device-current">{{ t('current') }}</span>
                      <button v-else @click="terminateSession(device.id)" class="device-terminate">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                  <button v-if="devices.filter(d => !d.current).length > 0" @click="terminateAllSessions" class="terminate-all-btn">{{ t('terminateAllSessions') }}</button>
                </template>
              </template>

              <template v-else-if="activeSection === 'notifications'">
                <div class="settings-group">
                  <div class="toggle-item">
                    <span>{{ t('notifications') }}</span>
                    <label class="toggle"><input type="checkbox" v-model="settings.notificationsEnabled"><span class="toggle-slider"></span></label>
                  </div>
                  <div class="toggle-item">
                    <span>{{ t('soundNotifications') }}</span>
                    <label class="toggle"><input type="checkbox" v-model="settings.soundEnabled"><span class="toggle-slider"></span></label>
                  </div>
                  <div class="toggle-item">
                    <span>{{ t('messagePreview') }}</span>
                    <label class="toggle"><input type="checkbox" v-model="settings.messagePreview"><span class="toggle-slider"></span></label>
                  </div>
                </div>
              </template>

              <template v-else-if="activeSection === 'privacy'">
                <div class="settings-group">
                  <div class="custom-select-item" @click="toggleDropdown('lastSeen', $event)">
                    <span>{{ t('whoSeesLastSeen') }}</span>
                    <div class="custom-select-value">
                      <span>{{ getPrivacyLabel(settings.lastSeenVisibility, 'lastSeen') }}</span>
                      <svg class="chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div class="custom-select-item" @click="toggleDropdown('whoCanMessage', $event)">
                    <span>{{ t('whoCanMessage') }}</span>
                    <div class="custom-select-value">
                      <span>{{ getPrivacyLabel(settings.whoCanMessage, 'message') }}</span>
                      <svg class="chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                  <div class="custom-select-item" @click="toggleDropdown('profileVisibility', $event)">
                    <span>{{ t('whoSeesProfile') }}</span>
                    <div class="custom-select-value">
                      <span>{{ getPrivacyLabel(settings.profileVisibility, 'profile') }}</span>
                      <svg class="chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="activeSection === 'appearance'">
                <div class="settings-group">
                  <div class="theme-selector">
                    <span class="group-label">{{ t('theme') }}</span>
                    <div class="theme-switcher">
                      <div class="theme-switcher-track">
                        <div class="theme-switcher-indicator" :class="settings.theme"></div>
                        <button class="theme-switcher-btn" :class="{ active: settings.theme === 'dark' }" @click="setTheme('dark')" :title="t('dark')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        </button>
                        <button class="theme-switcher-btn" :class="{ active: settings.theme === 'light' }" @click="setTheme('light')" :title="t('light')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                        </button>
                        <button class="theme-switcher-btn" :class="{ active: settings.theme === 'system' }" @click="setTheme('system')" :title="t('system')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="settings-group">
                  <div class="toggle-item">
                    <span>{{ t('animations') }}</span>
                    <label class="toggle"><input type="checkbox" v-model="settings.animationsEnabled" @change="applyAnimations"><span class="toggle-slider"></span></label>
                  </div>
                </div>
              </template>

              <template v-else-if="activeSection === 'language'">
                <div class="language-list">
                  <button v-for="lang in languages" :key="lang.code" class="language-item" :class="{ active: settings.language === lang.code }" @click="changeLanguage(lang.code)">
                    <span class="lang-name">{{ lang.name }}</span>
                    <span class="lang-native">{{ lang.native }}</span>
                    <svg v-if="settings.language === lang.code" class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="dropdown">
        <div v-if="openDropdown === 'lastSeen'" class="custom-dropdown" :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }" @click.stop>
          <button v-for="opt in lastSeenOptions" :key="opt.value" class="dropdown-option" :class="{ active: settings.lastSeenVisibility === opt.value }" @click="selectOption('lastSeenVisibility', opt.value)">
            <span>{{ opt.label }}</span>
            <svg v-if="settings.lastSeenVisibility === opt.value" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </Transition>
      <Transition name="dropdown">
        <div v-if="openDropdown === 'whoCanMessage'" class="custom-dropdown" :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }" @click.stop>
          <button v-for="opt in messageOptions" :key="opt.value" class="dropdown-option" :class="{ active: settings.whoCanMessage === opt.value }" @click="selectOption('whoCanMessage', opt.value)">
            <span>{{ opt.label }}</span>
            <svg v-if="settings.whoCanMessage === opt.value" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </Transition>
      <Transition name="dropdown">
        <div v-if="openDropdown === 'profileVisibility'" class="custom-dropdown" :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }" @click.stop>
          <button v-for="opt in profileOptions" :key="opt.value" class="dropdown-option" :class="{ active: settings.profileVisibility === opt.value }" @click="selectOption('profileVisibility', opt.value)">
            <span>{{ opt.label }}</span>
            <svg v-if="settings.profileVisibility === opt.value" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '../i18n'
import api from '../api'

const { t, setLanguage } = useI18n()

const activeSection = ref(null)
const loadingDevices = ref(false)
const devices = ref([])
const openDropdown = ref(null)

const lastSeenOptions = computed(() => [
  { value: 'everyone', label: t('everyone') },
  { value: 'contacts', label: t('friends') },
  { value: 'nobody', label: t('nobody') }
])

const messageOptions = computed(() => [
  { value: 'everyone', label: t('everyone') },
  { value: 'contacts', label: t('friends') }
])

const profileOptions = computed(() => [
  { value: 'everyone', label: t('everyone') },
  { value: 'contacts', label: t('friends') }
])

function getPrivacyLabel(value, type) {
  if (value === 'everyone') return t('everyone')
  if (value === 'contacts') return t('friends')
  if (value === 'nobody') return t('nobody')
  return t('everyone')
}

const dropdownPosition = ref({ top: 0, left: 0 })

function toggleDropdown(name, event) {
  if (openDropdown.value === name) {
    openDropdown.value = null
    return
  }
  openDropdown.value = name
  if (event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const menuHeight = 150
    const menuWidth = 180
    let top = rect.bottom + 8
    let left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 10)
    
    if (top + menuHeight > window.innerHeight - 10) {
      top = rect.top - menuHeight - 8
    }
    
    dropdownPosition.value = { top, left: Math.max(10, left) }
  }
}

function selectOption(key, value) {
  settings[key] = value
  openDropdown.value = null
}

const sectionTitles = computed(() => ({
  devices: t('devices'),
  notifications: t('notificationsAndSounds'),
  privacy: t('privacy'),
  appearance: t('appearance'),
  language: t('language')
}))

const settings = reactive({
  notificationsEnabled: true,
  soundEnabled: true,
  messagePreview: true,
  lastSeenVisibility: 'everyone',
  whoCanMessage: 'everyone',
  profileVisibility: 'everyone',
  theme: 'dark',
  animationsEnabled: true,
  language: 'ru'
})

const languages = [
  { code: 'ru', name: 'Русский', native: 'Русский' },
  { code: 'en', name: 'English', native: 'English' }
]

const currentLanguageName = computed(() => {
  const lang = languages.find(l => l.code === settings.language)
  return lang?.name || 'Русский'
})

function formatDeviceTime(date) {
  if (!date) return t('now')
  const d = new Date(date)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return t('now')
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t('minAgo')}`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('hoursAgo')}`
  return d.toLocaleDateString(settings.language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })
}

async function openSection(section) {
  activeSection.value = section
  if (section === 'devices') await fetchDevices()
}

async function fetchDevices() {
  loadingDevices.value = true
  try {
    const res = await api.get('/users/sessions')
    devices.value = res.data
  } catch {} finally { loadingDevices.value = false }
}

async function terminateSession(id) {
  try {
    await api.delete(`/users/sessions/${id}`)
    devices.value = devices.value.filter(d => d.id !== id)
  } catch {}
}

async function terminateAllSessions() {
  try {
    await api.delete('/users/sessions')
    devices.value = devices.value.filter(d => d.current)
  } catch {}
}

function setTheme(theme) {
  settings.theme = theme
  applyTheme(theme)
}

function applyTheme(theme) {
  let actualTheme = theme
  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  
  // Add transition class for smooth theme change
  document.documentElement.classList.add('theme-transitioning')
  document.documentElement.setAttribute('data-theme', actualTheme)
  localStorage.setItem('theme', theme)
  
  // Remove transition class after animation
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 300)
}

function applyAnimations() {
  document.documentElement.classList.toggle('no-animations', !settings.animationsEnabled)
  localStorage.setItem('animationsEnabled', settings.animationsEnabled)
}

function changeLanguage(code) {
  settings.language = code
  setLanguage(code)
  localStorage.setItem('language', code)
}

async function loadSettings() {
  try {
    const res = await api.get('/users/settings')
    if (res.data && Object.keys(res.data).length > 0) Object.assign(settings, res.data)
  } catch {}
  
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) settings.theme = savedTheme
  const savedAnimations = localStorage.getItem('animationsEnabled')
  if (savedAnimations !== null) settings.animationsEnabled = savedAnimations === 'true'
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage) { settings.language = savedLanguage; setLanguage(savedLanguage) }
  
  applyTheme(settings.theme)
  applyAnimations()
}

let saveTimeout = null
async function saveSettings() {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => { try { await api.put('/users/settings', settings) } catch {} }, 500)
}

function handleClickOutside(e) {
  if (openDropdown.value && !e.target.closest('.custom-dropdown') && !e.target.closest('.custom-select-item')) {
    openDropdown.value = null
  }
}

watch(settings, saveSettings, { deep: true })
onMounted(() => {
  loadSettings()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.settings-page { min-height: 100vh; padding: 20px; padding-left: calc(var(--sidebar-width) + 20px); display: flex; justify-content: center; align-items: flex-start; }
.settings-container { max-width: 500px; width: 100%; }
.settings-header { display: flex; align-items: center; gap: 16px; padding: 20px; border-bottom: 1px solid var(--glass-border); }
.settings-header h1 { font-size: 20px; font-weight: 600; margin: 0; }
.back-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border-radius: var(--radius-full); transition: all 0.1s cubic-bezier(0.2, 0, 0, 1); flex-shrink: 0; }
.back-btn:hover { background: var(--glass-bg-hover); color: var(--text-primary); }
.back-btn:active { transform: scale(0.9); }
.back-btn svg { width: 24px; height: 24px; }
.settings-content { padding: 12px; }
.settings-section { display: flex; flex-direction: column; gap: 4px; }
.settings-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--radius-lg); cursor: pointer; transition: background 0.1s cubic-bezier(0.2, 0, 0, 1); }
.settings-item:hover { background: var(--glass-bg-hover); }
.settings-item:active { background: var(--glass-bg-active); }
.settings-icon { width: 36px; height: 36px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.settings-icon svg { width: 20px; height: 20px; color: white; }
.settings-icon.orange { background: #ff9500; }
.settings-icon.red { background: #ff3b30; }
.settings-icon.purple { background: #af52de; }
.settings-icon.blue { background: #007aff; }
.settings-icon.violet { background: #5856d6; }
.settings-label { flex: 1; font-size: 15px; color: var(--text-primary); }
.settings-value { font-size: 14px; color: var(--text-muted); }
.chevron { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
.settings-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.settings-modal { width: 100%; max-width: 440px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--glass-border); }
.modal-header h2 { font-size: 18px; font-weight: 600; margin: 0; }
.modal-content { flex: 1; overflow-y: auto; padding: 16px; }
.loading-state { display: flex; justify-content: center; align-items: center; padding: 40px; }
.spinner { width: 24px; height: 24px; border: 2px solid var(--glass-border); border-top-color: var(--text-secondary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.settings-group { background: var(--glass-bg); border-radius: var(--radius-lg); padding: 4px; margin-bottom: 16px; }
.toggle-item, .select-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 12px; }
.toggle-item span, .select-item span { font-size: 15px; color: var(--text-primary); }
.custom-select-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 12px; cursor: pointer; position: relative; transition: background 0.1s; border-radius: var(--radius); }
.custom-select-item:hover { background: var(--glass-bg-hover); }
.custom-select-item > span { font-size: 15px; color: var(--text-primary); }
.custom-select-value { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 14px; }
.chevron-down { width: 16px; height: 16px; transition: transform 0.15s; }
.custom-dropdown { position: fixed; min-width: 180px; background: rgba(28, 28, 30, 0.95); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 6px; z-index: 1000; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
.dropdown-option { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 14px; border-radius: var(--radius); font-size: 14px; color: var(--text-primary); transition: background 0.1s; text-align: left; }
.dropdown-option:hover { background: var(--glass-bg-hover); }
.dropdown-option.active { color: var(--text-primary); }
.check-icon { width: 18px; height: 18px; color: var(--text-primary); }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
.toggle { position: relative; width: 50px; height: 30px; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; background: var(--glass-bg-active); border-radius: 15px; transition: all 0.15s cubic-bezier(0.2, 0, 0, 1); }
.toggle-slider::before { content: ''; position: absolute; width: 26px; height: 26px; left: 2px; top: 2px; background: white; border-radius: 50%; transition: all 0.15s cubic-bezier(0.2, 0, 0, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.toggle input:checked + .toggle-slider { background: #34c759; }
.toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
.select-item select { background: var(--glass-bg-hover); border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: var(--radius); color: var(--text-primary); font-size: 14px; cursor: pointer; }
.select-item select:focus { outline: none; border-color: var(--glass-border-light); }
.theme-selector { padding: 16px; }
.group-label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.theme-switcher { display: flex; justify-content: center; }
.theme-switcher-track { display: flex; align-items: center; gap: 4px; padding: 4px; background: var(--glass-bg); border-radius: var(--radius-full); position: relative; }
.theme-switcher-indicator { position: absolute; width: 40px; height: 40px; background: var(--glass-bg-active); border-radius: var(--radius-full); transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; }
.theme-switcher-indicator.dark { transform: translateX(0); }
.theme-switcher-indicator.light { transform: translateX(44px); }
.theme-switcher-indicator.system { transform: translateX(88px); }
.theme-switcher-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full); color: var(--text-muted); transition: color 0.15s cubic-bezier(0.2, 0, 0, 1); position: relative; z-index: 1; }
.theme-switcher-btn:hover { color: var(--text-secondary); }
.theme-switcher-btn.active { color: var(--text-primary); }
.theme-switcher-btn svg { width: 20px; height: 20px; }
.language-list { display: flex; flex-direction: column; gap: 4px; }
.language-item { display: flex; align-items: center; padding: 14px 16px; border-radius: var(--radius-lg); transition: background 0.1s cubic-bezier(0.2, 0, 0, 1); text-align: left; }
.language-item:hover { background: var(--glass-bg-hover); }
.language-item.active { background: rgba(91, 154, 255, 0.1); }
.lang-name { flex: 1; font-size: 15px; color: var(--text-primary); }
.lang-native { font-size: 14px; color: var(--text-muted); margin-right: 12px; }
.language-item .check { width: 20px; height: 20px; color: #5b9aff; flex-shrink: 0; }
.devices-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.device-item { display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--glass-bg); border-radius: var(--radius-lg); }
.device-item.current { background: rgba(52, 199, 89, 0.1); }
.device-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--glass-bg-hover); border-radius: var(--radius); flex-shrink: 0; }
.device-icon svg { width: 22px; height: 22px; color: var(--text-secondary); }
.device-info { flex: 1; min-width: 0; }
.device-name { display: block; font-size: 15px; color: var(--text-primary); margin-bottom: 2px; }
.device-details { font-size: 13px; color: var(--text-muted); }
.device-current { font-size: 12px; color: #34c759; padding: 4px 10px; background: rgba(52, 199, 89, 0.15); border-radius: var(--radius-full); flex-shrink: 0; white-space: nowrap; }
.device-terminate { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border-radius: var(--radius-full); transition: all 0.1s; flex-shrink: 0; }
.device-terminate:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
.device-terminate svg { width: 18px; height: 18px; }
.terminate-all-btn { width: 100%; padding: 14px; background: rgba(255, 59, 48, 0.1); color: #ff3b30; border-radius: var(--radius-lg); font-size: 15px; font-weight: 500; transition: background 0.1s; text-align: center; }
.terminate-all-btn:hover { background: rgba(255, 59, 48, 0.15); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.1s cubic-bezier(0.2, 0, 0, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .settings-modal, .modal-leave-active .settings-modal { transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1); }
.modal-enter-from .settings-modal, .modal-leave-to .settings-modal { transform: scale(0.97); }
@media (max-width: 768px) { .settings-page { padding: 20px; padding-bottom: 100px; padding-left: 20px; } .settings-modal { max-height: 90vh; } }

[data-theme="light"] .custom-dropdown { background: rgba(255, 255, 255, 0.95); box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
[data-theme="light"] .settings-modal-overlay { background: rgba(0,0,0,0.4); }
</style>
