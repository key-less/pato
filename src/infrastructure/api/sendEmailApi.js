/**
 * URL del backend. Misma lógica que playlistApi: VITE_API_URL tiene prioridad; si no, IP/host:3001.
 */
const API_BASE = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal) {
      return `${window.location.protocol}//${host}:3001`
    }
    return `${window.location.protocol}//${host}:3001`
  }
  return ''
})()

export async function sendEmailViaApi({ to, subject, text }) {
  if (!API_BASE) {
    return { ok: false, error: 'No está configurada la URL del servidor (VITE_API_URL).' }
  }

  try {
    const res = await fetch(`${API_BASE}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: to.trim(), subject: subject || '', text: text || '' }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data.error || `Error ${res.status}` }
    }
    return data
  } catch (err) {
    return { ok: false, error: err.message || 'No se pudo conectar con el servidor. Comprueba la conexión.' }
  }
}

export function isEmailApiConfigured() {
  return Boolean(API_BASE)
}
