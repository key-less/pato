import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-citas'

/**
 * La caché solo se actualiza después de que la escritura confirma.
 * Si el disco rechaza, memoria y disco siguen coincidiendo.
 */
export function createLocalStorageCitaRepository() {
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
    async save(cita) {
      const items = load()
      const index = items.findIndex((c) => c.id === cita.id)
      persist(index >= 0 ? items.map((c, i) => (i === index ? cita : c)) : [...items, cita])
    },
    async remove(id) {
      persist(load().filter((c) => c.id !== id))
    },

    /** Reemplaza la coleccion entera. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(items) {
      persist([...items])
    },
  }
}
