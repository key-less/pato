/**
 * Obtiene el historial de cartas enviadas (más recientes primero).
 */
export function getSentLetterLogs(sentLetterLogRepository) {
  return async function execute() {
    return sentLetterLogRepository.getAll()
  }
}
