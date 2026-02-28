/**
 * Estado predefinido de la relación.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {number} [props.order]
 */
export function createRelationshipStatus({ id, label, order = 0 }) {
  return { id, label, order }
}

export const DEFAULT_STATUSES = [
  createRelationshipStatus({ id: 'conociendose', label: 'Conociéndonos', order: 1 }),
  createRelationshipStatus({ id: 'poniendose_serio', label: 'Se va poniendo serio', order: 2 }),
  createRelationshipStatus({ id: 'ya_casi', label: 'Ya casi', order: 3 }),
  createRelationshipStatus({ id: 'somos_pareja', label: 'Somos pareja', order: 4 }),
  createRelationshipStatus({ id: 'casados', label: 'Estamos casados', order: 5 }),
]
