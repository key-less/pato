const KEY = 'pato_activity_events'

export function createLocalStorageActivityEventRepository() {
  const getAll = async () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  }

  const save = async (event) => {
    const all = await getAll()
    const idx = all.findIndex((e) => e.id === event.id)
    if (idx >= 0) all[idx] = event
    else all.push(event)
    localStorage.setItem(KEY, JSON.stringify(all))
  }

  const remove = async (id) => {
    const all = await getAll()
    localStorage.setItem(KEY, JSON.stringify(all.filter((e) => e.id !== id)))
  }

  return { getAll, save, remove }
}
