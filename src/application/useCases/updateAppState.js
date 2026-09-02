/**
 * Actualiza metSince, datesCount o currentRelationshipStatusId.
 * @param {import('../../domain/repositories/AppStateRepository.js')} appStateRepository
 */
export function updateAppState(appStateRepository) {
  return async function execute(partial) {
    const current = await appStateRepository.get()
    // `partial` manda: si trae estados nuevos, son los del usuario guardando desde
    // Configuración. Antes ganaba `current`, así que crear un estado personalizado no
    // hacía nada: se escribía, se pulsaba guardar y se descartaba en silencio.
    // Solo se recurre a los actuales cuando `partial` no trae estados.
    const next = {
      ...current,
      ...partial,
      relationshipStatuses:
        partial?.relationshipStatuses ?? current?.relationshipStatuses ?? [],
    }
    await appStateRepository.save(next)
    return next
  }
}
