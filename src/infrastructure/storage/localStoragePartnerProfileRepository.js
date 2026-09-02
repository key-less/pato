import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-partner-profiles'

/** Siempre dos posiciones: índice 0 = uno, índice 1 = el otro. */
function normalize(profiles) {
  const list = Array.isArray(profiles) ? profiles : []
  return [list[0] ?? null, list[1] ?? null]
}

export function createLocalStoragePartnerProfileRepository() {
  let cache = null

  function load() {
    if (cache === null) cache = normalize(readJson(STORAGE_KEY, null))
    return cache
  }

  function persist(profiles) {
    const list = normalize(profiles)
    writeJson(STORAGE_KEY, list)
    cache = list
  }

  return {
    async getAll() {
      return [...load()]
    },
    async save(profile, index) {
      const list = load()
      persist(list.map((p, i) => (i === index ? profile : p)))
    },

    /** Reemplaza ambos perfiles. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(profiles) {
      persist(profiles)
    },
  }
}
