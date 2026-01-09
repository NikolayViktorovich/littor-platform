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
        <button class="back-btn" @click="step = 'email'" v-if="step === 'password'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <!-- Step 1: Email -->
        <template v-if="step === 'email'">
          <div class="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 104 4"/>
            </svg>
          </div>
          
          <h1 class="auth-title">Вход в Littor</h1>
          <p class="auth-subtitle">Выберите аккаунт для входа</p>
          
          <form @submit.prevent="checkEmail" class="auth-form">
            <div class="input-group">
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="Email или телефон" 
                required
                autocomplete="email"
              >
            </div>

            <button type="submit" class="submit-btn" :disabled="loading || !form.email">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Продолжить</span>
            </button>
          </form>

          <button class="alt-action" @click="$router.push('/register')">
            Создать аккаунт
          </button>
        </template>

        <!-- Step 2: Password -->
        <template v-else>
          <h1 class="auth-title title-left">Подтвердите вход</h1>
          <p class="auth-subtitle subtitle-left">Введите пароль для входа в аккаунт</p>
          
          <div class="user-card">
            <div class="user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              </svg>
            </div>
            <div class="user-info">
              <span class="user-name">{{ displayName }}</span>
              <span class="user-email">{{ maskedEmail }}</span>
            </div>
          </div>

          <form @submit.prevent="submit" class="auth-form">
            <div class="input-group">
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Введите пароль" 
                required
                autocomplete="current-password"
                ref="passwordInput"
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

            <a href="#" class="forgot-link">Забыли пароль?</a>

            <button type="submit" class="submit-btn" :disabled="loading || !form.password">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Продолжить</span>
            </button>
          </form>
        </template>
      </div>

      <span class="help-link" @click="showHelp = true">Помощь</span>

      <!-- Help Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showHelp" class="modal-overlay" @click.self="showHelp = false">
            <div class="help-modal glass-modal">
              <div class="help-header">
                <h2>Помощь</h2>
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
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">Не могу войти в аккаунт</span>
                    <span class="help-desc">Проверьте правильность email и пароля. Пароль чувствителен к регистру.</span>
                  </div>
                </div>
                <div class="help-item" @click="openForgotPassword">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">Забыли пароль?</span>
                    <span class="help-desc">Восстановите доступ к аккаунту</span>
                  </div>
                  <svg class="help-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
                <div class="help-item" @click="$router.push('/register'); showHelp = false">
                  <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                  </div>
                  <div class="help-text">
                    <span class="help-title">Создание аккаунта</span>
                    <span class="help-desc">Зарегистрируйтесь в Littor</span>
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
                    <span class="help-title">Связаться с поддержкой</span>
                    <span class="help-desc">n.golubtsov05@bk.ru</span>
                  </div>
                  <svg class="help-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Forgot Password Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showForgotModal" class="modal-overlay" @click.self="closeForgotModal">
            <div class="forgot-modal glass-modal">
              <button class="modal-back" @click="handleForgotBack">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              <!-- Step 1: Enter email -->
              <template v-if="forgotStep === 'email'">
                <div class="forgot-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h2 class="forgot-title">Восстановление пароля</h2>
                <p class="forgot-desc">Введите email, на который зарегистрирован аккаунт. Мы отправим код для сброса пароля.</p>
                
                <form @submit.prevent="sendResetEmail" class="forgot-form">
                  <div class="input-group">
                    <input 
                      v-model="forgotEmail" 
                      type="email" 
                      placeholder="Email" 
                      required
                    >
                  </div>
                  <button type="submit" class="submit-btn" :disabled="forgotLoading || !forgotEmail">
                    <span v-if="forgotLoading" class="spinner"></span>
                    <span v-else>Отправить код</span>
                  </button>
                </form>

                <p class="forgot-support">
                  Нет доступа к почте? <a href="mailto:n.golubtsov05@bk.ru">Написать в поддержку</a>
                </p>
              </template>

              <!-- Step 2: Enter code -->
              <template v-else-if="forgotStep === 'code'">
                <div class="forgot-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 class="forgot-title">Введите код</h2>
                <p class="forgot-desc">Мы отправили код на <strong>{{ forgotEmail }}</strong></p>
                
                <form @submit.prevent="verifyResetCode" class="forgot-form">
                  <div class="code-inputs">
                    <input 
                      v-for="(_, i) in 6" 
                      :key="i"
                      type="text"
                      maxlength="1"
                      class="code-input"
                      :ref="el => resetCodeInputs[i] = el"
                      @input="handleResetCodeInput($event, i)"
                      @keydown="handleResetCodeKeydown($event, i)"
                      @paste="handleResetCodePaste"
                      inputmode="numeric"
                    >
                  </div>
                  <button type="submit" class="submit-btn" :disabled="forgotLoading || resetCode.length !== 6">
                    <span v-if="forgotLoading" class="spinner"></span>
                    <span v-else>Подтвердить</span>
                  </button>
                </form>

                <p class="forgot-support">
                  Не пришёл код? 
                  <button 
                    v-if="resendTimer === 0" 
                    @click="sendResetEmail" 
                    class="resend-link"
                    :disabled="forgotLoading"
                  >
                    Отправить повторно
                  </button>
                  <span v-else class="resend-timer">Повторно через {{ resendTimer }}с</span>
                </p>
              </template>

              <!-- Step 3: New password -->
              <template v-else-if="forgotStep === 'newPassword'">
                <div class="forgot-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h2 class="forgot-title">Новый пароль</h2>
                <p class="forgot-desc">Придумайте новый пароль для вашего аккаунта</p>
                
                <form @submit.prevent="submitNewPassword" class="forgot-form">
                  <div class="input-group">
                    <input 
                      v-model="newPassword" 
                      :type="showNewPassword ? 'text' : 'password'" 
                      placeholder="Новый пароль" 
                      required
                      minlength="6"
                    >
                    <button type="button" class="input-toggle" @click="showNewPassword = !showNewPassword">
                      <svg v-if="showNewPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </div>
                  <div class="input-group">
                    <input 
                      v-model="confirmPassword" 
                      :type="showNewPassword ? 'text' : 'password'" 
                      placeholder="Повторите пароль" 
                      required
                      minlength="6"
                    >
                  </div>
                  <button type="submit" class="submit-btn" :disabled="forgotLoading || !canResetPassword">
                    <span v-if="forgotLoading" class="spinner"></span>
                    <span v-else>Сохранить пароль</span>
                  </button>
                </form>
              </template>

              <!-- Step 4: Success -->
              <template v-else-if="forgotStep === 'success'">
                <div class="forgot-icon success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 class="forgot-title">Пароль изменён</h2>
                <p class="forgot-desc">Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем.</p>
                
                <button class="submit-btn" @click="closeForgotModal">
                  Вернуться ко входу
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Email Verification Modal (for unverified accounts) -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showVerifyModal" class="modal-overlay" @click.self="showVerifyModal = false">
            <div class="forgot-modal glass-modal">
              <button class="modal-back" @click="showVerifyModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              <div class="forgot-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 class="forgot-title">Подтвердите email</h2>
              <p class="forgot-desc">Мы отправили код на <strong>{{ form.email }}</strong></p>
              
              <form @submit.prevent="submitVerifyEmail" class="forgot-form">
                <div class="code-inputs">
                  <input 
                    v-for="(_, i) in 6" 
                    :key="i"
                    type="text"
                    maxlength="1"
                    class="code-input"
                    :ref="el => verifyCodeInputs[i] = el"
                    @input="handleVerifyCodeInput($event, i)"
                    @keydown="handleVerifyCodeKeydown($event, i)"
                    @paste="handleVerifyCodePaste"
                    inputmode="numeric"
                  >
                </div>
                <button type="submit" class="submit-btn" :disabled="verifyLoading || verifyCode.length !== 6">
                  <span v-if="verifyLoading" class="spinner"></span>
                  <span v-else>Подтвердить</span>
                </button>
              </form>

              <p class="forgot-support">
                Не пришёл код? 
                <button 
                  v-if="verifyResendTimer === 0" 
                  @click="resendVerifyCode" 
                  class="resend-link"
                  :disabled="verifyLoading"
                >
                  Отправить повторно
                </button>
                <span v-else class="resend-timer">Повторно через {{ verifyResendTimer }}с</span>
              </p>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)
