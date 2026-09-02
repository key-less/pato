import { defineRepository } from './defineRepository.js'

/**
 * Puerto para la persistencia de medios (fotos y vídeos).
 *
 * @typedef { import('../entities/Media.js').createMedia } Media
 *
 * Contrato:
 * - `getAll(): Promise<Media[]>`
 * - `save(media: Media): Promise<void>` — inserta o actualiza por `id`
 * - `remove(id: string): Promise<void>`
 */
export const createMediaRepository = defineRepository('MediaRepository', ['getAll', 'save', 'remove'])
