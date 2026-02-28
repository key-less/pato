import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'

export function useAppState() {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    container.getAppState().then((data) => {
      if (!cancelled) {
        setState(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const update = async (partial) => {
    const next = await container.updateAppState(partial)
    setState(next)
    return next
  }

  return { state, loading, update }
}
