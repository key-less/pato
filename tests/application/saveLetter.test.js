import { describe, it, expect } from 'vitest'
import { saveLetter } from '../../src/application/useCases/saveLetter.js'

function repoConCartas(iniciales = []) {
  let cartas = [...iniciales]
  return {
    async getAll() { return [...cartas] },
    async save(letter) {
      const i = cartas.findIndex((c) => c.id === letter.id)
      if (i >= 0) cartas[i] = letter
      else cartas.push(letter)
    },
    actuales: () => cartas,
  }
}

describe('saveLetter', () => {
  it('crea una carta con fecha de creacion', async () => {
    const repo = repoConCartas()

    const carta = await saveLetter(repo)({ subject: 'Hola', body: 'Te quiero' })

    expect(carta.subject).toBe('Hola')
    expect(carta.createdAt).toMatch(/^\d{4}-/)
    expect(repo.actuales()).toHaveLength(1)
  })

  it('conserva la fecha de creacion al editar', async () => {
    const repo = repoConCartas([
      { id: 'l1', subject: 'Original', body: 'x', createdAt: '2024-03-01T10:00:00.000Z', unlocksAt: null },
    ])

    const carta = await saveLetter(repo)({ id: 'l1', subject: 'Corregida', body: 'y' })

    expect(carta.createdAt).toBe('2024-03-01T10:00:00.000Z')
    expect(carta.subject).toBe('Corregida')
  })

  it('guarda la fecha en que se abre', async () => {
    const repo = repoConCartas()

    const carta = await saveLetter(repo)({ subject: 'Para febrero', body: '…', unlocksAt: '2027-02-14' })

    expect(carta.unlocksAt).toBe('2027-02-14')
  })

  it('quitar la fecha desella la carta', async () => {
    const repo = repoConCartas([
      { id: 'l1', subject: 'Sellada', body: 'x', createdAt: '2024-03-01T10:00:00.000Z', unlocksAt: '2027-02-14' },
    ])

    const carta = await saveLetter(repo)({ id: 'l1', subject: 'Sellada', body: 'x', unlocksAt: '' })

    expect(carta.unlocksAt).toBeNull()
  })

  it('no consulta el repositorio cuando la carta es nueva', async () => {
    let lecturas = 0
    const repo = { ...repoConCartas() }
    const original = repo.getAll
    repo.getAll = async () => { lecturas += 1; return original() }

    await saveLetter(repo)({ subject: 'Nueva', body: '…' })

    expect(lecturas).toBe(0)
  })
})
