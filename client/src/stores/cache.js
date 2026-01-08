import { reactive } from 'vue'

export const cache = reactive({
  feed: { posts: [], page: 1, hasMore: true, loaded: false },
  messages: { dialogs: [], loaded: false },
  friends: { friends: [], incoming: [], outgoing: [], loaded: false },
  profiles: {}
})

export function clearCache() {
  cache.feed = { posts: [], page: 1, hasMore: true, loaded: false }
  cache.messages = { dialogs: [], loaded: false }
  cache.friends = { friends: [], incoming: [], outgoing: [], loaded: false }
  cache.profiles = {}
}
