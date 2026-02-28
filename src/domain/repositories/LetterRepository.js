/**
 * Puerto para cartas (solo en memoria o persistir borradores).
 */

/**
 * @param {Object} deps
 * @param {() => Promise<import('../entities/Letter.js')[]>} deps.getAll
 * @param {(letter: import('../entities/Letter.js')) => Promise<void>} deps.save
 * @param {(id: string) => Promise<void>} deps.remove
 */
export function createLetterRepository(deps) {
  return deps
}
