import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000
})

api.interceptors.response.use(
  response => response,
  error => {
    // Preserve original error structure for proper handling in components
    return Promise.reject(error)
  }
)

export default api
