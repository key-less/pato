/**
 * URL del backend.
 * - En build de producción: usar siempre VITE_API_URL (ej. https://api.tudominio.com).
 * - En local (localhost/127.0.0.1): VITE_API_URL o http://localhost:3001.
 * - Abriendo desde IP (móvil en LAN): si no hay VITE_API_URL, usa esa IP:3001 para OAuth.
 */
export const API_BASE = (() => {
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

export async function fetchPlaylistByUrl(url) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado. En producción configura VITE_API_URL.' }
  try {
    const apiUrl = `${API_BASE}/api/playlist/fetch?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const errorMsg = data.error && String(data.error).trim() ? data.error : `Error del servidor (${res.status})`
      return { ok: false, error: errorMsg, status: res.status }
    }
    return data
  } catch (err) {
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    const hint = isProd && API_BASE && API_BASE.includes(window.location.hostname)
      ? ' En producción, configura VITE_API_URL en Netlify apuntando a tu API (Railway).'
      : ''
    return { ok: false, error: (err.message || 'No se pudo conectar con el servidor.') + hint }
  }
}

/** Ahora suena por servicio (formato legacy: un solo usuario). */
export async function fetchNowPlaying(service) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado.' }
  try {
    const res = await fetch(`${API_BASE}/api/now-playing/${service}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data.error }
    return data
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
}

/** Ahora suena por perfiles: { ok, profiles: [ { profileIndex, track?, error? } ] } */
export async function fetchNowPlayingByProfiles(service) {
  if (!API_BASE) return { ok: false, profiles: [] }
  try {
    const res = await fetch(`${API_BASE}/api/now-playing/${service}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, profiles: [] }
    return data
  } catch {
    return { ok: false, profiles: [] }
  }
}