const step = ref('email')
const passwordInput = ref(null)
const showHelp = ref(false)

// Forgot password state
const showForgotModal = ref(false)
const forgotEmail = ref('')
const forgotLoading = ref(false)
const forgotStep = ref('email') // email, code, newPassword, success
const resetCode = ref('')
const resetCodeInputs = ref([])
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const resendTimer = ref(0)
let resendInterval = null

// Email verification state (for unverified accounts)
const showVerifyModal = ref(false)
const verifyCode = ref('')
const verifyCodeInputs = ref([])
const verifyLoading = ref(false)
const verifyResendTimer = ref(0)
let verifyResendInterval = null

const canResetPassword = computed(() => 
  newPassword.value.length >= 6 && newPassword.value === confirmPassword.value
)

function openForgotPassword() {
  showHelp.value = false
  forgotEmail.value = form.email
  forgotStep.value = 'email'
  resetCode.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showForgotModal.value = true
}

function closeForgotModal() {
  showForgotModal.value = false
  forgotStep.value = 'email'
  resetCode.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  if (resendInterval) clearInterval(resendInterval)
}

function handleForgotBack() {
  if (forgotStep.value === 'code') {
    forgotStep.value = 'email'
  } else if (forgotStep.value === 'newPassword') {
    forgotStep.value = 'code'
  } else {
    closeForgotModal()
  }
}

