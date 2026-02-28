const STORAGE_KEY = 'pato-playlists'

export function createLocalStoragePlaylistRepository() {
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
    async save(playlist) {
      const items = load()
      const idx = items.findIndex((p) => p.id === playlist.id)
      if (idx >= 0) items[idx] = playlist
      else items.push(playlist)
      save(items)
    },
    async remove(id) {
      save(load().filter((p) => p.id !== id))
    },
  }
}
