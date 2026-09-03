import { defineRepository } from './defineRepository.js'

/**
 * Puerto para las playlists (Spotify / YouTube).
 *
 * Contrato:
 * - `getAll(): Promise<Playlist[]>`
 * - `save(playlist: Playlist): Promise<void>` — inserta o actualiza por `id`
 * - `remove(id: string): Promise<void>`
 */
export const createPlaylistRepository = defineRepository('PlaylistRepository', ['getAll', 'save', 'remove'])
