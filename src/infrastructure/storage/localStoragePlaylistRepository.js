const STORAGE_KEY = 'pato-playlists'

export function createLocalStoragePlaylistRepository() {
  let cache = null

  function load() {
    if (cache !== null) return cache
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      cache = raw ? JSON.parse(raw) : []
    } catch {
      cache = []
    }
    return cache
  }

  function persist(items) {
    cache = items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  return {
    async getAll() {
      return load()
    },
    async save(playlist) {
      const items = load()
      const idx = items.findIndex((p) => p.id === playlist.id)
      if (idx >= 0) items[idx] = playlist
      else items.push(playlist)
      persist(items)
    },
    async remove(id) {
      persist(load().filter((p) => p.id !== id))
    },
  }
}
