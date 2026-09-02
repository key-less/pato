import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato_activity_events'

export function createLocalStorageActivityEventRepository() {
  let cache = null

  function load() {
    if (cache === null) cache = readJson(STORAGE_KEY, [])
    return cache
  }

  function persist(items) {
    writeJson(STORAGE_KEY, items)
    cache = items
  }

  return {
    async getAll() {
      return [...load()]
    },
    async save(event) {
      const items = load()
      const index = items.findIndex((e) => e.id === event.id)
      persist(index >= 0 ? items.map((e, i) => (i === index ? event : e)) : [...items, event])
    },
    async remove(id) {
      persist(load().filter((e) => e.id !== id))
    },

    /** Reemplaza la coleccion entera. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(items) {
      persist([...items])
    },
  }
}
