<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="bg-gradient bg-gradient-1"></div>
      <div class="bg-gradient bg-gradient-2"></div>
    </div>

    <div class="auth-container">
      <div class="auth-card glass">
        <h1 class="auth-title">Вход в Littor</h1>
        
        <form @submit.prevent="submit" class="auth-form">
          <div class="input-group">
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="Email" 
              required
              autocomplete="email"
            >
          </div>
          
          <div class="input-group">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Пароль" 
              required
              autocomplete="current-password"
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

          <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? '' : 'Войти' }}
          </button>
        </form>

        <p class="auth-footer">
          Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)

async function submit() {
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    router.push('/')
  } catch (err) {
    notifications.error(err.message)
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
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}

.bg-gradient-1 {
  width: 600px;
  height: 600px;
  background: rgba(255, 255, 255, 0.03);
  top: -200px;
  right: -100px;
  opacity: 1;
}

.bg-gradient-2 {
  width: 500px;
  height: 500px;
  background: rgba(255, 255, 255, 0.02);
  bottom: -150px;
  left: -100px;
  opacity: 1;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  position: relative;
  z-index: 1;
}

.auth-card {
  width: 100%;
  padding: 40px;
  animation: slideUp var(--transition-slow) 0.1s both;
}

.auth-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
}

.input-group input {
  padding-right: 48px;
}

.input-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  padding: 4px;
  transition: color var(--transition);
}

.input-toggle:hover {
  color: var(--text-secondary);
}

.input-toggle svg {
  width: 20px;
  height: 20px;
}

.btn-block {
  width: 100%;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-footer a {
  color: var(--text-primary);
  font-weight: 500;
  transition: color var(--transition);
}

.auth-footer a:hover {
  color: rgba(255, 255, 255, 0.7);
}
</style>
