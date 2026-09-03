import { describe, it, expect } from 'vitest'
import {
  fakeMediaRepo, fakeLetterRepo, fakeAppStateRepo, fakeCitaRepo,
  fakePlaylistRepo, fakeActivityEventRepo, fakeSentLetterLogRepo, fakePartnerProfileRepo,
} from './fakes.js'

import { addMedia } from '../../src/application/useCases/addMedia.js'
import { updateMedia } from '../../src/application/useCases/updateMedia.js'
import { deleteMedia } from '../../src/application/useCases/deleteMedia.js'
import { getMediaList } from '../../src/application/useCases/getMediaList.js'
import { saveLetter } from '../../src/application/useCases/saveLetter.js'
import { deleteLetter } from '../../src/application/useCases/deleteLetter.js'
import { buildMailtoUrl } from '../../src/application/useCases/sendLetterByEmail.js'
import { getAppState } from '../../src/application/useCases/getAppState.js'
import { updateAppState } from '../../src/application/useCases/updateAppState.js'
import { addCita } from '../../src/application/useCases/addCita.js'
import { getCitas } from '../../src/application/useCases/getCitas.js'
import { removeCita } from '../../src/application/useCases/removeCita.js'
import { addPlaylist } from '../../src/application/useCases/addPlaylist.js'
import { getPlaylists } from '../../src/application/useCases/getPlaylists.js'
import { addActivityEvent } from '../../src/application/useCases/addActivityEvent.js'
import { getActivityEvents } from '../../src/application/useCases/getActivityEvents.js'
import { removeActivityEvent } from '../../src/application/useCases/removeActivityEvent.js'
import { logSentLetter } from '../../src/application/useCases/logSentLetter.js'
import { getPartnerProfiles } from '../../src/application/useCases/getPartnerProfiles.js'
import { savePartnerProfile } from '../../src/application/useCases/savePartnerProfile.js'
import { clearPartnerProfile } from '../../src/application/useCases/clearPartnerProfile.js'

describe('media', () => {
  it('addMedia guarda el medio y devuelve la entidad con id generado', async () => {
    const repo = fakeMediaRepo()
    const media = await addMedia(repo)({ type: 'photo', src: 'data:,x' })
    expect(media.id).toMatch(/^media-/)
    expect(repo._items).toHaveLength(1)
  })

  it('updateMedia modifica solo los campos indicados', async () => {
    const repo = fakeMediaRepo([{ id: 'm1', type: 'photo', src: 'data:,x', caption: 'viejo', date: '2026-01-01' }])
    const updated = await updateMedia(repo)('m1', { caption: 'nuevo' })
    expect(updated.caption).toBe('nuevo')
    expect(updated.date).toBe('2026-01-01')
  })

  it('updateMedia devuelve null si el id no existe, en lugar de crear uno', async () => {
    const repo = fakeMediaRepo()
    expect(await updateMedia(repo)('inexistente', { caption: 'x' })).toBeNull()
    expect(repo._items).toHaveLength(0)
  })

  it('deleteMedia elimina solo el medio indicado', async () => {
    const repo = fakeMediaRepo([{ id: 'm1' }, { id: 'm2' }])
    await deleteMedia(repo)('m1')
    expect(repo._items.map((m) => m.id)).toEqual(['m2'])
  })

  it('getMediaList devuelve lo guardado', async () => {
    const repo = fakeMediaRepo([{ id: 'm1' }])
    expect(await getMediaList(repo)()).toHaveLength(1)
  })
})

