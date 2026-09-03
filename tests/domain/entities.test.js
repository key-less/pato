import { describe, it, expect } from 'vitest'
import { createActivityEvent } from '../../src/domain/entities/ActivityEvent.js'
import { createMedia } from '../../src/domain/entities/Media.js'
import { createLetter } from '../../src/domain/entities/Letter.js'
import { createCita } from '../../src/domain/entities/Cita.js'
import { createAppState } from '../../src/domain/entities/AppState.js'

describe('createActivityEvent', () => {
  it('genera id y createdAt cuando no se le dan', () => {
    const evt = createActivityEvent({ type: 'cita_added', description: 'Añadió una cita' })
    expect(evt.id).toMatch(/^evt-/)
    expect(() => new Date(evt.createdAt).toISOString()).not.toThrow()
  })

  it('respeta el id y la fecha que se le pasan', () => {
    const evt = createActivityEvent({ id: 'evt-fijo', createdAt: '2026-01-01T00:00:00.000Z' })
    expect(evt.id).toBe('evt-fijo')
    expect(evt.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('atribuye al perfil 0 por defecto (no hay login)', () => {
    expect(createActivityEvent({}).profileIndex).toBe(0)
    expect(createActivityEvent({ profileIndex: 1 }).profileIndex).toBe(1)
  })

  it('se puede construir sin argumentos', () => {
    expect(() => createActivityEvent()).not.toThrow()
    expect(createActivityEvent().type).toBe('generic')
  })

  it('genera ids distintos en llamadas consecutivas', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createActivityEvent({}).id))
    expect(ids.size).toBe(50)
  })
})

describe('createMedia', () => {
  it('no aparece en la portada salvo que se pida', () => {
    expect(createMedia({ id: 'm1', type: 'photo', src: 'data:,' }).showOnLanding).toBe(false)
    expect(createMedia({ id: 'm1', type: 'photo', src: 'data:,', showOnLanding: true }).showOnLanding).toBe(true)
  })

  it('normaliza los campos opcionales ausentes', () => {
    const media = createMedia({ id: 'm1', type: 'video', src: 'data:,' })
    expect(media.thumbnail).toBeNull()
    expect(media.date).toBeNull()
    expect(media.caption).toBe('')
  })
})

describe('createLetter y createCita', () => {
  it('la carta recibe createdAt automático', () => {
    expect(createLetter({ id: 'l1' }).createdAt).toBeTypeOf('string')
  })

  it('la cita convierte los campos ausentes en cadena vacía, nunca undefined', () => {
    const cita = createCita({ id: 'c1', date: '2026-05-01' })
    expect(cita.note).toBe('')
    expect(cita.lugar).toBe('')
    expect(cita.horaEncuentro).toBe('')
  })
})

describe('createAppState', () => {
  it('arranca sin citas y sin estados', () => {
    const state = createAppState({ metSince: '2024-01-01' })
    expect(state.datesCount).toBe(0)
    expect(state.relationshipStatuses).toEqual([])
  })
})