function startResendTimer() {
  resendTimer.value = 60
  if (resendInterval) clearInterval(resendInterval)
  resendInterval = setInterval(() => {
    resendTimer.value--
    if (resendTimer.value <= 0) {
      clearInterval(resendInterval)
    }
  }, 1000)
}

async function sendResetEmail() {
  if (!forgotEmail.value) return
  forgotLoading.value = true
  try {
    await authStore.forgotPassword(forgotEmail.value)
    forgotStep.value = 'code'
    startResendTimer()
    notifications.success('Код отправлен на почту')
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    forgotLoading.value = false
  }
}

function handleResetCodeInput(e, index) {
  const value = e.target.value.replace(/\D/g, '')
  e.target.value = value
  
  const codeArray = resetCode.value.split('')
  codeArray[index] = value
  resetCode.value = codeArray.join('')
  
  if (value && index < 5) {
    resetCodeInputs.value[index + 1]?.focus()
  }
}

function handleResetCodeKeydown(e, index) {
  if (e.key === 'Backspace' && !e.target.value && index > 0) {
    resetCodeInputs.value[index - 1]?.focus()
  }
}

function handleResetCodePaste(e) {
  e.preventDefault()
  const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  resetCode.value = paste
  paste.split('').forEach((char, i) => {
    if (resetCodeInputs.value[i]) {
      resetCodeInputs.value[i].value = char
    }
  })
  if (paste.length === 6) {
    resetCodeInputs.value[5]?.focus()
  }
}

async function verifyResetCode() {
  if (resetCode.value.length !== 6) return
  forgotLoading.value = true
  try {
    await authStore.verifyResetCode(forgotEmail.value, resetCode.value)
    forgotStep.value = 'newPassword'
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    forgotLoading.value = false
  }
}

async function submitNewPassword() {
  if (!canResetPassword.value) return
  forgotLoading.value = true
  try {
    await authStore.resetPassword(forgotEmail.value, resetCode.value, newPassword.value)
    forgotStep.value = 'success'
    notifications.success('Пароль успешно изменён')
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    forgotLoading.value = false
  }
}

// Email verification handlers (for unverified accounts)
function startVerifyResendTimer() {
  verifyResendTimer.value = 60
  if (verifyResendInterval) clearInterval(verifyResendInterval)
  verifyResendInterval = setInterval(() => {
    verifyResendTimer.value--
    if (verifyResendTimer.value <= 0) {
      clearInterval(verifyResendInterval)
    }
  }, 1000)
}

function handleVerifyCodeInput(e, index) {
  const value = e.target.value.replace(/\D/g, '')
  e.target.value = value
  
  const codeArray = verifyCode.value.split('')
  codeArray[index] = value
  verifyCode.value = codeArray.join('')
  
  if (value && index < 5) {
    verifyCodeInputs.value[index + 1]?.focus()
  }
}

function handleVerifyCodeKeydown(e, index) {
  if (e.key === 'Backspace' && !e.target.value && index > 0) {
    verifyCodeInputs.value[index - 1]?.focus()
  }
}

