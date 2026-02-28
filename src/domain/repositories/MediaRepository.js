/**
 * Puerto (interfaz) para persistencia de medios.
 * La infraestructura implementa este contrato.
 */

/**
 * @typedef { import('../entities/Media.js').createMedia } Media
 */

/**
 * @param {Object} deps
 * @param {() => Promise<Media[]>} deps.getAll
 * @param {(media: Media) => Promise<void>} deps.save
 * @param {(id: string) => Promise<void>} deps.remove
 */
export function createMediaRepository(deps) {
  return deps
}