describe('cartas', () => {
  it('saveLetter crea un id cuando no se le da', async () => {
    const repo = fakeLetterRepo()
    const letter = await saveLetter(repo)({ subject: 'Hola', body: 'Texto' })
    expect(letter.id).toMatch(/^letter-/)
  })

  it('saveLetter con id existente actualiza en lugar de duplicar', async () => {
    const repo = fakeLetterRepo()
    await saveLetter(repo)({ id: 'l1', subject: 'v1', body: 'a' })
    await saveLetter(repo)({ id: 'l1', subject: 'v2', body: 'b' })
    expect(repo._items).toHaveLength(1)
    expect(repo._items[0].subject).toBe('v2')
  })

  it('deleteLetter elimina el borrador', async () => {
    const repo = fakeLetterRepo([{ id: 'l1' }])
    await deleteLetter(repo)('l1')
    expect(repo._items).toHaveLength(0)
  })

  it('logSentLetter recorta el cuerpo a 200 caracteres', async () => {
    const repo = fakeSentLetterLogRepo()
    const log = await logSentLetter(repo)({ id: 'l1', subject: 'S', body: 'x'.repeat(500) })
    expect(log.bodyPreview).toHaveLength(200)
  })

  it('logSentLetter tolera una carta sin cuerpo', async () => {
    const repo = fakeSentLetterLogRepo()
    const log = await logSentLetter(repo)({ id: 'l1', subject: 'S' })
    expect(log.bodyPreview).toBe('')
  })
})

describe('buildMailtoUrl', () => {
  it('construye la URL con asunto y cuerpo codificados', () => {
    const url = buildMailtoUrl('a@b.com', 'Hola mundo', 'Cuerpo & más')
    expect(url).toContain('mailto:a@b.com?')
    expect(url).toContain('subject=Hola+mundo')
    expect(url).toContain('%26')
  })

  it('omite la query cuando no hay asunto ni cuerpo', () => {
    expect(buildMailtoUrl('a@b.com', '', '')).toBe('mailto:a@b.com')
  })
})

describe('estado de la app', () => {
  it('getAppState siembra valores por defecto la primera vez y los persiste', async () => {
    const repo = fakeAppStateRepo(null)
    const state = await getAppState(repo)()
    expect(state.metSince).toBeTruthy()
    expect(state.relationshipStatuses.length).toBeGreaterThan(0)
    expect(repo._state).not.toBeNull()
  })

  it('getAppState devuelve lo guardado si ya existe', async () => {
    const repo = fakeAppStateRepo({ metSince: '2020-02-02', datesCount: 7, relationshipStatuses: [] })
    expect((await getAppState(repo)()).datesCount).toBe(7)
  })

  it('updateAppState cambia solo los campos indicados', async () => {
    const repo = fakeAppStateRepo({ metSince: '2020-01-01', datesCount: 1, relationshipStatuses: [{ id: 'a' }] })
    const next = await updateAppState(repo)({ datesCount: 2 })
    expect(next.datesCount).toBe(2)
    expect(next.metSince).toBe('2020-01-01')
  })

  it('updateAppState guarda los estados personalizados que le pasan', async () => {
    // Configuración permite crear estados propios. Si el caso de uso los descarta,
    // el usuario los escribe, pulsa guardar y no pasa nada.
    const repo = fakeAppStateRepo({ metSince: '2020-01-01', relationshipStatuses: [{ id: 'novios' }] })
    const custom = [{ id: 'novios' }, { id: 'comprometidos' }]
    const next = await updateAppState(repo)({ relationshipStatuses: custom })
    expect(next.relationshipStatuses).toEqual(custom)
  })

  it('updateAppState conserva los estados actuales si no le pasan otros', async () => {
    const repo = fakeAppStateRepo({ metSince: '2020-01-01', relationshipStatuses: [{ id: 'novios' }] })
    const next = await updateAppState(repo)({ datesCount: 3 })
    expect(next.relationshipStatuses).toEqual([{ id: 'novios' }])
  })
})

describe('citas', () => {
  it('addCita genera id y normaliza los campos ausentes', async () => {
    const repo = fakeCitaRepo()
    const cita = await addCita(repo)({ date: '2026-05-01' })
    expect(cita.id).toMatch(/^cita-/)
    expect(cita.lugar).toBe('')
  })

  it('getCitas ordena de más reciente a más antigua', async () => {
    const repo = fakeCitaRepo([
      { id: 'c1', date: '2026-01-01' },
      { id: 'c3', date: '2026-03-01' },
      { id: 'c2', date: '2026-02-01' },
    ])
    expect((await getCitas(repo)()).map((c) => c.id)).toEqual(['c3', 'c2', 'c1'])
  })

  it('getCitas no reordena el almacén: leer no debe modificar lo guardado', async () => {
    const repo = fakeCitaRepo([
      { id: 'c1', date: '2026-01-01' },
      { id: 'c3', date: '2026-03-01' },
    ])
    const ordenAntes = repo._items.map((c) => c.id)
    await getCitas(repo)()
    expect(repo._items.map((c) => c.id)).toEqual(ordenAntes)
  })

  it('removeCita elimina solo la indicada', async () => {
    const repo = fakeCitaRepo([{ id: 'c1' }, { id: 'c2' }])
    await removeCita(repo)('c1')
    expect(repo._items.map((c) => c.id)).toEqual(['c2'])
  })
})

