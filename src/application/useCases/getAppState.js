import { createAppState } from '../../domain/entities/AppState.js'
import { DEFAULT_STATUSES } from '../../domain/entities/RelationshipStatus.js'

/**
 * Obtiene el estado de la app (fecha inicio, citas, estado relación).
 * Si no existe, devuelve valores por defecto.
 * @param {import('../../domain/repositories/AppStateRepository.js')} appStateRepository
 */
export function getAppState(appStateRepository) {
  return async function execute() {
    const stored = await appStateRepository.get()
    if (stored && stored.metSince) {
      return stored
    }
    const defaultState = createAppState({
      metSince: new Date().toISOString().slice(0, 10),
      datesCount: 0,
      currentRelationshipStatusId: DEFAULT_STATUSES[0]?.id ?? '',
      relationshipStatuses: DEFAULT_STATUSES,
    })
    await appStateRepository.save(defaultState)
    return defaultState
  }
}
