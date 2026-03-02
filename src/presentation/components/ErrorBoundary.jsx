import { Component } from 'react'

/**
 * Error boundary para producción: evita pantalla en blanco si un componente lanza.
 * Muestra un mensaje amigable y opción de recargar.
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-pato-butter text-pato-ink">
          <p className="text-lg font-medium mb-2">Algo salió mal</p>
          <p className="text-sm text-pato-muted mb-4 text-center max-w-md">
            Recarga la página para intentar de nuevo. Si el problema sigue, prueba más tarde.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-pato-peach text-pato-ink font-medium hover:opacity-90"
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
