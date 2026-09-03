import { defineRepository } from './defineRepository.js'

/**
 * Puerto para los eventos del feed de actividad.
 *
 * Contrato:
 * - `getAll(): Promise<ActivityEvent[]>` — sin orden garantizado; ordena el caso de uso
 * - `save(event: ActivityEvent): Promise<void>` — inserta o actualiza por `id`
 * - `remove(id: string): Promise<void>`
 */
export const createActivityEventRepository = defineRepository('ActivityEventRepository', [
  'getAll',
  'save',
  'remove',
])
