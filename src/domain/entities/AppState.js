/**
 * Estado global de la app (fecha de inicio, citas, estado actual).
 * @param {Object} props
 * @param {string} props.metSince - ISO date
 * @param {number} props.datesCount
 * @param {string} props.currentRelationshipStatusId
 * @param {Array} props.relationshipStatuses - lista de RelationshipStatus
 */
export function createAppState({
  metSince,
  datesCount = 0,
  currentRelationshipStatusId = '',
  relationshipStatuses = [],
}) {
  return {
    metSince,
    datesCount,
    currentRelationshipStatusId,
    relationshipStatuses,
  }
}
