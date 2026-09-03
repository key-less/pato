import { API_BASE, apiHeaders } from './apiConfig.js'

export { API_BASE }

export async function fetchPlaylistByUrl(url) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado. En producción configura VITE_API_URL.' }
  try {
    const apiUrl = `${API_BASE}/api/playlist/fetch?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl, { headers: apiHeaders() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const errorMsg = data.error && String(data.error).trim() ? data.error : `Error del servidor (${res.status})`
      return { ok: false, error: errorMsg, status: res.status }
    }
    return data
  } catch (err) {
    // Si la app se sirve desde un dominio público pero API_BASE apunta a ese mismo
    // host, es que falta VITE_API_URL en el build: el backend vive en otro servicio.
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    const hint = isProd && API_BASE && API_BASE.includes(window.location.hostname)
      ? ' En producción, configura VITE_API_URL en Vercel apuntando a tu API en Render.'
      : ''
    return { ok: false, error: (err.message || 'No se pudo conectar con el servidor.') + hint }
  }
}

/** Ahora suena por servicio (formato legacy: un solo usuario). */
export async function fetchNowPlaying(service) {
  if (!API_BASE) return { ok: false, error: 'Servidor no configurado.' }
  try {
    const res = await fetch(`${API_BASE}/api/now-playing/${service}`, { headers: apiHeaders() })
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
    const res = await fetch(`${API_BASE}/api/now-playing/${service}`, { headers: apiHeaders() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, profiles: Array.isArray(data.profiles) ? data.profiles : [] }
    const profiles = Array.isArray(data.profiles) ? data.profiles : []
    return { ok: !!data.ok, profiles }
  } catch (_err) {
    return { ok: false, profiles: [] }
  }
}
