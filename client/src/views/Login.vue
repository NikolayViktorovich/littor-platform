<template>
  <div class="auth-page">
    <!-- Background decoration -->
    <div class="auth-bg">
      <div class="bg-gradient bg-gradient-1"></div>
      <div class="bg-gradient bg-gradient-2"></div>
      <div class="bg-lines"></div>
    </div>

    <div class="auth-container">
      <!-- Logo -->
      <div class="auth-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>

      <!-- Card -->
      <div class="auth-card glass">
        <h1 class="auth-title">Sign in to Littor</h1>
        
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
              placeholder="Password" 
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
            {{ loading ? '' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <router-link to="/register">Sign up</router-link>
        </p>
      </div>

      <!-- Social proof -->
      <div class="social-proof">
        <p>Join over <strong>2M</strong> global social media users</p>
        <div class="avatars-stack">
          <div class="avatar-placeholder"></div>
          <div class="avatar-placeholder"></div>
          <div class="avatar-placeholder"></div>
          <div class="avatar-placeholder"></div>
          <div class="avatar-placeholder"></div>
        </div>
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
  filter: blur(100px);
  opacity: 0.4;
}

.bg-gradient-1 {
  width: 600px;
  height: 600px;
  background: var(--accent);
  top: -200px;
  right: -100px;
  opacity: 0.15;
}

.bg-gradient-2 {
  width: 500px;
  height: 500px;
  background: #8b5cf6;
  bottom: -150px;
  left: -100px;
  opacity: 0.1;
}

.bg-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(var(--glass-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--glass-border) 1px, transparent 1px);
  background-size: 100px 100px;
  opacity: 0.3;
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

.auth-logo {
  animation: slideUp var(--transition-slow);
}

.logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px var(--accent-glow);
}

.logo-icon svg {
  width: 28px;
  height: 28px;
  color: white;
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
  color: var(--accent);
}

.social-proof {
  text-align: center;
  animation: slideUp var(--transition-slow) 0.2s both;
}

.social-proof p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.social-proof strong {
  color: var(--accent);
}

.avatars-stack {
  display: flex;
  justify-content: center;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--glass-bg-hover), var(--glass-bg-active));
  border: 2px solid var(--bg-primary);
  margin-left: -10px;
}

.avatar-placeholder:first-child {
  margin-left: 0;
}
</style>
