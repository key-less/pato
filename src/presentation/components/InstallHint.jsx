import { useEffect, useState } from 'react'
import { useStandalone } from '../hooks/useStandalone.js'

const DISMISSED_KEY = 'pato:install-hint-dismissed'

/**
 * Aviso para instalar Pato en la pantalla de inicio.
 *
 * iOS no expone `beforeinstallprompt`, así que no hay forma de lanzar la
 * instalación por código: lo único posible es enseñar el gesto. Se muestra una
 * sola vez, se puede descartar, y desaparece solo en cuanto la app corre en
 * modo standalone.
 */
export function InstallHint() {
  const { canInstall } = useStandalone()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!canInstall) return
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
      /* modo privado de Safari: sin almacenamiento, se muestra igual */
    }
    if (dismissed) return
    // Un respiro antes de aparecer: no compite con la carga de la pantalla.
    const t = setTimeout(() => setVisible(true), 1600)
    return () => clearTimeout(t)
  }, [canInstall])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      /* sin almacenamiento el aviso volverá a salir: es aceptable */
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar Pato en la pantalla de inicio"
      className="sm:hidden fixed left-3 right-3 z-50 rounded-3xl px-4 py-3.5 glass-3 animate-slide-up pato-chrome"
      style={{ bottom: 'calc(var(--tabbar-h) + 0.75rem)' }}
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-2xl shrink-0 shadow-soft" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight text-pato-charcoal">Ten a Pato a mano</p>
          <p className="text-[13px] leading-snug text-pato-smoke mt-0.5">
            Toca <ShareGlyph /> <span className="font-medium">Compartir</span> y luego{' '}
            <span className="font-medium">Añadir a inicio</span>: se abre a pantalla completa y sin
            conexión.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Descartar aviso"
          className="shrink-0 w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-pato-smoke tappable"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** Icono de "Compartir" de iOS, para que el gesto se reconozca de un vistazo. */
function ShareGlyph() {
  return (
    <svg
      className="inline-block align-[-2px] mx-[1px]"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15.2V3.4M12 3.4 8.2 7.2M12 3.4l3.8 3.8" />
      <path d="M6.6 10.4H5.4a1.6 1.6 0 0 0-1.6 1.6v7a1.6 1.6 0 0 0 1.6 1.6h13.2a1.6 1.6 0 0 0 1.6-1.6v-7a1.6 1.6 0 0 0-1.6-1.6h-1.2" />
    </svg>
  )
}
