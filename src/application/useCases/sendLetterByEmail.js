/**
 * Genera un mailto: con asunto y cuerpo para abrir el cliente de correo.
 * No envía el correo por sí mismo (eso lo hace el cliente del usuario).
 * @returns {string} URL mailto
 */
export function buildMailtoUrl(email, subject, body) {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString()
  return `mailto:${email}${query ? `?${query}` : ''}`
}
