import { StorageQuotaError, StorageWriteError } from '../../domain/errors/StorageError.js'
import { emitStorageFailure } from './storageAlerts.js'

const QUOTA_ERROR_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])
const QUOTA_LEGACY_CODES = new Set([22, 1014])

function isQuotaError(error) {
  if (!error) return false
  return QUOTA_ERROR_NAMES.has(error.name) || QUOTA_LEGACY_CODES.has(error.code)
}

/** Lee y parsea. Una lectura rota devuelve el valor por defecto, nunca lanza. */
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

/** Escribe o lanza. El fallo se emite además por storageAlerts para que la UI lo vea. */
export function writeJson(key, value) {
  let payload
  try {
    payload = JSON.stringify(value)
  } catch (cause) {
    const error = new StorageWriteError(key, cause)
    emitStorageFailure(error)
    throw error
  }

  try {
    localStorage.setItem(key, payload)
  } catch (cause) {
    const error = isQuotaError(cause)
      ? new StorageQuotaError(key, cause)
      : new StorageWriteError(key, cause)
    emitStorageFailure(error)
    throw error
  }
}

export function removeKey(key) {
  localStorage.removeItem(key)
}
