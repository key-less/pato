import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'
import { unwrap } from './mapping.js'

const TABLE = 'app_state'

/** Una fila por pareja, con couple_id como clave primaria. */
export function createSupabaseAppStateRepository() {
  const client = requireSupabase()

  return {
    async get() {
      const coupleId = await requireCoupleId()
      const row = unwrap(TABLE, await client
        .from(TABLE)
        .select('*')
        .eq('couple_id', coupleId)
        .maybeSingle())

      if (!row) return null

      return {
        metSince: row.met_since,
        currentRelationshipStatusId: row.current_relationship_status_id ?? '',
        relationshipStatuses: row.relationship_statuses ?? [],
        showCoupleSummary: row.show_couple_summary,
      }
    },

    async save(state) {
      const coupleId = await requireCoupleId()
      unwrap(TABLE, await client.from(TABLE).upsert({
        couple_id: coupleId,
        met_since: state.metSince || null,
        current_relationship_status_id: state.currentRelationshipStatusId ?? '',
        relationship_statuses: state.relationshipStatuses ?? [],
        show_couple_summary: state.showCoupleSummary !== false,
        updated_at: new Date().toISOString(),
      }))
    },
  }
}
