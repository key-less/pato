/**
 * Playlist de Spotify o YouTube Music agregada por link.
 */
export function createPlaylist({
  id,
  platform,
  url,
  name,
  createdBy,
  imageUrl,
  addedAt,
}) {
  return {
    id: id ?? `playlist-${Date.now()}`,
    platform: platform ?? 'spotify',
    url: url ?? '',
    name: name ?? '',
    createdBy: createdBy ?? '',
    imageUrl: imageUrl ?? null,
    addedAt: addedAt ?? new Date().toISOString(),
  }
}
