import { defineRepository } from './defineRepository.js'

/**
 * Puerto para las citas registradas.
 *
 * Contrato:
 * - `getAll(): Promise<Cita[]>`
 * - `save(cita: Cita): Promise<void>` — inserta o actualiza por `id`
 * - `remove(id: string): Promise<void>`
 */
export const createCitaRepository = defineRepository('CitaRepository', ['getAll', 'save', 'remove'])
