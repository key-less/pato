import { describe, it, expect } from 'vitest'
import { defineRepository } from '../../src/domain/repositories/defineRepository.js'
import { createMediaRepository } from '../../src/domain/repositories/MediaRepository.js'
import { createAppStateRepository } from '../../src/domain/repositories/AppStateRepository.js'
import { createPartnerProfileRepository } from '../../src/domain/repositories/PartnerProfileRepository.js'

describe('defineRepository', () => {
  const createThing = defineRepository('ThingRepository', ['getAll', 'save'])

  it('devuelve la implementación cuando cumple el contrato', () => {
    const impl = { getAll: async () => [], save: async () => {} }
    expect(createThing(impl)).toBe(impl)
  })

  it('deja pasar métodos extra: el contrato es un mínimo, no un máximo', () => {
    const impl = { getAll: async () => [], save: async () => {}, vaciar: async () => {} }
    expect(createThing(impl).vaciar).toBeTypeOf('function')
  })

  it('rechaza una implementación a la que le falta un método, y dice cuál', () => {
    expect(() => createThing({ getAll: async () => [] })).toThrow(/falta implementar save/)
  })

  it('nombra todos los métodos que faltan, no solo el primero', () => {
    expect(() => createThing({})).toThrow(/getAll, save/)
  })

  it('rechaza una propiedad que existe pero no es función', () => {
    expect(() => createThing({ getAll: [], save: async () => {} })).toThrow(/falta implementar getAll/)
  })

  it('incluye el nombre del contrato en el error, para saber cuál falló', () => {
    expect(() => createThing({})).toThrow(/^ThingRepository:/)
  })

  it('rechaza null y valores que no son objeto', () => {
    expect(() => createThing(null)).toThrow(/se recibió null/)
    expect(() => createThing(undefined)).toThrow(/se recibió undefined/)
    expect(() => createThing('repo')).toThrow(/se recibió string/)
  })
})

describe('contratos concretos', () => {
  it('MediaRepository exige getAll, save y remove', () => {
    expect(() => createMediaRepository({ getAll: async () => [], save: async () => {} }))
      .toThrow(/falta implementar remove/)
  })

  it('AppStateRepository exige get (no getAll): guarda un objeto, no una colección', () => {
    expect(() => createAppStateRepository({ getAll: async () => [], save: async () => {} }))
      .toThrow(/falta implementar get/)
  })

  it('PartnerProfileRepository no exige remove: los perfiles se vacían guardando null', () => {
    const impl = { getAll: async () => [null, null], save: async () => {} }
    expect(() => createPartnerProfileRepository(impl)).not.toThrow()
  })
})
