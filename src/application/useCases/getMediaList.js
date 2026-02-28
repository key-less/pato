/**
 * Lista todos los medios (fotos/videos) para el álbum y para la galería flotante.
 * @param {import('../../domain/repositories/MediaRepository.js')} mediaRepository
 */
export function getMediaList(mediaRepository) {
  return async function execute() {
    return mediaRepository.getAll()
  }
}
