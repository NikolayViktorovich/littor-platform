import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000
})

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || 'Произошла ошибка'
    return Promise.reject(new Error(message))
  }
)

export default api
