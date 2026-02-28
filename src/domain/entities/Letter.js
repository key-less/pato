/**
 * Carta para enviar por correo.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.subject
 * @param {string} props.body
 * @param {string} [props.createdAt] - ISO date
 */
export function createLetter({ id, subject, body, createdAt }) {
  return {
    id,
    subject: subject ?? '',
    body: body ?? '',
    createdAt: createdAt ?? new Date().toISOString(),
  }
}
