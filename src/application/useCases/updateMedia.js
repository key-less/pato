/**
 * Actualiza fecha, estado o caption de un medio.
 * @param {import('../../domain/repositories/MediaRepository.js')} mediaRepository
 */
export function updateMedia(mediaRepository) {
  return async function execute(id, updates) {
    const all = await mediaRepository.getAll()
    const index = all.findIndex((m) => m.id === id)
    if (index === -1) return null
    const updated = { ...all[index], ...updates }
    await mediaRepository.save(updated)
    return updated
  }
}
