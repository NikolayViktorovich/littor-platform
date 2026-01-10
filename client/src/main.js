import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/main.css'
import { initSocket } from './socket'

const savedFontSize = localStorage.getItem('fontSize')
if (savedFontSize) {
  const sizes = { small: '14px', medium: '16px', large: '18px' }
  const size = sizes[savedFontSize] || '16px'
  document.documentElement.style.setProperty('--base-font-size', size)
  document.documentElement.style.fontSize = size
}

const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  let actualTheme = savedTheme
  if (savedTheme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.setAttribute('data-theme', actualTheme)
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

initSocket()
