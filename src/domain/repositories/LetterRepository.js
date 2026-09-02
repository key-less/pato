import { defineRepository } from './defineRepository.js'

/**
 * Puerto para las cartas (borradores).
 *
 * Contrato:
 * - `getAll(): Promise<Letter[]>`
 * - `save(letter: Letter): Promise<void>` — inserta o actualiza por `id`
 * - `remove(id: string): Promise<void>`
 */
export const createLetterRepository = defineRepository('LetterRepository', ['getAll', 'save', 'remove'])
