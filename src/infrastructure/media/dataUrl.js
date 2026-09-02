/**
 * Conversión entre data URL y bytes.
 * Se usa para migrar el álbum antiguo y para las copias de seguridad.
 */

const DATA_URL_PATTERN = /^data:([^;,]*)(;base64)?,([\s\S]*)$/
const BASE64_CHUNK = 0x8000

/** @returns {{ buffer: ArrayBuffer, type: string } | null} */
export function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null
  const match = DATA_URL_PATTERN.exec(dataUrl)
  if (!match) return null

  const [, mediaType, base64Flag, payload] = match
  const type = mediaType || 'application/octet-stream'

  try {
    const binary = base64Flag ? atob(payload) : decodeURIComponent(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return { buffer: bytes.buffer, type }
  } catch {
    return null
  }
}

export function dataUrlToBlob(dataUrl) {
  const decoded = decodeDataUrl(dataUrl)
  return decoded ? new Blob([decoded.buffer], { type: decoded.type }) : null
}

/** Por bloques: String.fromCharCode desborda la pila con archivos grandes. */
export function bufferToDataUrl(buffer, type) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  }
  return `data:${type || 'application/octet-stream'};base64,${btoa(binary)}`
}
