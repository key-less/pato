const STORAGE_KEY = 'pato-media'

export function createLocalStorageMediaRepository() {
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
      return load()
    },
    async save(media) {
      const items = load()
      const idx = items.findIndex((m) => m.id === media.id)
      if (idx >= 0) items[idx] = media
      else items.push(media)
      save(items)
    },
    async remove(id) {
      const items = load().filter((m) => m.id !== id)
      save(items)
    },
  }
}