describe('playlists', () => {
  it('getPlaylists ordena por fecha de alta, la más reciente primero', async () => {
    const repo = fakePlaylistRepo([
      { id: 'p1', addedAt: '2026-01-01T00:00:00Z' },
      { id: 'p2', addedAt: '2026-06-01T00:00:00Z' },
    ])
    expect((await getPlaylists(repo)()).map((p) => p.id)).toEqual(['p2', 'p1'])
  })

  it('getPlaylists no reordena el almacén', async () => {
    const repo = fakePlaylistRepo([
      { id: 'p1', addedAt: '2026-01-01T00:00:00Z' },
      { id: 'p2', addedAt: '2026-06-01T00:00:00Z' },
    ])
    const ordenAntes = repo._items.map((p) => p.id)
    await getPlaylists(repo)()
    expect(repo._items.map((p) => p.id)).toEqual(ordenAntes)
  })

  it('addPlaylist guarda la playlist', async () => {
    const repo = fakePlaylistRepo()
    await addPlaylist(repo)({ id: 'p1', name: 'Nuestra' })
    expect(repo._items).toHaveLength(1)
  })
})

describe('feed de actividad', () => {
  it('getActivityEvents ordena del más reciente al más antiguo', async () => {
    const repo = fakeActivityEventRepo([
      { id: 'e1', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'e3', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'e2', createdAt: '2026-02-01T00:00:00Z' },
    ])
    expect((await getActivityEvents(repo)()).map((e) => e.id)).toEqual(['e3', 'e2', 'e1'])
  })

  it('getActivityEvents no reordena el almacén', async () => {
    const repo = fakeActivityEventRepo([
      { id: 'e1', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'e2', createdAt: '2026-03-01T00:00:00Z' },
    ])
    const ordenAntes = repo._items.map((e) => e.id)
    await getActivityEvents(repo)()
    expect(repo._items.map((e) => e.id)).toEqual(ordenAntes)
  })

  it('addActivityEvent guarda y devuelve el evento construido', async () => {
    const repo = fakeActivityEventRepo()
    const evt = await addActivityEvent(repo)({ type: 'cita_added', description: 'Añadió una cita' })
    expect(evt.type).toBe('cita_added')
    expect(repo._items).toHaveLength(1)
  })

  it('removeActivityEvent quita el evento del feed', async () => {
    const repo = fakeActivityEventRepo([{ id: 'e1' }])
    await removeActivityEvent(repo)('e1')
    expect(repo._items).toHaveLength(0)
  })
})

describe('perfiles de la pareja', () => {
  it('getPartnerProfiles siempre devuelve exactamente dos posiciones', async () => {
    expect(await getPartnerProfiles(fakePartnerProfileRepo([]))()).toEqual([null, null])
  })

  it('savePartnerProfile guarda en el índice indicado', async () => {
    const repo = fakePartnerProfileRepo()
    await savePartnerProfile(repo)({ nombre: 'Kevin' }, 0)
    expect(repo._profiles[0].nombre).toBe('Kevin')
    expect(repo._profiles[1]).toBeNull()
  })

  it('savePartnerProfile genera un id si no lo trae', async () => {
    const repo = fakePartnerProfileRepo()
    const profile = await savePartnerProfile(repo)({ nombre: 'Kevin' }, 0)
    expect(profile.id).toMatch(/^profile-0-/)
  })

  it('clearPartnerProfile vacía el slot sin tocar el otro', async () => {
    const repo = fakePartnerProfileRepo([{ id: 'a' }, { id: 'b' }])
    await clearPartnerProfile(repo)(0)
    expect(repo._profiles[0]).toBeNull()
    expect(repo._profiles[1]).toEqual({ id: 'b' })
  })
})
