import { useState, useEffect } from 'react'

/**
 * Contador en vivo desde dateString (YYYY-MM-DD) hasta ahora.
 * Formato: DÍAS : HORAS : MINUTOS : SEGUNDOS.
 * Actualiza cada segundo.
 */
export function useElapsedCounter(dateString) {
  const [parts, setParts] = useState(null)

  useEffect(() => {
    if (!dateString) {
      setParts(null)
      return
    }

    function compute() {
      const start = new Date(dateString)
      start.setHours(0, 0, 0, 0)
      const now = new Date()
      let totalSec = Math.max(0, Math.floor((now - start) / 1000))

      const sec = totalSec % 60
      totalSec = Math.floor(totalSec / 60)
      const min = totalSec % 60
      totalSec = Math.floor(totalSec / 60)
      const hh = totalSec % 24
      const days = Math.floor(totalSec / 24)

      setParts({
        days,
        hours: hh,
        min,
        sec,
      })
    }

    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [dateString])

  return { parts }
}
