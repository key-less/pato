import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-playlists'

export function createLocalStoragePlaylistRepository() {
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
    async save(playlist) {
      const items = load()
      const index = items.findIndex((p) => p.id === playlist.id)
      persist(index >= 0 ? items.map((p, i) => (i === index ? playlist : p)) : [...items, playlist])
    },
    async remove(id) {
      persist(load().filter((p) => p.id !== id))
    },

    /** Reemplaza la coleccion entera. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(items) {
      persist([...items])
    },
  }
}
