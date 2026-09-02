import { useState } from 'react'
import { container } from '../../infrastructure/di/container.js'
import Estanque from '../components/Estanque.jsx'
import Panel from '../components/Panel.jsx'

export default function WelcomePage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined

  const entrarConCorreo = async (event) => {
    event.preventDefault()
    if (!email.trim()) return

    setEnviando(true)
    setAviso(null)
    try {
      await container.account.signInWithEmail(email, redirectTo)
      setAviso({ tono: 'ok', texto: `Te mandamos un enlace a ${email.trim()}. Ábrelo desde este mismo teléfono.` })
    } catch (error) {
      setAviso({ tono: 'error', texto: error.message })
    } finally {
      setEnviando(false)
    }
  }

  const entrarConApple = async () => {
    setAviso(null)
    try {
      await container.account.signInWithApple(redirectTo)
    } catch (error) {
      setAviso({ tono: 'error', texto: error.message })
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-9">
          <Estanque solo label="Un pato flotando en agua quieta" className="max-w-[13rem] mx-auto" />
        </div>

        <header className="text-center mb-9">
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-pato-coral/85 mb-3">Nuestra historia</p>
          <h1 className="font-display text-5xl font-medium text-pato-agua leading-none mb-4">
            <span className="italic font-light">Pato</span>
          </h1>
          <p className="font-body text-sm text-pato-junco leading-relaxed">
            Un sitio para los dos: las fotos, las fechas, las cartas y todo lo que valga la pena guardar.
          </p>
        </header>

        <Panel className="p-6">
          <button
            type="button"
            onClick={entrarConApple}
            className="w-full py-3.5 rounded-2xl bg-pato-agua text-pato-ivory font-body font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-pato-agua/40"
          >
            Continuar con Apple
          </button>

          <div className="flex items-center gap-3 my-5" aria-hidden>
            <span className="flex-1 h-px bg-pato-shell" />
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-pato-junco">o</span>
            <span className="flex-1 h-px bg-pato-shell" />
          </div>

          <form onSubmit={entrarConCorreo}>
            <label htmlFor="correo" className="block font-body text-xs font-medium text-pato-junco mb-2">
              Tu correo
            </label>
            <input
              id="correo"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@correo.com"
              className="w-full rounded-2xl border border-pato-shell bg-white px-4 py-3 font-body text-pato-agua placeholder-pato-junco/60 focus:outline-none focus:ring-2 focus:ring-pato-coral/40 mb-3"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3.5 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors"
            >
              {enviando ? 'Enviando…' : 'Enviarme un enlace'}
            </button>
          </form>

          {aviso && (
            <p
              role="alert"
              className={`font-body text-sm mt-4 leading-relaxed ${aviso.tono === 'error' ? 'text-pato-terra' : 'text-pato-agua'}`}
            >
              {aviso.texto}
            </p>
          )}
        </Panel>

        <p className="font-body text-xs text-pato-junco/80 text-center mt-6 leading-relaxed">
          Sin contraseñas que recordar. El enlace caduca y solo sirve una vez.
        </p>
      </div>
    </main>
  )
}
