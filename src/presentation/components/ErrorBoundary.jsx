import { Component } from 'react'

/**
 * Error boundary para producción: evita pantalla en blanco si un componente lanza.
 * Muestra un mensaje amigable y opción de recargar, dentro del mismo lenguaje
 * visual de la app para que un fallo no parezca otra aplicación.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-pato-charcoal"
          style={{
            background: 'var(--app-bg)',
            paddingTop: 'max(1.5rem, var(--safe-top))',
            paddingBottom: 'max(1.5rem, var(--safe-bottom))',
          }}
        >
          <div className="glass-3 rounded-3xl px-6 py-8 max-w-sm w-full text-center">
            <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-soft" />
            <p className="font-display text-2xl mb-2">Algo salió mal</p>
            <p className="font-body text-sm text-pato-smoke mb-6">
              Recarga la página para intentar de nuevo. Si el problema sigue, prueba más tarde.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors tappable"
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
