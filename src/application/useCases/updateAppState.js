/**
 * Actualiza metSince, datesCount o currentRelationshipStatusId.
 * @param {import('../../domain/repositories/AppStateRepository.js')} appStateRepository
 */
export function updateAppState(appStateRepository) {
  return async function execute(partial) {
    const current = await appStateRepository.get()
    const next = {
      ...current,
      ...partial,
      relationshipStatuses: current?.relationshipStatuses ?? partial.relationshipStatuses ?? [],
    }
    await appStateRepository.save(next)
    return next
  }
}
