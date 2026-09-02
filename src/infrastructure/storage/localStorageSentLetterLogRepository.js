import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-sent-letters'

export function createLocalStorageSentLetterLogRepository() {
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
      return [...load()].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    },
    async save(log) {
      persist([...load(), log])
    },
    async remove(id) {
      persist(load().filter((l) => l.id !== id))
    },

    /** Reemplaza la coleccion entera. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(items) {
      persist([...items])
    },
  }
}
