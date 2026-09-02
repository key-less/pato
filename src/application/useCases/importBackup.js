import { InvalidBackupError } from '../../domain/errors/BackupError.js'
import { BACKUP_FORMAT, BACKUP_VERSION } from './exportBackup.js'

const COLLECTIONS = [
  'citas',
  'letters',
  'sentLetterLogs',
  'partnerProfiles',
  'playlists',
  'activityEvents',
  'media',
]

/** Rechaza el archivo entero antes de escribir nada. */
function parseSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new InvalidBackupError('El archivo no contiene datos de Pato.')
  }
  if (snapshot.format !== BACKUP_FORMAT) {
    throw new InvalidBackupError('El archivo no es una copia de seguridad de Pato.')
  }
  if (!Number.isInteger(snapshot.version) || snapshot.version > BACKUP_VERSION) {
    throw new InvalidBackupError('La copia viene de una version mas nueva de Pato. Actualiza la app antes de restaurarla.')
  }

  const data = snapshot.data
  if (!data || typeof data !== 'object') {
    throw new InvalidBackupError('La copia no trae contenido.')
  }
  for (const key of COLLECTIONS) {
    if (!Array.isArray(data[key])) {
      throw new InvalidBackupError(`La copia esta incompleta: falta la seccion «${key}».`)
    }
  }
  return data
}

/**
 * Reemplaza todo el contenido de la app con el de una copia.
 *
 * El album va primero porque es lo que puede quedarse sin espacio: si falla,
 * el resto de las secciones sigue intacto en lugar de quedar a medias.
 *
 * @param {Object} repositories - los mismos que exportBackup
 */
export function importBackup(repositories) {
  return async function execute(snapshot) {
    const data = parseSnapshot(snapshot)

    await repositories.media.replaceAll(data.media)
    await repositories.cita.replaceAll(data.citas)
    await repositories.letter.replaceAll(data.letters)
    await repositories.sentLetterLog.replaceAll(data.sentLetterLogs)
    await repositories.partnerProfile.replaceAll(data.partnerProfiles)
    await repositories.playlist.replaceAll(data.playlists)
    await repositories.activityEvent.replaceAll(data.activityEvents)
    if (data.appState) await repositories.appState.save(data.appState)

    return {
      media: data.media.length,
      citas: data.citas.length,
      letters: data.letters.length,
      playlists: data.playlists.length,
      activityEvents: data.activityEvents.length,
    }
  }
}
