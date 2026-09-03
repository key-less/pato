import { useCallback, useRef } from 'react'

/**
 * Retroalimentación háptica para toques.
 *
 * Android y Chrome exponen `navigator.vibrate`. Safari en iOS no lo implementa,
 * pero desde iOS 17.4 un `<input type="checkbox" switch>` sí produce un toque
 * háptico al conmutar; se usa un interruptor oculto como disparador.
 *
 * Si nada de eso está disponible la función no hace nada: la interfaz nunca
 * depende de que la háptica funcione.
 */
const PATTERNS = { light: 8, medium: 18, heavy: 32, success: [10, 40, 14] }

export function useHaptics() {
  const switchRef = useRef(null)

  const impact = useCallback((kind = 'light') => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(PATTERNS[kind] ?? PATTERNS.light)
        return
      }
      iosSwitchTap(switchRef)
    } catch {
      /* la háptica es un extra: nunca debe romper la interacción */
    }
  }, [])

  return impact
}

function iosSwitchTap(ref) {
  if (typeof document === 'undefined') return

  if (!ref.current) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.setAttribute('aria-hidden', 'true')
    input.tabIndex = -1
    Object.assign(input.style, {
      position: 'fixed',
      top: '-100px',
      left: '-100px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
    })
    document.body.appendChild(input)
    ref.current = input
  }

  ref.current.checked = !ref.current.checked
  ref.current.dispatchEvent(new Event('change', { bubbles: false }))
}
