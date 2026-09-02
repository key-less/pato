import { createIndexedDbMediaRepository } from './indexedDbMediaRepository.js'
import { createLocalStorageAppStateRepository } from './localStorageAppStateRepository.js'
import { createLocalStorageLetterRepository } from './localStorageLetterRepository.js'
import { createLocalStorageCitaRepository } from './localStorageCitaRepository.js'
import { createLocalStorageSentLetterLogRepository } from './localStorageSentLetterLogRepository.js'
import { createLocalStoragePartnerProfileRepository } from './localStoragePartnerProfileRepository.js'
import { createLocalStoragePlaylistRepository } from './localStoragePlaylistRepository.js'
import { createLocalStorageActivityEventRepository } from './localStorageActivityEventRepository.js'

/** Los ocho puertos sobre el navegador. Es el modo por defecto hasta configurar Supabase. */
export function createLocalRepositories() {
  return {
    media: createIndexedDbMediaRepository(),
    appState: createLocalStorageAppStateRepository(),
    letter: createLocalStorageLetterRepository(),
    cita: createLocalStorageCitaRepository(),
    sentLetterLog: createLocalStorageSentLetterLogRepository(),
    partnerProfile: createLocalStoragePartnerProfileRepository(),
    playlist: createLocalStoragePlaylistRepository(),
    activityEvent: createLocalStorageActivityEventRepository(),
  }
}
