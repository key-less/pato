import { describe, it, expect } from 'vitest'
import { exportBackup, BACKUP_FORMAT, BACKUP_VERSION } from '../../src/application/useCases/exportBackup.js'
import { importBackup } from '../../src/application/useCases/importBackup.js'
import { InvalidBackupError } from '../../src/domain/errors/BackupError.js'

function collection(initial = []) {
  let items = [...initial]
  return {
    async getAll() { return [...items] },
    async replaceAll(next) { items = [...next] },
    current: () => items,
  }
}

function mediaRepo(initial = []) {
  let items = [...initial]
  return {
    async getAll() { return [...items] },
    async replaceAll(next) { items = [...next] },
    async getFileDataUrl(id) { return `data:image/jpeg;base64,${id}` },
    async getThumbnailDataUrl(id) { return `data:image/jpeg;base64,thumb-${id}` },
    current: () => items,
  }
}

function buildRepositories(overrides = {}) {
  return {
    appState: (() => {
      let state = { metSince: '2024-01-01', relationshipStatuses: [] }
      return {
        async get() { return state },
        async save(next) { state = next },
        current: () => state,
      }
    })(),
    cita: collection([{ id: 'c1', date: '2024-02-01' }]),
    letter: collection([{ id: 'l1', subject: 'Hola' }]),
    sentLetterLog: collection(),
    partnerProfile: collection([{ nombre: 'Ana' }, null]),
    playlist: collection(),
    activityEvent: collection(),
    media: mediaRepo([
      { id: 'm1', type: 'photo', mimeType: 'image/jpeg', size: 120, date: '2024-02-01', showOnLanding: true, createdAt: '2024-02-01T00:00:00.000Z' },
    ]),
    ...overrides,
  }
}

describe('exportBackup', () => {
  it('marca el formato y la version', async () => {
    const snapshot = await exportBackup(buildRepositories())()

    expect(snapshot.format).toBe(BACKUP_FORMAT)
    expect(snapshot.version).toBe(BACKUP_VERSION)
    expect(snapshot.exportedAt).toMatch(/^\d{4}-/)
  })

  it('incluye todas las secciones', async () => {
    const snapshot = await exportBackup(buildRepositories())()

    expect(snapshot.data.citas).toHaveLength(1)
    expect(snapshot.data.letters).toHaveLength(1)
    expect(snapshot.data.partnerProfiles[0].nombre).toBe('Ana')
    expect(snapshot.data.appState.metSince).toBe('2024-01-01')
  })

  it('incrusta los archivos cuando se piden', async () => {
    const snapshot = await exportBackup(buildRepositories())({ includeMedia: true })

    expect(snapshot.includesMedia).toBe(true)
    expect(snapshot.data.media[0].dataUrl).toBe('data:image/jpeg;base64,m1')
    expect(snapshot.data.media[0].thumbnailDataUrl).toBe('data:image/jpeg;base64,thumb-m1')
  })

  it('no exporta las cartas selladas por la pareja', async () => {
    // Llegan como marcador sin contenido; exportarlas crearia cartas vacias.
    const repos = buildRepositories({
      letter: collection([
        { id: 'l1', subject: 'Hola', body: 'mia' },
        { id: 'l2', subject: '', body: '', unlocksAt: '2027-02-14', selladaPorLaPareja: true },
      ]),
    })

    const snapshot = await exportBackup(repos)()

    expect(snapshot.data.letters).toHaveLength(1)
    expect(snapshot.data.letters[0].id).toBe('l1')
  })

  it('deja solo metadatos del album cuando no se piden los archivos', async () => {
    const snapshot = await exportBackup(buildRepositories())({ includeMedia: false })

    expect(snapshot.includesMedia).toBe(false)
    expect(snapshot.data.media[0].dataUrl).toBeUndefined()
    expect(snapshot.data.media[0].showOnLanding).toBe(true)
  })
})

describe('importBackup', () => {
  async function validSnapshot() {
    return exportBackup(buildRepositories())()
  }

  it('restaura todas las secciones', async () => {
    const snapshot = await validSnapshot()
    const target = buildRepositories({
      cita: collection(),
      letter: collection(),
      media: mediaRepo(),
    })

    const summary = await importBackup(target)(snapshot)

    expect(target.cita.current()).toHaveLength(1)
    expect(target.letter.current()).toHaveLength(1)
    expect(target.media.current()).toHaveLength(1)
    expect(summary).toEqual({ media: 1, citas: 1, letters: 1, playlists: 0, activityEvents: 0 })
  })

  it('rechaza un archivo que no es copia de Pato sin tocar nada', async () => {
    const target = buildRepositories()

    await expect(importBackup(target)({ hola: true })).rejects.toThrow(InvalidBackupError)
    expect(target.cita.current()).toHaveLength(1)
  })

  it('rechaza una copia de una version mas nueva', async () => {
    const snapshot = await validSnapshot()
    snapshot.version = BACKUP_VERSION + 1

    await expect(importBackup(buildRepositories())(snapshot)).rejects.toThrow(/version mas nueva/)
  })

  it('rechaza una copia con una seccion ausente', async () => {
    const snapshot = await validSnapshot()
    delete snapshot.data.playlists

    await expect(importBackup(buildRepositories())(snapshot)).rejects.toThrow(/playlists/)
  })

  it('rechaza null y valores que no son objeto', async () => {
    const run = importBackup(buildRepositories())

    await expect(run(null)).rejects.toThrow(InvalidBackupError)
    await expect(run('texto')).rejects.toThrow(InvalidBackupError)
  })

  it('no escribe ninguna seccion cuando la validacion falla', async () => {
    const target = buildRepositories()
    const snapshot = await validSnapshot()
    delete snapshot.data.media

    await expect(importBackup(target)(snapshot)).rejects.toThrow(InvalidBackupError)
    expect(target.media.current()).toHaveLength(1)
    expect(target.appState.current().metSince).toBe('2024-01-01')
  })
})
