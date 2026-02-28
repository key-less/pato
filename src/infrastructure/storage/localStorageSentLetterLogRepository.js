const STORAGE_KEY = 'pato-sent-letters'

export function createLocalStorageSentLetterLogRepository() {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  return {
    async getAll() {
      return load().sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    },
    async save(log) {
      const items = load()
      items.push(log)
      save(items)
    },
    async remove(id) {
      save(load().filter((l) => l.id !== id))
    },
  }
}
