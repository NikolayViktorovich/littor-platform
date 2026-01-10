<template>
  <div class="auth-page">
    <div class="auth-bg">
      <svg class="bg-lines" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path d="M-200 300 Q 400 100, 960 400 T 2100 200" stroke="rgba(255,255,255,0.04)" stroke-width="1" fill="none"/>
        <path d="M-200 500 Q 500 300, 960 600 T 2100 400" stroke="rgba(255,255,255,0.03)" stroke-width="1" fill="none"/>
        <path d="M-200 700 Q 300 500, 960 800 T 2100 600" stroke="rgba(255,255,255,0.04)" stroke-width="1" fill="none"/>
        <path d="M-200 900 Q 600 700, 960 1000 T 2100 800" stroke="rgba(255,255,255,0.03)" stroke-width="1" fill="none"/>
        <ellipse cx="960" cy="540" rx="380" ry="380" stroke="rgba(255,255,255,0.025)" stroke-width="1" fill="none"/>
        <ellipse cx="960" cy="540" rx="520" ry="520" stroke="rgba(255,255,255,0.02)" stroke-width="1" fill="none"/>
        <ellipse cx="960" cy="540" rx="680" ry="680" stroke="rgba(255,255,255,0.015)" stroke-width="1" fill="none"/>
      </svg>
    </div>

    <div class="auth-container">
      <div class="auth-card glass-modal">
        <button class="back-btn" @click="handleBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <!-- Step 1: Registration form -->
        <template v-if="step === 'register'">
          <div class="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
            </svg>
          </div>
          
          <h1 class="auth-title">{{ t('registrationTitle2') }}</h1>
          <p class="auth-subtitle">{{ t('createAccountInLittorDesc') }}</p>
          
          <form @submit.prevent="submitRegister" class="auth-form">
            <div class="input-group">
              <input 
                v-model="form.name" 
                type="text" 
                :placeholder="t('yourNamePlaceholder')" 
                required
                autocomplete="name"
              >
            </div>

            <div class="input-group">
              <div class="username-input-wrap">
                <span class="username-prefix">@</span>
                <input 
                  v-model="form.username" 
                  type="text" 
                  placeholder="username" 
                  required
                  autocomplete="username"
                  @input="form.username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, '')"
                >
              </div>
              <span v-if="form.username && !/^[a-zA-Z0-9_]{3,20}$/.test(form.username)" class="input-hint">{{ t('usernameHint2') }}</span>
            </div>

            <div class="input-group">
              <input 
                v-model="form.email" 
                type="email" 
                :placeholder="t('email')" 
                required
                autocomplete="email"
              >
            </div>
            
            <div class="input-group">
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                :placeholder="t('createPasswordPlaceholder')" 
                required
                minlength="6"
                autocomplete="new-password"
              >
              <button type="button" class="input-toggle" @click="showPassword = !showPassword">
                <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading || !canSubmit">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ t('createAccount') }}</span>
            </button>
          </form>

          <button class="alt-action" @click="$router.push('/login')">
            {{ t('alreadyHaveAccountLogin') }}
          </button>
        </template>

        <!-- Step 2: Email verification -->
        <template v-else-if="step === 'verify'">
          <div class="verify-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          
          <h1 class="auth-title">{{ t('confirmEmailTitle') }}</h1>
          <p class="auth-subtitle">{{ t('codeSentToEmail') }} <strong>{{ form.email }}</strong></p>
          
          <form @submit.prevent="submitVerify" class="auth-form">
            <div class="code-inputs">
              <input 
                v-for="(_, i) in 6" 
                :key="i"
                type="text"
                maxlength="1"
                class="code-input"
                :ref="el => codeInputs[i] = el"
                @input="handleCodeInput($event, i)"
                @keydown="handleCodeKeydown($event, i)"
                @paste="handleCodePaste"
                inputmode="numeric"
              >
            </div>

            <button type="submit" class="submit-btn" :disabled="loading || verifyCode.length !== 6">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ t('confirmBtn') }}</span>
            </button>
          </form>

          <p class="resend-text">
            {{ t('noCodeReceivedQ') }} 
            <button 
              v-if="resendTimer === 0" 
              @click="resendCode" 
              class="resend-link"
              :disabled="resendLoading"
            >
              {{ t('resendCodeBtn') }}
            </button>
            <span v-else class="resend-timer">{{ t('resendInSec') }} {{ resendTimer }}с</span>
          </p>
        </template>

        <!-- Step 3: Success -->
        <template v-else-if="step === 'success'">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          
          <h1 class="auth-title">{{ t('welcomeTitle') }}</h1>
          <p class="auth-subtitle">{{ t('accountCreatedDesc') }}</p>
          
          <button class="submit-btn" @click="$router.push('/')">
            {{ t('startBtn') }}
          </button>
        </template>
      </div>

      <span class="help-link" @click="showHelp = true">{{ t('help') }}</span>

      <!-- Help Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showHelp" class="modal-overlay" @click.self="showHelp = false">
            <div class="help-modal glass-modal">
              <div class="help-header">
                <h2>{{ t('helpTitle') }}</h2>
                <button @click="showHelp = false" class="close-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div class="help-content">
                <div class="help-item info-only">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">{{ t('howToRegisterTitle') }}</span>
                    <span class="help-desc">{{ t('howToRegisterDesc2') }}</span>
                  </div>
                </div>
                <div class="help-item info-only">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">{{ t('passwordRequirementsTitle') }}</span>
                    <span class="help-desc">{{ t('passwordRequirementsDesc2') }}</span>
                  </div>
                </div>
                <div class="help-item" @click="$router.push('/login'); showHelp = false">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">{{ t('alreadyHaveAccountTitle') }}</span>
                    <span class="help-desc">{{ t('loginToExistingDesc') }}</span>
                  </div>
                  <svg class="help-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <a href="mailto:n.golubtsov05@bk.ru" class="help-item">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">{{ t('contactSupportTitle') }}</span>
                    <span class="help-desc">n.golubtsov05@bk.ru</span>
                  </div>
                  <svg class="help-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useI18n } from '../i18n'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()
