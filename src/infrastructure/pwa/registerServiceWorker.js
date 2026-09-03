/**
 * Registra el service worker que da a Pato su modo sin conexión.
 *
 * Solo en producción: en desarrollo interferiría con la recarga en caliente
 * de Vite, sirviendo módulos viejos desde caché.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Sin service worker la app sigue funcionando; solo pierde el modo offline.
      console.warn('[pato] service worker no registrado:', err)
    })
  })

  // Cuando entra una versión nueva, los trozos de código con hash antiguo ya no
  // existen. Se recarga una sola vez para quedar en una versión coherente.
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}
