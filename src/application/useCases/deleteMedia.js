/**
 * Elimina un medio por id.
 * @param {import('../../domain/repositories/MediaRepository.js')} mediaRepository
 */
export function deleteMedia(mediaRepository) {
  return async function execute(id) {
    await mediaRepository.remove(id)
  }
}