const { t } = useI18n()

const form = reactive({ name: '', email: '', password: '', username: '' })
const loading = ref(false)
const showPassword = ref(false)
const showHelp = ref(false)
const step = ref('register')
const verifyCode = ref('')
const codeInputs = ref([])
const resendTimer = ref(0)
const resendLoading = ref(false)
let timerInterval = null

const canSubmit = computed(() => form.name && form.email && form.password.length >= 6 && /^[a-zA-Z0-9_]{3,20}$/.test(form.username))

function handleBack() {
  if (step.value === 'verify') {
    step.value = 'register'
  } else {
    router.push('/login')
  }
}

async function submitRegister() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await authStore.register(form)
    step.value = 'verify'
    startResendTimer()
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    loading.value = false
  }
}

function handleCodeInput(e, index) {
  const value = e.target.value.replace(/\D/g, '')
  e.target.value = value
  
  const codeArray = verifyCode.value.split('')
  codeArray[index] = value
  verifyCode.value = codeArray.join('')
  
  if (value && index < 5) {
    codeInputs.value[index + 1]?.focus()
  }
}

function handleCodeKeydown(e, index) {
  if (e.key === 'Backspace' && !e.target.value && index > 0) {
    codeInputs.value[index - 1]?.focus()
  }
}

function handleCodePaste(e) {
  e.preventDefault()
  const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  verifyCode.value = paste
  paste.split('').forEach((char, i) => {
    if (codeInputs.value[i]) {
      codeInputs.value[i].value = char
    }
  })
  if (paste.length === 6) {
    codeInputs.value[5]?.focus()
  }
}

async function submitVerify() {
  if (verifyCode.value.length !== 6) return
  loading.value = true
  try {
    await authStore.verifyEmail(form.email, verifyCode.value)
    step.value = 'success'
    notifications.success(t('emailConfirmed'))
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    loading.value = false
  }
}

function startResendTimer() {
  resendTimer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    resendTimer.value--
    if (resendTimer.value <= 0) {
      clearInterval(timerInterval)
    }
  }, 1000)
}

async function resendCode() {
  resendLoading.value = true
  try {
    await authStore.resendVerification(form.email)
    notifications.success(t('codeSentAgain'))
    startResendTimer()
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-lines {
  width: 100%;
  height: 100%;
}

.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.auth-card {
  width: 400px;
  padding: 32px;
  text-align: center;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 28px;
  left: 28px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 8px;
  transition: all 0.15s;
}

.back-btn:hover {
  color: var(--text-primary);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.auth-logo {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  color: white;
}

.auth-logo svg {
  width: 100%;
  height: 100%;
}

.verify-icon, .success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.verify-icon svg, .success-icon svg {
  width: 32px;
  height: 32px;
}

.success-icon {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.auth-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.auth-subtitle strong {
  color: var(--text-primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  position: relative;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  padding-right: 48px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.15s ease;
}

.input-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
}

.input-group input::placeholder {
  color: var(--text-muted);
}

.input-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  padding: 4px;
  transition: color 0.15s;
}

.input-toggle:hover {
  color: var(--text-secondary);
}

.input-toggle svg {
  width: 20px;
  height: 20px;
}

.username-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.15s ease;
}

.username-input-wrap:focus-within {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
}

.username-prefix {
  padding-left: 16px;
  color: var(--text-muted);
  font-size: 15px;
  user-select: none;
}

.username-input-wrap input {
  flex: 1;
  padding: 14px 16px 14px 4px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
}

.username-input-wrap input:focus {
  outline: none;
}

.username-input-wrap input::placeholder {
  color: var(--text-muted);
}

.input-hint {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #f87171;
}

.code-inputs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.code-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-primary);
  transition: all 0.15s;
}

.code-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alt-action {
  width: 100%;
  padding: 12px;
  margin-top: 4px;
  background: transparent;
  border: none;
  color: #5b9aff;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s;
}

.alt-action:hover {
  color: #7db0ff;
}

.resend-text {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.resend-link {
  color: #5b9aff;
  background: none;
  border: none;
  font-size: inherit;
  cursor: pointer;
}

.resend-link:hover {
  color: #7db0ff;
}

.resend-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resend-timer {
  color: var(--text-muted);
}

.help-link {
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s;
  margin-top: 8px;
}

.help-link:hover {
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.help-modal {
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.help-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 8px;
  transition: all 0.15s;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.help-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  transition: background 0.15s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.help-item.info-only {
  cursor: default;
}

.help-item.info-only:hover {
  background: transparent;
}

.help-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.help-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.help-icon svg {
  width: 20px;
  height: 20px;
}

.help-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.help-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.help-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.help-arrow {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .help-modal, .modal-leave-active .help-modal {
  transition: transform 0.15s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .help-modal, .modal-leave-to .help-modal {
  transform: scale(0.95);
}

@media (max-width: 440px) {
  .auth-card {
    width: calc(100vw - 32px);
    padding: 24px;
  }
  
  .back-btn {
    top: 20px;
    left: 20px;
  }
  
  .code-input {
    width: 42px;
    height: 50px;
    font-size: 20px;
  }
}

[data-theme="light"] .verify-icon {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .input-group input {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .input-group input:focus {
  border-color: rgba(0, 0, 0, 0.15);
  background: rgba(0, 0, 0, 0.02);
}

[data-theme="light"] .help-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .help-icon {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .close-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .code-input {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .code-input:focus {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.02);
}
</style>
