<template>
  <Teleport to="body">
    <div class="notifications">
      <TransitionGroup name="notification">
        <div 
          v-for="item in store.items" 
          :key="item.id" 
          class="notification glass"
          :class="item.type"
          @click="store.remove(item.id)"
        >
          <div class="notification-icon">
            <svg v-if="item.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span class="notification-text">{{ item.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications'

const store = useNotificationsStore()
</script>

<style scoped>
.notifications {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  min-width: 280px;
  max-width: 400px;
  cursor: pointer;
  pointer-events: auto;
  transition: all var(--transition);
}

.notification:hover {
  transform: translateX(-4px);
}

.notification-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.notification-icon svg {
  width: 24px;
  height: 24px;
}

.notification.success .notification-icon {
  color: var(--success);
}

.notification.error .notification-icon {
  color: var(--danger);
}

.notification-text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.notification-enter-active {
  animation: slideIn var(--transition-slow);
}

.notification-leave-active {
  animation: slideOut var(--transition);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (max-width: 480px) {
  .notifications {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
  
  .notification {
    min-width: auto;
    max-width: none;
  }
}
</style>
