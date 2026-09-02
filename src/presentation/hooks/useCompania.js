import { useState, useEffect, useRef } from 'react'
import { container } from '../../infrastructure/di/container.js'

/**
 * Si la otra persona tiene la app abierta ahora mismo.
 *
 * `saludo` sube cada vez que llega: es lo que dispara la onda. Se cuenta en vez de
 * usar un booleano para que dos llegadas seguidas se vean las dos.
 */
export function useCompania() {
  const [acompanado, setAcompanado] = useState(false)
  const [saludo, setSaludo] = useState(0)
  const estabaAcompanado = useRef(false)

  useEffect(() => {
    if (!container.subscribePresence) return undefined

    let vivo = true
    let darseDeBaja = null

    container
      .subscribePresence(({ acompanado: ahora }) => {
        if (!vivo) return
        if (!estabaAcompanado.current && ahora) setSaludo((veces) => veces + 1)
        estabaAcompanado.current = ahora
        setAcompanado(ahora)
      })
      .then((baja) => {
        if (vivo) darseDeBaja = baja
        else baja()
      })
      .catch(() => {})

    return () => {
      vivo = false
      darseDeBaja?.()
    }
  }, [])

  return { acompanado, saludo }
}