function handleVerifyCodePaste(e) {
  e.preventDefault()
  const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  verifyCode.value = paste
  paste.split('').forEach((char, i) => {
    if (verifyCodeInputs.value[i]) {
      verifyCodeInputs.value[i].value = char
    }
  })
  if (paste.length === 6) {
    verifyCodeInputs.value[5]?.focus()
  }
}

async function submitVerifyEmail() {
  if (verifyCode.value.length !== 6) return
  verifyLoading.value = true
  try {
    await authStore.verifyEmail(form.email, verifyCode.value)
    showVerifyModal.value = false
    notifications.success('Email подтверждён!')
    router.push('/')
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    verifyLoading.value = false
  }
}

async function resendVerifyCode() {
  verifyLoading.value = true
  try {
    await authStore.resendVerification(form.email)
    notifications.success('Код отправлен повторно')
    startVerifyResendTimer()
  } catch (err) {
    notifications.error(err.response?.data?.error || err.message)
  } finally {
    verifyLoading.value = false
  }
}

const displayName = computed(() => {
  const email = form.email
  if (email.includes('@')) {
    const name = email.split('@')[0]
    return name.charAt(0).toUpperCase() + name.slice(1, 8) + '.'
  }
  return email.slice(0, 8) + '.'
})

const maskedEmail = computed(() => {
  const email = form.email
  if (email.includes('@')) {
    const [name, domain] = email.split('@')
    return name.slice(0, 2) + '***@' + domain
  }
  return email.slice(0, 3) + ' *** ** ' + email.slice(-2)
})

async function checkEmail() {
  if (!form.email) return
  step.value = 'password'
  await nextTick()
  passwordInput.value?.focus()
}

async function submit() {
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    router.push('/')
  } catch (err) {
    // Check if account needs verification
    if (err.response?.data?.needsVerification) {
      showVerifyModal.value = true
      startVerifyResendTimer()
      // Request new verification code
      try {
        await authStore.resendVerification(form.email)
        notifications.info('Код подтверждения отправлен на почту')
      } catch (resendErr) {
        notifications.error('Не удалось отправить код')
      }
    } else {
      notifications.error(err.response?.data?.error || err.message)
    }
  } finally {
    loading.value = false
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

.auth-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.title-left {
  text-align: center;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.subtitle-left {
  text-align: center;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: left;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.user-avatar svg {
  width: 20px;
  height: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-email {
  font-size: 13px;
  color: var(--text-muted);
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

.forgot-link {
  align-self: flex-start;
  color: #5b9aff;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.15s;
}

.forgot-link:hover {
  color: #7db0ff;
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
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s;
}

.alt-action:hover {
  color: var(--text-primary);
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

.help-arrow {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: auto;
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

.forgot-modal {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  text-align: center;
  position: relative;
}

.modal-back {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 8px;
  transition: all 0.15s;
}

.modal-back:hover {
  color: var(--text-primary);
}

.modal-back svg {
  width: 20px;
  height: 20px;
}

.forgot-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.forgot-icon svg {
  width: 28px;
  height: 28px;
}

.forgot-icon.success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.forgot-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.forgot-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
}

.forgot-desc strong {
  color: var(--text-primary);
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forgot-support {
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-muted);
}

.forgot-support a, .resend-link {
  color: #5b9aff;
  text-decoration: none;
  background: none;
  border: none;
  font-size: inherit;
  cursor: pointer;
}

.forgot-support a:hover, .resend-link:hover {
  color: #7db0ff;
}

.resend-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resend-timer {
  color: var(--text-muted);
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

.modal-enter-active .forgot-modal, .modal-leave-active .forgot-modal {
  transition: transform 0.15s ease;
}

.modal-enter-from .forgot-modal, .modal-leave-to .forgot-modal {
  transform: scale(0.95);
}

@media (max-width: 440px) {
  .auth-card, .qr-block {
    width: calc(100vw - 32px);
  }
  
  .auth-card {
    padding: 24px;
  }
  
  .back-btn {
    top: 20px;
    left: 20px;
  }
  
  .forgot-modal {
    padding: 24px;
  }
  
  .code-input {
    width: 42px;
    height: 50px;
    font-size: 20px;
  }
}
</style>
