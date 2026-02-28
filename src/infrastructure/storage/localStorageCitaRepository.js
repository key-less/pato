const STORAGE_KEY = 'pato-citas'

export function createLocalStorageCitaRepository() {
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
    async save(cita) {
      const items = load()
      const idx = items.findIndex((c) => c.id === cita.id)
      if (idx >= 0) items[idx] = cita
      else items.push(cita)
      save(items)
    },
    async remove(id) {
      save(load().filter((c) => c.id !== id))
    },
  }
}
