import { useState } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { useSession } from '../hooks/useSession.js'
import Panel from './Panel.jsx'

const CONFIRMAR_BORRADO =
  'Esto borra tu cuenta para siempre. Si tu pareja sigue dentro, los recuerdos se quedan con ella; si eras la última persona, se borra todo. ¿Seguro?'

/** Cuenta y pareja. En modo local no hay nada que mostrar. */
export function AccountPanel() {
  const { membership, remoto, refrescar } = useSession()
  const [invitacion, setInvitacion] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  if (!remoto || !membership) return null

  const enlace = invitacion ? `${window.location.origin}/?invitacion=${invitacion.token}` : null

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

  const invitar = () => ejecutar(async () => {
    setInvitacion(await container.account.createInvite())
  })

  const copiar = async () => {
    await navigator.clipboard.writeText(enlace)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const cerrarSesion = () => ejecutar(async () => {
    await container.account.signOut()
    await refrescar()
  })

  const borrarCuenta = () => {
    if (!window.confirm(CONFIRMAR_BORRADO)) return
    return ejecutar(async () => {
      await container.account.deleteAccount()
      window.location.reload()
    })
  }

  return (
    <Panel className="p-6">
      <h2 className="font-display text-xl text-pato-agua mb-4">Vuestra cuenta</h2>

      <ul className="mb-5 space-y-2">
        {membership.members.map((miembro) => (
          <li key={miembro.userId} className="flex items-center gap-3 font-body text-sm text-pato-agua">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-pato-coral" />
            {miembro.displayName || (miembro.slot === membership.slot ? 'Tú' : 'Tu pareja')}
          </li>
        ))}
      </ul>

      {!membership.isComplete && (
        <div className="mb-5 pb-5 border-b border-pato-shell">
          <p className="font-body text-sm text-pato-junco mb-3 leading-relaxed">
            Todavía falta la otra persona. Mándale este enlace y aparecerá el segundo pato.
          </p>
          {enlace ? (
            <>
              <p className="rounded-2xl border border-pato-shell bg-white px-4 py-3 font-mono text-[11px] text-pato-agua break-all mb-3">
                {enlace}
              </p>
              <button
                type="button"
                onClick={copiar}
                className="w-full py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors"
              >
                {copiado ? '✓ Copiado' : 'Copiar enlace'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={invitar}
              disabled={ocupado}
              className="w-full py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors"
            >
              {ocupado ? 'Generando…' : 'Crear invitación'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={cerrarSesion}
          disabled={ocupado}
          className="flex-1 py-3 rounded-2xl bg-pato-shell/60 text-pato-agua font-body font-medium hover:bg-pato-shell disabled:opacity-60 transition-colors"
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          onClick={borrarCuenta}
          disabled={ocupado}
          className="flex-1 py-3 rounded-2xl bg-transparent border border-pato-terra/40 text-pato-terra font-body font-medium hover:bg-pato-terra/10 disabled:opacity-60 transition-colors"
        >
          Borrar mi cuenta
        </button>
      </div>

      {error && <p role="alert" className="font-body text-sm text-pato-terra mt-4">{error}</p>}
    </Panel>
  )
}
