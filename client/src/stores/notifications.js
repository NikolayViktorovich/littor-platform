import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  let id = 0

  function add(message, type = 'info', options = {}) {
    const notification = { 
      id: ++id, 
      message, 
      type,
      avatar: options.avatar || null,
      name: options.name || null
    }
    items.value.push(notification)
    setTimeout(() => remove(notification.id), 4000)
  }

  function remove(notificationId) {
    items.value = items.value.filter(n => n.id !== notificationId)
  }

  function success(message, options = {}) {
    add(message, 'success', options)
  }

  function error(message, options = {}) {
    add(message, 'error', options)
  }

  function friendRequest(user) {
    add(`${user.name} хочет добавить вас в друзья`, 'friend', { 
      avatar: user.avatar, 
      name: user.name 
    })
  }

  return { items, add, remove, success, error, friendRequest }
})
