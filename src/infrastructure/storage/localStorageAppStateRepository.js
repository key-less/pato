import { readJson, writeJson } from './localStorageDriver.js'

const STORAGE_KEY = 'pato-app-state'

export function createLocalStorageAppStateRepository() {
  return {
    async get() {
      return readJson(STORAGE_KEY, null)
    },
    async save(state) {
      writeJson(STORAGE_KEY, state)
    },
  }
}
