import { lazy, Suspense } from 'react'
import { useSession } from '../hooks/useSession.js'
import Ondas from './Ondas.jsx'

const WelcomePage = lazy(() => import('../pages/WelcomePage.jsx'))
const PairingPage = lazy(() => import('../pages/PairingPage.jsx'))

function Pantalla({ children }) {
  return <div className="min-h-[100dvh] flex items-center justify-center px-5">{children}</div>
}

/**
 * Decide si se entra a la app, se pide sesion o se pide pareja.
 *
 * Sin Supabase configurado no hay nada que decidir: la app corre contra el
 * navegador como en la Fase 0 y este componente se aparta.
 *
 * Esperar a que la pareja acepte no bloquea: con una pareja creada se entra
 * igualmente, y el enlace de invitacion queda en Configuracion.
 */
export function AuthGate({ children }) {
  const { loading, session, membership, remoto, refrescar } = useSession()

  if (!remoto) return children

  if (loading) {
    return <Pantalla><Ondas label="Abriendo" /></Pantalla>
  }

  return (
    <Suspense fallback={<Pantalla><Ondas label="Abriendo" /></Pantalla>}>
      {!session && <WelcomePage />}
      {session && !membership && <PairingPage onListo={refrescar} />}
      {session && membership && children}
    </Suspense>
  )
}
