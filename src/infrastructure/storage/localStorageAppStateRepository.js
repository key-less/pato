const STORAGE_KEY = 'pato-app-state'

export function createLocalStorageAppStateRepository() {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return {
    async get() {
      return load()
    },
    async save(state) {
      save(state)
    },
  }
}
