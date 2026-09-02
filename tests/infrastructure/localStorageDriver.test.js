import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readJson, writeJson } from '../../src/infrastructure/storage/localStorageDriver.js'
import { onStorageFailure } from '../../src/infrastructure/storage/storageAlerts.js'
import { StorageQuotaError, StorageWriteError } from '../../src/domain/errors/StorageError.js'

describe('localStorageDriver', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('devuelve el valor por defecto cuando la clave no existe', () => {
    expect(readJson('ausente', [])).toEqual([])
  })

  it('devuelve el valor por defecto cuando el contenido no es JSON válido', () => {
    localStorage.setItem('roto', '{no es json')
    expect(readJson('roto', [])).toEqual([])
  })

  it('hace round-trip de un valor escrito', () => {
    writeJson('citas', [{ id: 'c1' }])
    expect(readJson('citas', [])).toEqual([{ id: 'c1' }])
  })

  it('lanza StorageQuotaError cuando el navegador rechaza por cupo', () => {
    const quota = new Error('full')
    quota.name = 'QuotaExceededError'
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota })

    expect(() => writeJson('media', [1])).toThrow(StorageQuotaError)
  })

  it('reconoce el cupo agotado por el código legacy 22 de Safari', () => {
    const quota = new Error('full')
    quota.code = 22
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota })

    expect(() => writeJson('media', [1])).toThrow(StorageQuotaError)
  })

  it('lanza StorageWriteError ante un fallo que no es de cupo', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denegado') })

    expect(() => writeJson('media', [1])).toThrow(StorageWriteError)
  })

  it('avisa a los suscriptores cuando una escritura falla', () => {
    const quota = new Error('full')
    quota.name = 'QuotaExceededError'
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw quota })

    const seen = []
    const unsubscribe = onStorageFailure((error) => seen.push(error))

    expect(() => writeJson('media', [1])).toThrow()
    expect(seen).toHaveLength(1)
    expect(seen[0]).toBeInstanceOf(StorageQuotaError)
    expect(seen[0].key).toBe('media')

    unsubscribe()
  })

  it('deja de avisar tras cancelar la suscripción', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('x') })
    const seen = []
    const unsubscribe = onStorageFailure((error) => seen.push(error))
    unsubscribe()

    expect(() => writeJson('media', [1])).toThrow()
    expect(seen).toHaveLength(0)
  })
})
