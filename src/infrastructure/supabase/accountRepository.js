import { requireSupabase } from './client.js'
import { resetCoupleContext } from './coupleContext.js'

function unwrapRpc({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

/**
 * Sesion y emparejamiento.
 *
 * Crear pareja y unirse no son inserts: pasan por funciones `security definer`
 * porque en ese instante el usuario todavia no es miembro y su propia politica RLS
 * lo rechazaria. Ver supabase/migrations/0003_pairing.sql.
 */
export function createSupabaseAccountRepository() {
  const client = requireSupabase()

  return {
    async getSession() {
      const { data } = await client.auth.getSession()
      return data.session ?? null
    },

    /** Devuelve la funcion para cancelar la suscripcion. */
    onAuthChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        resetCoupleContext()
        listener(session ?? null)
      })
      return () => data.subscription.unsubscribe()
    },

    async signInWithEmail(email, redirectTo) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw new Error(error.message)
    },

    async signInWithApple(redirectTo) {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      })
      if (error) throw new Error(error.message)
    },

    async signOut() {
      await client.auth.signOut()
      resetCoupleContext()
    },

    /** null si la sesion existe pero todavia no hay pareja. */
    async getMembership() {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return null

      const { data, error } = await client
        .from('couple_members')
        .select('couple_id, user_id, display_name, slot, joined_at')
        .order('slot', { ascending: true })

      if (error) throw new Error(error.message)
      if (!data?.length) return null

      const mine = data.find((row) => row.user_id === user.id)
      return {
        coupleId: mine?.couple_id ?? data[0].couple_id,
        slot: mine?.slot ?? 0,
        members: data.map((row) => ({
          userId: row.user_id,
          displayName: row.display_name ?? '',
          slot: row.slot,
        })),
        isComplete: data.length === 2,
      }
    },

    async createCouple(displayName) {
      const coupleId = unwrapRpc(await client.rpc('create_couple', { display_name: displayName || null }))
      resetCoupleContext()
      return coupleId
    },

    /** El token en claro se devuelve una sola vez; no se puede volver a consultar. */
    async createInvite() {
      const rows = unwrapRpc(await client.rpc('create_invite'))
      const invite = Array.isArray(rows) ? rows[0] : rows
      return { token: invite.token, expiresAt: invite.expires_at }
    },

    async redeemInvite(token, displayName) {
      const coupleId = unwrapRpc(await client.rpc('redeem_invite', {
        token: token.trim(),
        display_name: displayName || null,
      }))
      resetCoupleContext()
      return coupleId
    },

    /** Requisito de App Store: borrado de cuenta dentro de la app. */
    async deleteAccount() {
      unwrapRpc(await client.rpc('delete_my_account'))
      await client.auth.signOut()
      resetCoupleContext()
    },
  }
}
