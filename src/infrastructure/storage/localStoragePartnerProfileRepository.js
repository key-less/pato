import { createPartnerProfileRepository } from '../../domain/repositories/PartnerProfileRepository.js'
const STORAGE_KEY = 'pato-partner-profiles'

export function createLocalStoragePartnerProfileRepository() {
  let cache = null

  function load() {
    if (cache !== null) return cache
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      cache = raw ? JSON.parse(raw) : [null, null]
    } catch {
      cache = [null, null]
    }
    return cache
  }

  function persist(profiles) {
    const list = Array.isArray(profiles) && profiles.length >= 2
      ? [profiles[0] ?? null, profiles[1] ?? null]
      : load()
    cache = list
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  return createPartnerProfileRepository({
    async getAll() {
      return load()
    },
    async save(profile, index) {
      const list = load()
      list[index] = profile
      persist(list)
    },
  })
}
