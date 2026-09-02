import { StorageWriteError } from '../../domain/errors/StorageError.js'
import { emitStorageFailure } from '../storage/storageAlerts.js'

const toSnake = (key) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
const toCamel = (key) => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

/** Fila de Postgres -> entidad del dominio, sin arrastrar couple_id a la app. */
export function rowToEntity(row, fields) {
  const entity = { id: row.id }
  for (const field of fields) entity[field] = row[toSnake(field)] ?? null
  return entity
}

/** Entidad -> fila. Solo los campos declarados: una clave desconocida rompe el insert. */
export function entityToRow(entity, fields, coupleId) {
  const row = { couple_id: coupleId }
  if (entity.id !== undefined) row.id = entity.id
  for (const field of fields) {
    if (entity[field] !== undefined) row[toSnake(field)] = entity[field]
  }
  return row
}

export { toSnake, toCamel }

/**
 * Un fallo de red o de permisos se trata igual que un fallo de disco: se avisa por
 * el mismo canal, para que el usuario nunca crea que se guardo algo que no se guardo.
 */
export function reportRemoteFailure(table, cause) {
  const error = new StorageWriteError(table, cause)
  error.message = cause?.message ?? `No se pudo sincronizar «${table}».`
  emitStorageFailure(error)
  return error
}

export function unwrap(table, { data, error }) {
  if (error) throw reportRemoteFailure(table, error)
  return data
}
