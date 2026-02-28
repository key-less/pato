/**
 * @typedef { 'photo' | 'video' } MediaType
 */

/**
 * Entidad de medio (foto o video) del álbum.
 * @param {Object} props
 * @param {string} props.id
 * @param {MediaType} props.type
 * @param {string} props.src - URL base64 o blob
 * @param {string} [props.thumbnail]
 * @param {string} [props.date] - ISO date
 * @param {string} [props.relationshipStatusId] - ID del estado de relación al momento de la foto
 * @param {string} [props.caption]
 * @param {boolean} [props.showOnLanding] - Si es true, la foto aparece flotando en la página principal
 */
export function createMedia({ id, type, src, thumbnail, date, relationshipStatusId, caption, showOnLanding }) {
  return {
    id,
    type,
    src,
    thumbnail: thumbnail ?? null,
    date: date ?? null,
    relationshipStatusId: relationshipStatusId ?? null,
    caption: caption ?? '',
    showOnLanding: showOnLanding ?? false,
  }
}
