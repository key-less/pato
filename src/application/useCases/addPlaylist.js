import { createPlaylist } from '../../domain/entities/Playlist.js'

export function addPlaylist(repository) {
  return async function execute(data) {
    const playlist = createPlaylist(data)
    await repository.save(playlist)
    return playlist
  }
}
