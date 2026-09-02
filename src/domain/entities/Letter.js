/**
 * Carta.
 *
 * Con `unlocksAt` la carta queda sellada hasta ese día: se ve que llega y se ve
 * cuándo, pero no se lee. Es un regalo con fecha, no un secreto.
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.subject
 * @param {string} props.body
 * @param {string} [props.createdAt] - ISO date-time
 * @param {string} [props.unlocksAt] - 'YYYY-MM-DD'; null si se abre ya
 */
export function createLetter({ id, subject, body, createdAt, unlocksAt }) {
  return {
    id,
    subject: subject ?? '',
    body: body ?? '',
    createdAt: createdAt ?? new Date().toISOString(),
    unlocksAt: unlocksAt || null,
  }
}

/**
 * La fecha del calendario de quien mira, no la UTC.
 * Con `toISOString()` una carta para el día 14 se abriría el 13 por la noche.
 */
export function fechaLocal(momento = new Date()) {
  const mes = String(momento.getMonth() + 1).padStart(2, '0')
  const dia = String(momento.getDate()).padStart(2, '0')
  return `${momento.getFullYear()}-${mes}-${dia}`
}

/** Comparar 'YYYY-MM-DD' como texto ya ordena por fecha. */
export function estaSellada(letter, momento = new Date()) {
  if (!letter?.unlocksAt) return false
  return letter.unlocksAt > fechaLocal(momento)
}
