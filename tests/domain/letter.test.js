import { describe, it, expect } from 'vitest'
import { createLetter, estaSellada, fechaLocal } from '../../src/domain/entities/Letter.js'

describe('fechaLocal', () => {
  it('usa el calendario de quien mira, no el UTC', () => {
    // 14 de febrero a las 23:00 en una zona al oeste: en UTC ya es dia 15.
    const nocheDel14 = new Date(2026, 1, 14, 23, 0, 0)

    expect(fechaLocal(nocheDel14)).toBe('2026-02-14')
  })

  it('rellena mes y dia con cero', () => {
    expect(fechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('estaSellada', () => {
  const hoy = new Date(2026, 1, 14, 12, 0, 0)

  it('una carta sin fecha nunca esta sellada', () => {
    expect(estaSellada(createLetter({ id: 'l1' }), hoy)).toBe(false)
  })

  it('una carta para manana esta sellada', () => {
    expect(estaSellada(createLetter({ id: 'l1', unlocksAt: '2026-02-15' }), hoy)).toBe(true)
  })

  it('una carta para hoy ya se abre', () => {
    expect(estaSellada(createLetter({ id: 'l1', unlocksAt: '2026-02-14' }), hoy)).toBe(false)
  })

  it('una carta cuya fecha ya paso se abre', () => {
    expect(estaSellada(createLetter({ id: 'l1', unlocksAt: '2025-12-25' }), hoy)).toBe(false)
  })

  it('se abre en cuanto empieza el dia, no a mediodia', () => {
    const pasadaMedianoche = new Date(2026, 1, 14, 0, 1, 0)

    expect(estaSellada(createLetter({ id: 'l1', unlocksAt: '2026-02-14' }), pasadaMedianoche)).toBe(false)
  })

  it('trata la cadena vacia como sin fecha', () => {
    expect(createLetter({ id: 'l1', unlocksAt: '' }).unlocksAt).toBeNull()
    expect(estaSellada({ id: 'l1', unlocksAt: '' }, hoy)).toBe(false)
  })

  it('no rompe con una carta ausente', () => {
    expect(estaSellada(null, hoy)).toBe(false)
    expect(estaSellada(undefined, hoy)).toBe(false)
  })
})
