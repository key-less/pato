/**
 * URL del backend. Si abres la app desde una IP (ej. http://10.0.0.56:5173), siempre se usa
 * esa IP para el API, así el OAuth de Spotify/YouTube no redirige a localhost en el móvil.
 * En PC con localhost:5173 se usa VITE_API_URL o localhost:3001.
 */
export const API_BASE = (() => {
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

export async function fetchPlaylistByUrl(url) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado (VITE_API_URL).' }
  const res = await fetch(`${API_BASE}/api/playlist/fetch?url=${encodeURIComponent(url)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error || `Error ${res.status}` }
  return data
}

/** Ahora suena por servicio (formato legacy: un solo usuario). */
export async function fetchNowPlaying(service) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado.' }
  const res = await fetch(`${API_BASE}/api/now-playing/${service}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error }
  return data
}

/** Ahora suena por perfiles: { ok, profiles: [ { profileIndex, track?, error? } ] } */
export async function fetchNowPlayingByProfiles(service) {
  if (!API_BASE) return { ok: false, profiles: [] }
  const res = await fetch(`${API_BASE}/api/now-playing/${service}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, profiles: [] }
  return data
}
