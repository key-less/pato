import { useState, useEffect, useCallback } from 'react'
import { container } from '../../infrastructure/di/container.js'

const SIN_CUENTAS = { loading: false, session: null, membership: null, remoto: false }

/**
 * Sesion y pareja.
 *
 * Sin Supabase configurado no hay cuentas: la app corre contra el navegador como en
 * la Fase 0 y este hook lo dice con `remoto: false`, para que nadie muestre una
 * pantalla de login que no lleva a ninguna parte.
 */
export function useSession() {
  const cuentas = container.account
  const [estado, setEstado] = useState(() =>
    cuentas ? { loading: true, session: null, membership: null, remoto: true } : SIN_CUENTAS
  )

  const refrescar = useCallback(async () => {
    if (!cuentas) return
    const session = await cuentas.getSession()
    const membership = session ? await cuentas.getMembership() : null
    setEstado({ loading: false, session, membership, remoto: true })
  }, [cuentas])

  useEffect(() => {
    if (!cuentas) return undefined

    let cancelado = false

    const cargar = async () => {
      try {
        const session = await cuentas.getSession()
        const membership = session ? await cuentas.getMembership() : null
        if (!cancelado) setEstado({ loading: false, session, membership, remoto: true })
      } catch {
        if (!cancelado) setEstado({ loading: false, session: null, membership: null, remoto: true })
      }
    }

    cargar()
    const cancelarSuscripcion = cuentas.onAuthChange(() => { cargar() })

    return () => {
      cancelado = true
      cancelarSuscripcion()
    }
  }, [cuentas])

  return { ...estado, refrescar }
}
