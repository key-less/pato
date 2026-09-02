import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'
import { entityToRow, rowToEntity, unwrap } from './mapping.js'

/**
 * Repositorio de coleccion contra Supabase, con la misma interfaz que los de
 * localStorage. Las paginas y los casos de uso no notan la diferencia: por eso el
 * cambio de la Fase 1 toca el contenedor y nada mas.
 *
 * @param {Object} config
 * @param {string} config.table
 * @param {string[]} config.fields - campos del dominio, en camelCase
 * @param {{ column: string, ascending: boolean }} [config.orderBy]
 */
export function createSupabaseCollectionRepository({ table, fields, orderBy }) {
  const client = requireSupabase()

  async function query() {
    const coupleId = await requireCoupleId()
    let builder = client.from(table).select('*').eq('couple_id', coupleId)
    if (orderBy) builder = builder.order(orderBy.column, { ascending: orderBy.ascending })
    return unwrap(table, await builder)
  }

  return {
    async getAll() {
      return (await query()).map((row) => rowToEntity(row, fields))
    },

    async save(entity) {
      const coupleId = await requireCoupleId()
      unwrap(table, await client.from(table).upsert(entityToRow(entity, fields, coupleId)))
    },

    async remove(id) {
      const coupleId = await requireCoupleId()
      unwrap(table, await client.from(table).delete().eq('couple_id', coupleId).eq('id', id))
    },

    /** Reemplaza la coleccion entera. Solo lo usa la restauracion de copia de seguridad. */
    async replaceAll(items) {
      const coupleId = await requireCoupleId()
      unwrap(table, await client.from(table).delete().eq('couple_id', coupleId))
      if (items.length === 0) return
      unwrap(table, await client.from(table).insert(items.map((item) => entityToRow(item, fields, coupleId))))
    },
  }
}
