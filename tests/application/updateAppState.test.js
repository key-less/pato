import { describe, it, expect } from 'vitest'
import { updateAppState } from '../../src/application/useCases/updateAppState.js'

function fakeAppStateRepo(initial) {
  let state = initial
  return {
    async get() { return state },
    async save(next) { state = next },
    current: () => state,
  }
}

describe('updateAppState', () => {
  it('persiste los estados de relación que llegan en el parcial', async () => {
    const repo = fakeAppStateRepo({
      metSince: '2024-01-01',
      relationshipStatuses: [{ id: 'conociendose', label: 'Conociéndonos', order: 1 }],
    })

    const next = await updateAppState(repo)({
      relationshipStatuses: [
        { id: 'conociendose', label: 'Conociéndonos', order: 1 },
        { id: 'custom_mejor_amigues', label: 'Mejor amigues', order: 2 },
      ],
    })

    expect(next.relationshipStatuses).toHaveLength(2)
    expect(repo.current().relationshipStatuses).toHaveLength(2)
  })

  it('conserva los estados existentes cuando el parcial no los menciona', async () => {
    const repo = fakeAppStateRepo({
      metSince: '2024-01-01',
      relationshipStatuses: [{ id: 'conociendose', label: 'Conociéndonos', order: 1 }],
    })

    const next = await updateAppState(repo)({ metSince: '2023-06-15' })

    expect(next.metSince).toBe('2023-06-15')
    expect(next.relationshipStatuses).toHaveLength(1)
  })

  it('no rompe cuando todavía no hay estado guardado', async () => {
    const repo = fakeAppStateRepo(null)

    const next = await updateAppState(repo)({ metSince: '2024-02-02' })

    expect(next.metSince).toBe('2024-02-02')
    expect(next.relationshipStatuses).toEqual([])
  })
})
