import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'

/**
 * URL para mostrar un medio.
 *
 * Prefiere la miniatura, que ya viene cargada con el listado. Solo pide el
 * archivo original cuando hace falta de verdad (videos, o fotos migradas del
 * album antiguo que aun no tienen miniatura), para que abrir la galeria no
 * cargue todos los archivos en memoria.
 */
export function useMediaUrl(item, { original = false } = {}) {
  const preferred = original ? null : item.thumbnail
  const [url, setUrl] = useState(preferred)

  useEffect(() => {
    if (preferred) {
      setUrl(preferred)
      return undefined
    }

    let cancelled = false
    container.getMediaFileUrl(item.id).then((fileUrl) => {
      if (!cancelled) setUrl(fileUrl)
    })
    return () => {
      cancelled = true
    }
  }, [item.id, preferred])

  return url
}
