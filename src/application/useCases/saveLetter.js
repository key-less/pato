import { createLetter } from '../../domain/entities/Letter.js'

/**
 * Guarda una carta, nueva o editada.
 *
 * Al editar conserva la fecha de creacion original: antes se rehacia con la de
 * ahora, asi que corregir una falta movia la carta al principio de la lista y
 * perdia el dia en que se escribio.
 *
 * @param {import('../../domain/repositories/LetterRepository.js')} letterRepository
 */
export function saveLetter(letterRepository) {
  return async function execute({ id, subject, body, unlocksAt }) {
    const existente = id
      ? (await letterRepository.getAll()).find((letter) => letter.id === id)
      : null

    const letter = createLetter({
      id: id ?? `letter-${Date.now()}`,
      subject,
      body,
      unlocksAt,
      createdAt: existente?.createdAt ?? undefined,
    })

    await letterRepository.save(letter)
    return letter
  }
}
