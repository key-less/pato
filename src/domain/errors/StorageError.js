/**
 * Errores de persistencia que la infraestructura lanza y la presentación traduce.
 * Existen para que un guardado fallido nunca se confunda con uno correcto.
 */

export class StorageWriteError extends Error {
  constructor(key, cause) {
    super(`No se pudo escribir la clave «${key}».`)
    this.name = 'StorageWriteError'
    this.key = key
    this.cause = cause
  }
}

export class StorageQuotaError extends StorageWriteError {
  constructor(key, cause) {
    super(key, cause)
    this.name = 'StorageQuotaError'
    this.message = `Sin espacio de almacenamiento al escribir «${key}».`
  }
}

export function isStorageError(error) {
  return error instanceof StorageWriteError
}
