import { useState, useEffect } from 'react'

/**
 * Calcula días entre una fecha (YYYY-MM-DD) y hoy.
 * Actualiza cada minuto para que el contador no quede desfasado.
 */
export function useDaysSince(dateString) {
  const [days, setDays] = useState(null)

  useEffect(() => {
    if (!dateString) {
      setDays(null)
      return
    }

    function compute() {
      const start = new Date(dateString)
      start.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diff = today - start
      setDays(Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000))))
    }

    compute()
    const id = setInterval(compute, 60 * 1000)
    return () => clearInterval(id)
  }, [dateString])

  return days
}
