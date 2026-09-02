import { createMedia } from '../../domain/entities/Media.js'

/**
 * Añade un medio (foto o video) con su miniatura, fecha y estado opcionales.
 * @param {import('../../domain/repositories/MediaRepository.js')} mediaRepository
 */
export function addMedia(mediaRepository) {
  return async function execute({
    type,
    blob,
    thumbnailBlob,
    date,
    relationshipStatusId,
    caption,
    showOnLanding,
  }) {
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const media = createMedia({
      id,
      type,
      blob,
      thumbnailBlob,
      date,
      relationshipStatusId,
      caption,
      showOnLanding: showOnLanding ?? false,
    })
    await mediaRepository.save(media)
    return media
  }
}
