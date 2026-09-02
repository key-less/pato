import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-letters'

export function createLocalStorageLetterRepository() {
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
    async save(letter) {
      const items = load()
      const index = items.findIndex((l) => l.id === letter.id)
      persist(index >= 0 ? items.map((l, i) => (i === index ? letter : l)) : [...items, letter])
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
