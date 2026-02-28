/**
 * Elimina una carta (borrador) por id.
 */
export function deleteLetter(letterRepository) {
  return async function execute(id) {
    await letterRepository.remove(id)
  }
}
