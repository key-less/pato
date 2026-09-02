/**
 * @typedef { 'photo' | 'video' } MediaType
 */

/**
 * Entidad de medio (foto o video) del álbum.
 *
 * El binario vive en `blob`; `src` y `thumbnail` los añade el repositorio al leer,
 * como object URLs de la sesión, y nunca se persisten.
 *
 * @param {Object} props
 * @param {string} props.id
 * @param {MediaType} props.type
 * @param {Blob} props.blob - Archivo original
 * @param {Blob} [props.thumbnailBlob] - Miniatura para la cuadrícula
 * @param {string} [props.date] - ISO date
 * @param {string} [props.relationshipStatusId] - Estado de la relación al momento de la foto
 * @param {string} [props.caption]
 * @param {boolean} [props.showOnLanding] - Si aparece flotando en la página principal
 * @param {string} [props.createdAt] - ISO date-time, define el orden del álbum
 */
export function createMedia({
  id,
  type,
  blob,
  thumbnailBlob,
  date,
  relationshipStatusId,
  caption,
  showOnLanding,
  createdAt,
}) {
  return {
    id,
    type,
    blob: blob ?? null,
    thumbnailBlob: thumbnailBlob ?? null,
    date: date ?? null,
    relationshipStatusId: relationshipStatusId ?? null,
    caption: caption ?? '',
    showOnLanding: showOnLanding ?? false,
    createdAt: createdAt ?? new Date().toISOString(),
  }
}
