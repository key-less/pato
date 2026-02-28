/**
 * Contenedor de dependencias: instancia repositorios y casos de uso.
 */
import { createLocalStorageMediaRepository } from '../storage/localStorageMediaRepository.js'
import { createLocalStorageAppStateRepository } from '../storage/localStorageAppStateRepository.js'
import { createLocalStorageLetterRepository } from '../storage/localStorageLetterRepository.js'
import { createLocalStorageCitaRepository } from '../storage/localStorageCitaRepository.js'
import { createLocalStorageSentLetterLogRepository } from '../storage/localStorageSentLetterLogRepository.js'
import { createLocalStoragePartnerProfileRepository } from '../storage/localStoragePartnerProfileRepository.js'
import { createLocalStoragePlaylistRepository } from '../storage/localStoragePlaylistRepository.js'
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

const mediaRepo = createLocalStorageMediaRepository()
const appStateRepo = createLocalStorageAppStateRepository()
const letterRepo = createLocalStorageLetterRepository()
const citaRepo = createLocalStorageCitaRepository()
const sentLetterLogRepo = createLocalStorageSentLetterLogRepository()
const partnerProfileRepo = createLocalStoragePartnerProfileRepository()
const playlistRepo = createLocalStoragePlaylistRepository()

export const container = {
  getAppState: getAppState(appStateRepo),
  updateAppState: updateAppState(appStateRepo),
  getMediaList: getMediaList(mediaRepo),
  addMedia: addMedia(mediaRepo),
  updateMedia: updateMedia(mediaRepo),
  deleteMedia: deleteMedia(mediaRepo),
  getLetters: getLetters(letterRepo),
  saveLetter: saveLetter(letterRepo),
  deleteLetter: deleteLetter(letterRepo),
  buildMailtoUrl,
  getCitas: getCitas(citaRepo),
  addCita: addCita(citaRepo),
  removeCita: removeCita(citaRepo),
  getSentLetterLogs: getSentLetterLogs(sentLetterLogRepo),
  logSentLetter: logSentLetter(sentLetterLogRepo),
  removeSentLetterLog: removeSentLetterLog(sentLetterLogRepo),
  getPartnerProfiles: getPartnerProfiles(partnerProfileRepo),
  savePartnerProfile: savePartnerProfile(partnerProfileRepo),
  clearPartnerProfile: clearPartnerProfile(partnerProfileRepo),
  getPlaylists: getPlaylists(playlistRepo),
  addPlaylist: addPlaylist(playlistRepo),
  removePlaylist: removePlaylist(playlistRepo),
}
