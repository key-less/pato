import { createCitaRepository } from '../../domain/repositories/CitaRepository.js'
const STORAGE_KEY = 'pato-citas'

export function createLocalStorageCitaRepository() {
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

  return createCitaRepository({
    async getAll() {
      return load()
    },
    async save(cita) {
      const items = load()
      const idx = items.findIndex((c) => c.id === cita.id)
      if (idx >= 0) items[idx] = cita
      else items.push(cita)
      persist(items)
    },
    async remove(id) {
      persist(load().filter((c) => c.id !== id))
    },
  })
}
