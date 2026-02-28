import { createLetter } from '../../domain/entities/Letter.js'

/**
 * Guarda una carta (nueva o actualización).
 * @param {import('../../domain/repositories/LetterRepository.js')} letterRepository
 */
export function saveLetter(letterRepository) {
  return async function execute({ id, subject, body }) {
    const letter = createLetter({
      id: id ?? `letter-${Date.now()}`,
      subject: subject ?? '',
      body: body ?? '',
      createdAt: id ? undefined : new Date().toISOString(),
    })
    await letterRepository.save(letter)
    return letter
  }
}
