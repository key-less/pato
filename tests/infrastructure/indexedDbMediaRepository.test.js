import { describe, it, expect, beforeEach } from 'vitest'
import { createIndexedDbMediaRepository } from '../../src/infrastructure/storage/indexedDbMediaRepository.js'

const PIXEL_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='

function text(buffer) {
  return new TextDecoder().decode(buffer)
}

function photo(overrides = {}) {
  return {
    id: 'media-1',
    type: 'photo',
    blob: new Blob(['contenido-foto'], { type: 'image/jpeg' }),
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('indexedDbMediaRepository', () => {
  beforeEach(async () => {
    localStorage.clear()
    await createIndexedDbMediaRepository().replaceAll([])
  })

  it('guarda el binario y lo devuelve intacto', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const file = await repo.getFile('media-1')

    expect(text(file.buffer)).toBe('contenido-foto')
    expect(file.mimeType).toBe('image/jpeg')
  })

  it('no carga los binarios al listar el album', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const [item] = await repo.getAll()

    expect(item.id).toBe('media-1')
    expect(item.size).toBe(14)
    expect(item.data).toBeUndefined()
    expect(item.thumbnailData).toBeUndefined()
  })

  it('expone la miniatura como src para que la cuadricula no pida el original', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo({ thumbnailBlob: new Blob(['mini'], { type: 'image/jpeg' }) }))

    const [item] = await repo.getAll()

    expect(item.thumbnail).toMatch(/^blob:/)
    expect(item.src).toBe(item.thumbnail)
  })

  it('deja src en null cuando no hay miniatura, para pedir el original a demanda', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const [item] = await repo.getAll()

    expect(item.src).toBeNull()
    expect(await repo.getFileUrl('media-1')).toMatch(/^blob:/)
  })

  it('reutiliza el mismo object URL del original entre llamadas', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const first = await repo.getFileUrl('media-1')
    const second = await repo.getFileUrl('media-1')

    expect(second).toBe(first)
  })

  it('devuelve null al pedir el original de un id inexistente', async () => {
    const repo = createIndexedDbMediaRepository()

    expect(await repo.getFileUrl('no-existe')).toBeNull()
    expect(await repo.getFile('no-existe')).toBeNull()
  })

  it('editar metadatos no reescribe el binario', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const [item] = await repo.getAll()
    await repo.save({ ...item, caption: 'editada', showOnLanding: true })

    const [reloaded] = await repo.getAll()
    expect(reloaded.caption).toBe('editada')
    expect(reloaded.showOnLanding).toBe(true)
    expect(reloaded.size).toBe(14)
    expect(text((await repo.getFile('media-1')).buffer)).toBe('contenido-foto')
  })

  it('conserva la miniatura al editar solo metadatos', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo({ thumbnailBlob: new Blob(['mini'], { type: 'image/jpeg' }) }))

    const [item] = await repo.getAll()
    await repo.save({ ...item, caption: 'editada' })

    const [reloaded] = await repo.getAll()
    expect(reloaded.thumbnail).toMatch(/^blob:/)
    expect(reloaded.caption).toBe('editada')
    expect(await repo.getThumbnailDataUrl('media-1')).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('conserva mimeType y tamano al editar solo metadatos', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())

    const [item] = await repo.getAll()
    await repo.save({ ...item, date: '2025-05-05' })

    const [reloaded] = await repo.getAll()
    expect(reloaded.mimeType).toBe('image/jpeg')
    expect(reloaded.size).toBe(14)
  })

  it('ordena el album por createdAt', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo({ id: 'b', createdAt: '2024-03-01T00:00:00.000Z' }))
    await repo.save(photo({ id: 'a', createdAt: '2024-01-01T00:00:00.000Z' }))

    expect((await repo.getAll()).map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('borra metadatos y binario a la vez', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo())
    await repo.remove('media-1')

    expect(await repo.getAll()).toEqual([])
    expect(await repo.getFile('media-1')).toBeNull()
  })

  it('suma el tamano del album sin leer binarios', async () => {
    const repo = createIndexedDbMediaRepository()
    await repo.save(photo({ id: 'a' }))
    await repo.save(photo({ id: 'b', blob: new Blob(['xy'], { type: 'image/jpeg' }) }))

    expect(await repo.estimateBytes()).toBe(16)
  })

  describe('migracion desde localStorage', () => {
    it('convierte data URLs antiguas y limpia la clave vieja', async () => {
      localStorage.setItem('pato-media', JSON.stringify([
        { id: 'media-1700000000000-abc', type: 'photo', src: PIXEL_DATA_URL, date: '2023-11-14', showOnLanding: true },
      ]))

      const repo = createIndexedDbMediaRepository()
      const all = await repo.getAll()

      expect(all).toHaveLength(1)
      expect(all[0].mimeType).toBe('image/png')
      expect(all[0].size).toBeGreaterThan(0)
      expect(all[0].showOnLanding).toBe(true)
      expect(all[0].date).toBe('2023-11-14')
      expect(await repo.getFileUrl('media-1700000000000-abc')).toMatch(/^blob:/)
      expect(localStorage.getItem('pato-media')).toBeNull()
    })

    it('conserva el orden original usando el timestamp del id', async () => {
      localStorage.setItem('pato-media', JSON.stringify([
        { id: 'media-1700000000000-aaa', type: 'photo', src: PIXEL_DATA_URL },
        { id: 'media-1600000000000-bbb', type: 'photo', src: PIXEL_DATA_URL },
      ]))

      const all = await createIndexedDbMediaRepository().getAll()

      expect(all.map((m) => m.id)).toEqual(['media-1600000000000-bbb', 'media-1700000000000-aaa'])
    })

    it('mantiene la clave antigua si algun elemento no se pudo convertir', async () => {
      localStorage.setItem('pato-media', JSON.stringify([
        { id: 'media-1', type: 'photo', src: PIXEL_DATA_URL },
        { id: 'media-2', type: 'photo', src: 'no-es-un-data-url' },
      ]))

      const all = await createIndexedDbMediaRepository().getAll()

      expect(all).toHaveLength(1)
      expect(localStorage.getItem('pato-media')).not.toBeNull()
    })

    it('no duplica nada al abrir el repositorio dos veces', async () => {
      localStorage.setItem('pato-media', JSON.stringify([
        { id: 'media-1700000000000-abc', type: 'photo', src: PIXEL_DATA_URL },
      ]))

      await createIndexedDbMediaRepository().getAll()
      const all = await createIndexedDbMediaRepository().getAll()

      expect(all).toHaveLength(1)
    })
  })
})
