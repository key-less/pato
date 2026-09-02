import { requireSupabase } from './client.js'

/**
 * El couple_id no se conoce hasta despues del login, pero las paginas importan el
 * contenedor al arrancar. En vez de reconstruirlo tras iniciar sesion, cada
 * repositorio lo resuelve de forma perezosa y lo cachea.
 *
 * RLS no depende de este valor: aunque llegara uno equivocado, la base seguiria
 * negando las filas. Sirve para escribir en el sitio correcto, no para proteger.
 */
let cached = null
let pending = null

export async function currentCoupleId() {
  if (cached) return cached
  if (!pending) pending = resolve().finally(() => { pending = null })
  return pending
}

async function resolve() {
  const client = requireSupabase()

  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data, error } = await client
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  cached = data?.couple_id ?? null
  return cached
}

/** Al cambiar de sesion, lo cacheado deja de valer. */
export function resetCoupleContext() {
  cached = null
  pending = null
}

export async function requireCoupleId() {
  const coupleId = await currentCoupleId()
  if (!coupleId) throw new Error('Todavia no perteneces a una pareja.')
  return coupleId
}
