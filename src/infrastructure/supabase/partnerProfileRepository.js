import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'
import { unwrap } from './mapping.js'

const TABLE = 'partner_profiles'

const FIELDS = [
  ['nombre', 'nombre'],
  ['apellido', 'apellido'],
  ['fechaNacimiento', 'fecha_nacimiento'],
  ['colorFavorito', 'color_favorito'],
  ['comidaFavorita', 'comida_favorita'],
  ['loQueMasLeEncantaDelOtro', 'lo_que_mas_le_encanta_del_otro'],
  ['lugarFavorito', 'lugar_favorito'],
  ['deporteFavorito', 'deporte_favorito'],
  ['queLosHaceUnicos', 'que_los_hace_unicos'],
  ['profilePhotoUrl', 'profile_photo_path'],
]

function rowToProfile(row) {
  const profile = { id: `profile-${row.slot}` }
  for (const [campo, columna] of FIELDS) profile[campo] = row[columna] ?? ''
  return profile
}

function profileToRow(profile, slot, coupleId) {
  const row = { couple_id: coupleId, slot, updated_at: new Date().toISOString() }
  for (const [campo, columna] of FIELDS) row[columna] = profile?.[campo] ?? ''
  return row
}

/** Siempre dos posiciones: indice 0 = uno, indice 1 = el otro. */
export function createSupabasePartnerProfileRepository() {
  const client = requireSupabase()

  return {
    async getAll() {
      const coupleId = await requireCoupleId()
      const rows = unwrap(TABLE, await client
        .from(TABLE)
        .select('*')
        .eq('couple_id', coupleId))

      const perfiles = [null, null]
      for (const row of rows ?? []) perfiles[row.slot] = rowToProfile(row)
      return perfiles
    },

    async save(profile, index) {
      const coupleId = await requireCoupleId()
      unwrap(TABLE, await client.from(TABLE).upsert(profileToRow(profile, index, coupleId)))
    },

    async replaceAll(profiles) {
      const coupleId = await requireCoupleId()
      const filas = [0, 1]
        .filter((slot) => profiles?.[slot])
        .map((slot) => profileToRow(profiles[slot], slot, coupleId))

      unwrap(TABLE, await client.from(TABLE).delete().eq('couple_id', coupleId))
      if (filas.length > 0) unwrap(TABLE, await client.from(TABLE).insert(filas))
    },
  }
}
