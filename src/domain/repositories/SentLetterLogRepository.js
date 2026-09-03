import { defineRepository } from './defineRepository.js'

/**
 * Puerto para el historial de cartas enviadas.
 *
 * Contrato:
 * - `getAll(): Promise<SentLetterLog[]>` — más recientes primero
 * - `save(log: SentLetterLog): Promise<void>` — solo añade
 * - `remove(id: string): Promise<void>`
 */
export const createSentLetterLogRepository = defineRepository('SentLetterLogRepository', [
  'getAll',
  'save',
  'remove',
])
