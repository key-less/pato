import { describe, it, expect, vi, afterEach } from 'vitest'
import { createLocalStorageMediaRepository } from '../../src/infrastructure/storage/localStorageMediaRepository.js'
import { createLocalStorageCitaRepository } from '../../src/infrastructure/storage/localStorageCitaRepository.js'
import { createLocalStorageAppStateRepository } from '../../src/infrastructure/storage/localStorageAppStateRepository.js'
import { createLocalStorageLetterRepository } from '../../src/infrastructure/storage/localStorageLetterRepository.js'
import { createLocalStoragePlaylistRepository } from '../../src/infrastructure/storage/localStoragePlaylistRepository.js'
import { createLocalStorageActivityEventRepository } from '../../src/infrastructure/storage/localStorageActivityEventRepository.js'
import { createLocalStorageSentLetterLogRepository } from '../../src/infrastructure/storage/localStorageSentLetterLogRepository.js'
import { createLocalStoragePartnerProfileRepository } from '../../src/infrastructure/storage/localStoragePartnerProfileRepository.js'

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Los siete repositorios de colección comparten contrato y comportamiento, así que se
 * prueban con la misma batería. Si uno se desvía, falla aquí.
 */
const collectionRepos = [
  ['media', createLocalStorageMediaRepository, 'pato-media'],
  ['citas', createLocalStorageCitaRepository, 'pato-citas'],
  ['cartas', createLocalStorageLetterRepository, 'pato-letters'],
  ['playlists', createLocalStoragePlaylistRepository, 'pato-playlists'],
  ['eventos', createLocalStorageActivityEventRepository, 'pato_activity_events'],
]

describe.each(collectionRepos)('repositorio de %s', (_name, create, storageKey) => {
  it('empieza vacío', async () => {
    expect(await create().getAll()).toEqual([])
  })

  it('guarda y recupera una entidad', async () => {
    const repo = create()
    await repo.save({ id: 'x1', valor: 1 })
    expect(await repo.getAll()).toEqual([{ id: 'x1', valor: 1 }])
  })

  it('actualiza por id en lugar de duplicar', async () => {
    const repo = create()
    await repo.save({ id: 'x1', valor: 1 })
    await repo.save({ id: 'x1', valor: 2 })
    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].valor).toBe(2)
  })

  it('elimina por id sin tocar el resto', async () => {
    const repo = create()
    await repo.save({ id: 'x1' })
    await repo.save({ id: 'x2' })
    await repo.remove('x1')
    expect((await repo.getAll()).map((e) => e.id)).toEqual(['x2'])
  })

  it('persiste en localStorage bajo su propia clave', async () => {
    await create().save({ id: 'x1' })
    expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([{ id: 'x1' }])
  })

  it('una instancia nueva lee lo que dejó la anterior', async () => {
    await create().save({ id: 'x1' })
    expect(await create().getAll()).toHaveLength(1)
  })

  it('devuelve una lista vacía si el contenido guardado está corrupto', async () => {
    localStorage.setItem(storageKey, 'esto no es json')
    expect(await create().getAll()).toEqual([])
  })
})

describe('repositorio de estado de la app', () => {
  it('devuelve null cuando no hay nada guardado', async () => {
    expect(await createLocalStorageAppStateRepository().get()).toBeNull()
  })

  it('guarda y recupera el estado completo', async () => {
    const repo = createLocalStorageAppStateRepository()
    await repo.save({ metSince: '2020-01-01', datesCount: 5 })
    expect((await repo.get()).datesCount).toBe(5)
  })

  it('devuelve null si el contenido guardado está corrupto', async () => {
    localStorage.setItem('pato-app-state', '{roto')
    expect(await createLocalStorageAppStateRepository().get()).toBeNull()
  })
})

describe('repositorio de cartas enviadas', () => {
  it('ordena de la más reciente a la más antigua', async () => {
    const repo = createLocalStorageSentLetterLogRepository()
    await repo.save({ id: 's1', sentAt: '2026-01-01T00:00:00Z' })
    await repo.save({ id: 's2', sentAt: '2026-06-01T00:00:00Z' })
    expect((await repo.getAll()).map((l) => l.id)).toEqual(['s2', 's1'])
  })

  it('elimina una entrada del historial', async () => {
    const repo = createLocalStorageSentLetterLogRepository()
    await repo.save({ id: 's1', sentAt: '2026-01-01T00:00:00Z' })
    await repo.remove('s1')
    expect(await repo.getAll()).toEqual([])
  })
})

describe('repositorio de perfiles de la pareja', () => {
  it('empieza con dos posiciones vacías', async () => {
    expect(await createLocalStoragePartnerProfileRepository().getAll()).toEqual([null, null])
  })

  it('guarda en un índice sin afectar al otro', async () => {
    const repo = createLocalStoragePartnerProfileRepository()
    await repo.save({ id: 'p0', nombre: 'Kevin' }, 0)
    const [yo, pareja] = await repo.getAll()
    expect(yo.nombre).toBe('Kevin')
    expect(pareja).toBeNull()
  })

  it('guardar null vacía el slot', async () => {
    const repo = createLocalStoragePartnerProfileRepository()
    await repo.save({ id: 'p0' }, 0)
    await repo.save(null, 0)
    expect((await repo.getAll())[0]).toBeNull()
  })

  it('mantiene siempre exactamente dos posiciones', async () => {
    const repo = createLocalStoragePartnerProfileRepository()
    await repo.save({ id: 'p1' }, 1)
    expect(await repo.getAll()).toHaveLength(2)
  })
})

/**
 * Cuota agotada.
 *
 * Documenta el comportamiento ACTUAL, que es defectuoso: `save` no captura el error, así
 * que la excepción sube sin control y el usuario no ve ningún aviso. El guardado falla
 * en silencio. La Fase 2 del roadmap lo corrige; cuando lo haga, este test debe
 * cambiarse para exigir un error tipado en lugar de la excepción cruda.
 */
describe('cuota de localStorage agotada (defecto conocido, se corrige en la Fase 2)', () => {
  it('la excepción se propaga sin que nadie la capture', async () => {
    const repo = createLocalStorageMediaRepository()
    // El espía va sobre la instancia `localStorage`, no sobre `Storage.prototype`.
    // Espiar el prototipo funciona si este test se ejecuta solo, pero deja de
    // interceptar cuando corre después del resto del archivo, y entonces el test pasa
    // en falso: `save` no lanza y la aserción de rechazo falla. No he identificado la
    // causa exacta dentro de happy-dom/vitest; la identidad del prototipo y de
    // `Storage.prototype` sí coinciden en ese punto. El espía sobre la instancia es
    // determinista en ambos casos, así que es el que se usa. Comprobado en happy-dom 15
    // y 20: el comportamiento es el mismo en ambas.
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      const err = new Error('cuota agotada')
      err.name = 'QuotaExceededError'
      throw err
    })
    await expect(repo.save({ id: 'grande', src: 'data:,' })).rejects.toThrow(/cuota agotada/)
  })
})
