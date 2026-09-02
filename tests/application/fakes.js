/**
 * Repositorios falsos en memoria para probar los casos de uso.
 *
 * Cumplen los mismos contratos que las implementaciones reales, así que si un contrato
 * cambia y estos no se actualizan, los tests fallan al construirlos. Eso es
 * deliberado: es la red que impide que las implementaciones se desincronicen.
 */
import { createMediaRepository } from '../../src/domain/repositories/MediaRepository.js'
import { createLetterRepository } from '../../src/domain/repositories/LetterRepository.js'
import { createAppStateRepository } from '../../src/domain/repositories/AppStateRepository.js'
import { createCitaRepository } from '../../src/domain/repositories/CitaRepository.js'
import { createPlaylistRepository } from '../../src/domain/repositories/PlaylistRepository.js'
import { createActivityEventRepository } from '../../src/domain/repositories/ActivityEventRepository.js'
import { createSentLetterLogRepository } from '../../src/domain/repositories/SentLetterLogRepository.js'
import { createPartnerProfileRepository } from '../../src/domain/repositories/PartnerProfileRepository.js'

/** Repositorio de colección genérico, sobre un array en memoria. */
function collectionFake(contract, initial = []) {
  let items = [...initial]
  const repo = contract({
    async getAll() {
      return items
    },
    async save(entity) {
      const idx = items.findIndex((e) => e.id === entity.id)
      if (idx >= 0) items[idx] = entity
      else items.push(entity)
    },
    async remove(id) {
      items = items.filter((e) => e.id !== id)
    },
  })
  // Acceso directo al array para que los tests comprueben el estado sin pasar por getAll.
  Object.defineProperty(repo, '_items', { get: () => items })
  return repo
}

export const fakeMediaRepo = (initial) => collectionFake(createMediaRepository, initial)
export const fakeLetterRepo = (initial) => collectionFake(createLetterRepository, initial)
export const fakeCitaRepo = (initial) => collectionFake(createCitaRepository, initial)
export const fakePlaylistRepo = (initial) => collectionFake(createPlaylistRepository, initial)
export const fakeActivityEventRepo = (initial) => collectionFake(createActivityEventRepository, initial)
export const fakeSentLetterLogRepo = (initial) => collectionFake(createSentLetterLogRepository, initial)

export function fakeAppStateRepo(initial = null) {
  let state = initial
  const repo = createAppStateRepository({
    async get() {
      return state
    },
    async save(next) {
      state = next
    },
  })
  Object.defineProperty(repo, '_state', { get: () => state })
  return repo
}

export function fakePartnerProfileRepo(initial = [null, null]) {
  let profiles = [...initial]
  const repo = createPartnerProfileRepository({
    async getAll() {
      return profiles
    },
    async save(profile, index) {
      profiles[index] = profile
    },
  })
  Object.defineProperty(repo, '_profiles', { get: () => profiles })
  return repo
}
