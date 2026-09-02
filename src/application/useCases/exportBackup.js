export const BACKUP_FORMAT = 'pato-backup'
export const BACKUP_VERSION = 1

/**
 * Reune todo el contenido de la app en un objeto serializable.
 *
 * Con includeMedia el archivo lleva las fotos y videos incrustados como data URLs,
 * lo que multiplica su tamano por 1.33; sin él solo van los metadatos del album.
 *
 * @param {Object} repositories - appState, cita, letter, sentLetterLog, partnerProfile, playlist, activityEvent, media
 */
export function exportBackup(repositories) {
  return async function execute({ includeMedia = true } = {}) {
    const [appState, citas, letters, sentLetterLogs, partnerProfiles, playlists, activityEvents, media] =
      await Promise.all([
        repositories.appState.get(),
        repositories.cita.getAll(),
        repositories.letter.getAll(),
        repositories.sentLetterLog.getAll(),
        repositories.partnerProfile.getAll(),
        repositories.playlist.getAll(),
        repositories.activityEvent.getAll(),
        repositories.media.getAll(),
      ])

    // Secuencial a proposito: en paralelo, un album grande dispara el pico de memoria.
    const mediaEntries = []
    for (const item of media) {
      const entry = {
        id: item.id,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size,
        date: item.date,
        relationshipStatusId: item.relationshipStatusId,
        caption: item.caption,
        showOnLanding: item.showOnLanding,
        createdAt: item.createdAt,
      }
      if (includeMedia) {
        entry.dataUrl = await repositories.media.getFileDataUrl(item.id)
        entry.thumbnailDataUrl = await repositories.media.getThumbnailDataUrl(item.id)
      }
      mediaEntries.push(entry)
    }

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      includesMedia: includeMedia,
      data: {
        appState,
        citas,
        letters,
        sentLetterLogs,
        partnerProfiles,
        playlists,
        activityEvents,
        media: mediaEntries,
      },
    }
  }
}
