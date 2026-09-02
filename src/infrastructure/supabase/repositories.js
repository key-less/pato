import { createSupabaseCollectionRepository } from './collectionRepository.js'
import { createSupabaseAppStateRepository } from './appStateRepository.js'
import { createSupabasePartnerProfileRepository } from './partnerProfileRepository.js'
import { createSupabaseMediaRepository } from './mediaRepository.js'
import { createSupabaseLetterRepository } from './letterRepository.js'
import { createSupabasePresenceRepository } from './presenceRepository.js'

/**
 * Los ocho puertos, implementados contra Supabase. Misma interfaz que los de
 * localStorage: por eso el salto de la Fase 1 se resuelve en el contenedor.
 */
export function createSupabaseRepositories() {
  return {
    media: createSupabaseMediaRepository(),
    appState: createSupabaseAppStateRepository(),
    partnerProfile: createSupabasePartnerProfileRepository(),
    letter: createSupabaseLetterRepository(),
    presence: createSupabasePresenceRepository(),

    cita: createSupabaseCollectionRepository({
      table: 'citas',
      fields: ['date', 'note', 'lugar', 'horaEncuentro'],
      orderBy: { column: 'date', ascending: false },
    }),

    sentLetterLog: createSupabaseCollectionRepository({
      table: 'sent_letter_logs',
      fields: ['letterId', 'subject', 'bodyPreview', 'sentAt'],
      orderBy: { column: 'sent_at', ascending: false },
    }),

    playlist: createSupabaseCollectionRepository({
      table: 'playlists',
      fields: ['platform', 'url', 'name', 'createdBy', 'imageUrl', 'addedAt'],
      orderBy: { column: 'added_at', ascending: false },
    }),

    activityEvent: createSupabaseCollectionRepository({
      table: 'activity_events',
      fields: ['type', 'description', 'profileIndex', 'createdAt'],
      orderBy: { column: 'created_at', ascending: false },
    }),
  }
}
