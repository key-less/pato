import { defineRepository } from './defineRepository.js'

/**
 * Puerto para el estado de la app (metSince, datesCount, estado de la relación).
 *
 * Es el único contrato con `get` en lugar de `getAll`: guarda un solo objeto, no una
 * colección.
 *
 * Contrato:
 * - `get(): Promise<AppState | null>`
 * - `save(state: AppState): Promise<void>`
 */
export const createAppStateRepository = defineRepository('AppStateRepository', ['get', 'save'])
