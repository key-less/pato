import { createActivityEventRepository } from '../../domain/repositories/ActivityEventRepository.js'
const KEY = 'pato_activity_events'

export function createLocalStorageActivityEventRepository() {
  let cache = null

  const load = () => {
    if (cache !== null) return cache
    try {
      cache = JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      cache = []
    }
    return cache
  }

  const persist = (items) => {
    cache = items
    localStorage.setItem(KEY, JSON.stringify(items))
  }

  const getAll = async () => load()

  const save = async (event) => {
    const all = load()
    const idx = all.findIndex((e) => e.id === event.id)
    if (idx >= 0) all[idx] = event
    else all.push(event)
    persist(all)
  }

  const remove = async (id) => {
    persist(load().filter((e) => e.id !== id))
  }

  return createActivityEventRepository({ getAll, save, remove })
}
