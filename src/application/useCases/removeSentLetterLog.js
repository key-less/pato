/**
 * Elimina una entrada del historial de cartas enviadas.
 */
export function removeSentLetterLog(sentLetterLogRepository) {
  return async function execute(id) {
    await sentLetterLogRepository.remove(id)
  }
}
