import { useEffect, useState } from 'react'

/**
 * Detecta cómo se está ejecutando Pato: instalada en la pantalla de inicio
 * (standalone) o dentro del navegador, y si el dispositivo es iOS.
 *
 * iOS antiguo no expone `display-mode: standalone`, así que se comprueba
 * también `navigator.standalone`, que es la vía propia de Safari.
 */
export function useStandalone() {
  const [state, setState] = useState(() => detect())

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setState(detect())
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return state
}

function detect() {
  if (typeof window === 'undefined') {
    return { isStandalone: false, isIOS: false, canInstall: false }
  }

  const ua = window.navigator.userAgent || ''
  // iPadOS 13+ se identifica como Mac; se distingue por el soporte táctil.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)

  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true

  return {
    isIOS,
    isStandalone,
    // En iOS solo se puede instalar desde Safari, con "Añadir a inicio".
    canInstall: isIOS && !isStandalone,
  }
}
