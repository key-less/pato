import { API_BASE, apiHeaders, isApiConfigured } from './apiConfig.js'

export async function sendEmailViaApi({ to, subject, text }) {
  if (!API_BASE) {
    return { ok: false, error: 'No está configurada la URL del servidor (VITE_API_URL).' }
  }

  try {
    const res = await fetch(`${API_BASE}/api/send-email`, {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
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
  return isApiConfigured()
}
