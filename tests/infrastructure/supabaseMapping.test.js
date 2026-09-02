import { describe, it, expect } from 'vitest'
import { rowToEntity, entityToRow, toSnake } from '../../src/infrastructure/supabase/mapping.js'

describe('mapping entre Postgres y el dominio', () => {
  it('convierte camelCase a snake_case', () => {
    expect(toSnake('horaEncuentro')).toBe('hora_encuentro')
    expect(toSnake('loQueMasLeEncantaDelOtro')).toBe('lo_que_mas_le_encanta_del_otro')
    expect(toSnake('url')).toBe('url')
  })

  it('lleva una fila al dominio sin arrastrar couple_id', () => {
    const entity = rowToEntity(
      { id: 'c1', couple_id: 'pareja-1', date: '2024-05-05', hora_encuentro: '19:00', note: 'Parque' },
      ['date', 'horaEncuentro', 'note']
    )

    expect(entity).toEqual({ id: 'c1', date: '2024-05-05', horaEncuentro: '19:00', note: 'Parque' })
    expect(entity.couple_id).toBeUndefined()
  })

  it('devuelve null para los campos que la fila no trae', () => {
    expect(rowToEntity({ id: 'c1' }, ['note']).note).toBeNull()
  })

  it('escribe siempre el couple_id', () => {
    const row = entityToRow({ id: 'c1', note: 'Parque' }, ['note'], 'pareja-1')

    expect(row.couple_id).toBe('pareja-1')
    expect(row.id).toBe('c1')
  })

  it('ignora claves que no estan declaradas', () => {
    const row = entityToRow({ id: 'c1', note: 'ok', inventado: 'x' }, ['note'], 'pareja-1')

    expect(row.inventado).toBeUndefined()
    expect(Object.keys(row).sort()).toEqual(['couple_id', 'id', 'note'])
  })

  it('omite los campos ausentes en vez de mandar undefined', () => {
    const row = entityToRow({ id: 'c1' }, ['note', 'lugar'], 'pareja-1')

    expect('note' in row).toBe(false)
    expect('lugar' in row).toBe(false)
  })
})
