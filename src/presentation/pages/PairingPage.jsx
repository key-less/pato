import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import Estanque from '../components/Estanque.jsx'
import Panel from '../components/Panel.jsx'

/**
 * El momento en que dos personas se unen.
 *
 * Mientras falta alguien, hay un solo pato en el agua. Cuando la otra persona
 * canjea la invitacion, llega el segundo.
 */
/** El enlace que se comparte trae el token en la query. */
function tokenDeLaUrl() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('invitacion') ?? ''
}

export default function PairingPage({ membership, onListo }) {
  const invitado = tokenDeLaUrl()
  const [vista, setVista] = useState(() => {
    if (membership) return 'invitar'
    return invitado ? 'canjear' : 'elegir'
  })
  const [nombre, setNombre] = useState('')
  const [token, setToken] = useState(invitado)
  const [invitacion, setInvitacion] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!invitado) return
    const limpia = new URL(window.location.href)
    limpia.searchParams.delete('invitacion')
    window.history.replaceState({}, '', limpia)
  }, [invitado])

  const ejecutar = async (accion) => {
    setOcupado(true)
    setError(null)
    try {
      await accion()
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const crearPareja = () => ejecutar(async () => {
    await container.account.createCouple(nombre)
    setInvitacion(await container.account.createInvite())
    setVista('invitar')
  })

  const generarInvitacion = () => ejecutar(async () => {
    setInvitacion(await container.account.createInvite())
  })

  const canjear = () => ejecutar(async () => {
    await container.account.redeemInvite(token, nombre)
    await onListo()
  })

  const enlaceInvitacion = invitacion
    ? `${window.location.origin}/?invitacion=${invitacion.token}`
    : null

  const copiar = async () => {
    await navigator.clipboard.writeText(enlaceInvitacion)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-9">
          <Estanque solo className="max-w-[13rem] mx-auto" />
        </div>

        <header className="text-center mb-8">
          <h1 className="font-display text-3xl font-medium text-pato-agua leading-tight mb-3">
            {vista === 'invitar' ? (
              <><span className="italic font-light">Falta</span> alguien</>
            ) : (
              <><span className="italic font-light">Vuestro</span> espacio</>
            )}
          </h1>
          <p className="font-body text-sm text-pato-junco leading-relaxed">
            {vista === 'invitar'
              ? 'Mándale este enlace a tu pareja. Cuando entre, aparecerá el segundo pato.'
              : 'Uno de los dos lo crea y le pasa la invitación al otro.'}
          </p>
        </header>

        <Panel className="p-6">
          {vista === 'elegir' && (
            <>
              <label htmlFor="nombre" className="block font-body text-xs font-medium text-pato-junco mb-2">
                ¿Cómo te llamas?
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-2xl border border-pato-shell bg-white px-4 py-3 font-body text-pato-agua placeholder-pato-junco/60 focus:outline-none focus:ring-2 focus:ring-pato-coral/40 mb-4"
              />
              <button
                type="button"
                onClick={crearPareja}
                disabled={ocupado}
                className="w-full py-3.5 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors mb-3"
              >
                {ocupado ? 'Creando…' : 'Crear nuestro espacio'}
              </button>
              <button
                type="button"
                onClick={() => setVista('canjear')}
                className="w-full py-3 rounded-2xl bg-transparent text-pato-agua font-body text-sm hover:bg-pato-shell/40 transition-colors"
              >
                Ya tengo una invitación
              </button>
            </>
          )}

          {vista === 'canjear' && (
            <>
              <label htmlFor="nombre-canje" className="block font-body text-xs font-medium text-pato-junco mb-2">
                ¿Cómo te llamas?
              </label>
              <input
                id="nombre-canje"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-2xl border border-pato-shell bg-white px-4 py-3 font-body text-pato-agua placeholder-pato-junco/60 focus:outline-none focus:ring-2 focus:ring-pato-coral/40 mb-4"
              />
              <label htmlFor="token" className="block font-body text-xs font-medium text-pato-junco mb-2">
                Código de la invitación
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pégalo aquí"
                autoComplete="off"
                spellCheck="false"
                className="w-full rounded-2xl border border-pato-shell bg-white px-4 py-3 font-mono text-xs text-pato-agua placeholder-pato-junco/60 focus:outline-none focus:ring-2 focus:ring-pato-coral/40 mb-4"
              />
              <button
                type="button"
                onClick={canjear}
                disabled={ocupado || !token.trim()}
                className="w-full py-3.5 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors mb-3"
              >
                {ocupado ? 'Entrando…' : 'Unirme'}
              </button>
              <button
                type="button"
                onClick={() => setVista('elegir')}
                className="w-full py-3 rounded-2xl text-pato-agua font-body text-sm hover:bg-pato-shell/40 transition-colors"
              >
                Volver
              </button>
            </>
          )}

          {vista === 'invitar' && (
            <>
              {enlaceInvitacion ? (
                <>
                  <p className="font-body text-xs font-medium text-pato-junco mb-2">Enlace de invitación</p>
                  <p className="rounded-2xl border border-pato-shell bg-white px-4 py-3 font-mono text-[11px] text-pato-agua break-all mb-3">
                    {enlaceInvitacion}
                  </p>
                  <button
                    type="button"
                    onClick={copiar}
                    className="w-full py-3.5 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors mb-3"
                  >
                    {copiado ? '✓ Copiado' : 'Copiar enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={onListo}
                    className="w-full py-3 rounded-2xl text-pato-agua font-body text-sm hover:bg-pato-shell/40 transition-colors mb-3"
                  >
                    Entrar mientras tanto
                  </button>
                  <p className="font-body text-xs text-pato-junco leading-relaxed">
                    Caduca en 24 horas y solo sirve una vez. Si generas otro, el anterior deja de valer.
                    El enlace sigue disponible en Configuración.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  onClick={generarInvitacion}
                  disabled={ocupado}
                  className="w-full py-3.5 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors"
                >
                  {ocupado ? 'Generando…' : 'Crear invitación'}
                </button>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="font-body text-sm text-pato-terra mt-4 leading-relaxed">{error}</p>
          )}
        </Panel>
      </div>
    </main>
  )
}
