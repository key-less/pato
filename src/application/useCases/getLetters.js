/**
 * Lista todas las cartas (borradores).
 * @param {import('../../domain/repositories/LetterRepository.js')} letterRepository
 */
export function getLetters(letterRepository) {
  return async function execute() {
    return letterRepository.getAll()
  }
}
