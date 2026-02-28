/**
 * Envía un correo a través del backend. Misma lógica que playlistApi: si la página se abre
 * desde una IP (móvil en LAN), usa esa IP para el API; en localhost usa VITE_API_URL.
 */
const API_BASE = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal) {
      return `${window.location.protocol}//${host}:3001`
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`
  }
  return ''
})()

export async function sendEmailViaApi({ to, subject, text }) {
  if (!API_BASE) {
    return { ok: false, error: 'No está configurada la URL del servidor (VITE_API_URL).' }
  }

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
}

export function isEmailApiConfigured() {
  return Boolean(API_BASE)
}
