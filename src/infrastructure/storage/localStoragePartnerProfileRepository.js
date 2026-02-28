const STORAGE_KEY = 'pato-partner-profiles'

export function createLocalStoragePartnerProfileRepository() {
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : [null, null]
    } catch {
      return [null, null]
    }
  }

  function save(profiles) {
    const list = Array.isArray(profiles) && profiles.length >= 2
      ? [profiles[0] ?? null, profiles[1] ?? null]
      : load()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  return {
    async getAll() {
      return load()
    },
    async save(profile, index) {
      const list = load()
      list[index] = profile
      save(list)
    },
  }
}
