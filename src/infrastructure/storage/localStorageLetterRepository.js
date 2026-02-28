const STORAGE_KEY = 'pato-letters'

export function createLocalStorageLetterRepository() {
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
    async save(letter) {
      const items = load()
      const idx = items.findIndex((l) => l.id === letter.id)
      if (idx >= 0) items[idx] = letter
      else items.push(letter)
      save(items)
    },
    async remove(id) {
      const items = load().filter((l) => l.id !== id)
      save(items)
    },
  }
}
