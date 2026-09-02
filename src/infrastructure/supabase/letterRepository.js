import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'
import { entityToRow, rowToEntity, unwrap } from './mapping.js'

const TABLE = 'letters'
const FIELDS = ['subject', 'body', 'createdAt', 'unlocksAt']

/**
 * Cartas, con sellado real.
 *
 * Una carta sellada por la otra persona no llega en la consulta: la politica de
 * lectura la excluye. Lo que si llega es que existe y para cuando, por
 * `cartas_selladas()`, para no perder la espera.
 */
export function createSupabaseLetterRepository() {
  const client = requireSupabase()

  return {
    async getAll() {
      const coupleId = await requireCoupleId()

      const [abiertas, selladas] = await Promise.all([
        client.from(TABLE).select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }),
        client.rpc('cartas_selladas'),
      ])

      const esperando = (unwrap(TABLE, selladas) ?? []).map((row) => ({
        id: row.id,
        subject: '',
        body: '',
        createdAt: null,
        unlocksAt: row.unlocks_at,
        selladaPorLaPareja: true,
      }))

      const visibles = (unwrap(TABLE, abiertas) ?? []).map((row) => rowToEntity(row, FIELDS))

      // Las que esperan van primero: son lo que hay que ver al entrar.
      return [...esperando, ...visibles]
    },

    async save(letter) {
      const coupleId = await requireCoupleId()
      unwrap(TABLE, await client.from(TABLE).upsert(entityToRow(letter, FIELDS, coupleId)))
    },

    async remove(id) {
      const coupleId = await requireCoupleId()
      unwrap(TABLE, await client.from(TABLE).delete().eq('couple_id', coupleId).eq('id', id))
    },

    async replaceAll(items) {
      const coupleId = await requireCoupleId()
      unwrap(TABLE, await client.from(TABLE).delete().eq('couple_id', coupleId))
      if (items.length === 0) return
      unwrap(TABLE, await client.from(TABLE).insert(items.map((item) => entityToRow(item, FIELDS, coupleId))))
    },
  }
}
