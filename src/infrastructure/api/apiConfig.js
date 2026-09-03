/**
 * Configuración compartida del cliente HTTP hacia el backend.
 *
 * Un solo lugar resuelve la URL base y las cabeceras, para que `playlistApi` y
 * `sendEmailApi` no puedan divergir (antes cada uno tenía su propia copia y
 * solo uno normalizaba el protocolo).
 *
 * Resolución de la URL base, en orden:
 *   1. `VITE_API_URL` — inyectada por Vite en build time. Obligatoria en producción.
 *   2. Host actual + puerto 3001 — sirve para desarrollo local y para abrir la app
 *      desde el móvil en la misma WiFi (`http://192.168.x.x:5173` → API en `:3001`).
 */
export const API_BASE = (() => {
  const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined
  if (fromEnv) {
    let url = String(fromEnv).trim().replace(/\/+$/, '')
    // Sin protocolo (ej. "api.midominio.com") se asume HTTPS: en producción el
    // frontend va por HTTPS y un http:// sería bloqueado como contenido mixto.
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
    return url
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`
  }
  return ''
})()

/**
 * Cabeceras de autenticación hacia el backend.
 *
 * OJO: `VITE_API_SECRET` se incrusta en el bundle JavaScript durante el build, así
 * que es visible para cualquiera que abra las herramientas de desarrollo. No es un
 * secreto real ni sustituye a la autenticación: solo añade fricción frente a bots
 * que descubran la API por escaneo. La protección efectiva del backend son CORS,
 * el rate limiting y la lista de destinatarios permitidos.
 */
export function apiHeaders(extra) {
  const secret = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_SECRET) || ''
  const headers = { ...(extra || {}) }
  if (secret) headers['x-api-key'] = secret
  return headers
}

/** true si hay un backend al que apuntar. */
export function isApiConfigured() {
  return Boolean(API_BASE)
}
