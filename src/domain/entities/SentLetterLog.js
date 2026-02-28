/**
 * Registro de una carta enviada por correo (para historial).
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.letterId - ID de la carta original
 * @param {string} props.subject
 * @param {string} [props.bodyPreview] - Primeras líneas del cuerpo
 * @param {string} props.sentAt - ISO date-time
 */
export function createSentLetterLog({ id, letterId, subject, bodyPreview, sentAt }) {
  return {
    id,
    letterId,
    subject: subject ?? '',
    bodyPreview: bodyPreview ?? '',
    sentAt,
  }
}
