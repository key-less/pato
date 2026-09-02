/**
 * Contenedor de dependencias: elige la persistencia y cablea los casos de uso.
 *
 * Con Supabase configurado, los datos son de la pareja y viajan entre los dos
 * telefonos. Sin configurar, la app sigue funcionando contra el navegador como en
 * la Fase 0. Es el unico archivo que sabe cual de las dos cosas esta pasando.
 */
import { isSupabaseConfigured } from '../supabase/client.js'
import { createLocalRepositories } from '../storage/localRepositories.js'
import { createSupabaseRepositories } from '../supabase/repositories.js'
import { createSupabaseAccountRepository } from '../supabase/accountRepository.js'
import { getAppState } from '../../application/useCases/getAppState.js'
import { updateAppState } from '../../application/useCases/updateAppState.js'
import { getMediaList } from '../../application/useCases/getMediaList.js'
import { addMedia } from '../../application/useCases/addMedia.js'
import { updateMedia } from '../../application/useCases/updateMedia.js'
import { deleteMedia } from '../../application/useCases/deleteMedia.js'
import { getLetters } from '../../application/useCases/getLetters.js'
import { saveLetter } from '../../application/useCases/saveLetter.js'
import { deleteLetter } from '../../application/useCases/deleteLetter.js'
import { buildMailtoUrl } from '../../application/useCases/sendLetterByEmail.js'
import { getCitas } from '../../application/useCases/getCitas.js'
import { addCita } from '../../application/useCases/addCita.js'
import { removeCita } from '../../application/useCases/removeCita.js'
import { getSentLetterLogs } from '../../application/useCases/getSentLetterLogs.js'
import { logSentLetter } from '../../application/useCases/logSentLetter.js'
import { removeSentLetterLog } from '../../application/useCases/removeSentLetterLog.js'
import { getPartnerProfiles } from '../../application/useCases/getPartnerProfiles.js'
import { savePartnerProfile } from '../../application/useCases/savePartnerProfile.js'
import { clearPartnerProfile } from '../../application/useCases/clearPartnerProfile.js'
import { getPlaylists } from '../../application/useCases/getPlaylists.js'
import { addPlaylist } from '../../application/useCases/addPlaylist.js'
import { removePlaylist } from '../../application/useCases/removePlaylist.js'
import { addActivityEvent } from '../../application/useCases/addActivityEvent.js'
import { getActivityEvents } from '../../application/useCases/getActivityEvents.js'
import { removeActivityEvent } from '../../application/useCases/removeActivityEvent.js'
import { exportBackup } from '../../application/useCases/exportBackup.js'
import { importBackup } from '../../application/useCases/importBackup.js'

const repositories = isSupabaseConfigured ? createSupabaseRepositories() : createLocalRepositories()

export const container = {
  mode: isSupabaseConfigured ? 'supabase' : 'local',

  getAppState: getAppState(repositories.appState),
  updateAppState: updateAppState(repositories.appState),
  getMediaList: getMediaList(repositories.media),
  addMedia: addMedia(repositories.media),
  updateMedia: updateMedia(repositories.media),
  deleteMedia: deleteMedia(repositories.media),
  getLetters: getLetters(repositories.letter),
  saveLetter: saveLetter(repositories.letter),
  deleteLetter: deleteLetter(repositories.letter),
  buildMailtoUrl,
  getCitas: getCitas(repositories.cita),
  addCita: addCita(repositories.cita),
  removeCita: removeCita(repositories.cita),
  getSentLetterLogs: getSentLetterLogs(repositories.sentLetterLog),
  logSentLetter: logSentLetter(repositories.sentLetterLog),
  removeSentLetterLog: removeSentLetterLog(repositories.sentLetterLog),
  getPartnerProfiles: getPartnerProfiles(repositories.partnerProfile),
  savePartnerProfile: savePartnerProfile(repositories.partnerProfile),
  clearPartnerProfile: clearPartnerProfile(repositories.partnerProfile),
  getPlaylists: getPlaylists(repositories.playlist),
  addPlaylist: addPlaylist(repositories.playlist),
  removePlaylist: removePlaylist(repositories.playlist),
  addActivityEvent: addActivityEvent(repositories.activityEvent),
  getActivityEvents: getActivityEvents(repositories.activityEvent),
  removeActivityEvent: removeActivityEvent(repositories.activityEvent),
  exportBackup: exportBackup(repositories),
  importBackup: importBackup(repositories),

  /** URL del archivo original de un medio, cargada a demanda. */
  getMediaFileUrl: (id) => repositories.media.getFileUrl(id),
  /** Peso total del album, para avisar antes de exportar. */
  getMediaBytes: () => repositories.media.estimateBytes(),

  /** Sesion y emparejamiento. Null mientras la app corre solo en el navegador. */
  account: isSupabaseConfigured ? createSupabaseAccountRepository() : null,

  /**
   * La onda compartida: avisa cuando la otra persona tambien tiene la app abierta.
   * Null en modo local, donde no hay nadie mas a quien sentir.
   */
  subscribePresence: repositories.presence
    ? (listener) => repositories.presence.subscribe(listener)
    : null,
}
