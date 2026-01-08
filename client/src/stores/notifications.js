import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  let id = 0

  function add(message, type = 'info') {
    const notification = { id: ++id, message, type }
    items.value.push(notification)
    setTimeout(() => remove(notification.id), 4000)
  }

  function remove(notificationId) {
    items.value = items.value.filter(n => n.id !== notificationId)
  }

  function success(message) {
    add(message, 'success')
  }

  function error(message) {
    add(message, 'error')
  }

  return { items, add, remove, success, error }
})
