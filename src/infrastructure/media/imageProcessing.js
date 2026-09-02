/**
 * Reducción de imágenes en el cliente.
 * El álbum guarda el original más una miniatura para que la cuadrícula
 * no cargue archivos completos en memoria.
 */

export const THUMBNAIL_MAX_SIZE = 480
export const PROFILE_PHOTO_MAX_SIZE = 512

/** Lado mayor limitado a maxSize, proporción intacta. */
export function calculateThumbnailSize(width, height, maxSize) {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 }

  const largestSide = Math.max(width, height)
  if (largestSide <= maxSize) return { width, height }

  const ratio = maxSize / largestSide
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

async function drawDownscaled(blob, maxSize) {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = calculateThumbnailSize(bitmap.width, bitmap.height, maxSize)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas
}

/** Devuelve null si el archivo no se puede decodificar; la cuadrícula usa el original. */
export async function createImageThumbnail(blob, maxSize = THUMBNAIL_MAX_SIZE, quality = 0.72) {
  try {
    const canvas = await drawDownscaled(blob, maxSize)
    return await canvasToBlob(canvas, quality)
  } catch {
    return null
  }
}

export async function createDownscaledDataUrl(blob, maxSize = PROFILE_PHOTO_MAX_SIZE, quality = 0.82) {
  const canvas = await drawDownscaled(blob, maxSize)
  return canvas.toDataURL('image/jpeg', quality)
}
