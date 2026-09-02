import { createClient } from '@supabase/supabase-js'

const url = import.meta.env?.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * Sin configuracion, la app sigue funcionando contra el almacenamiento local de la
 * Fase 0. Asi cada fase deja la app usable y la migracion no es un salto a ciegas.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * La anon key es publica por diseno: identifica al proyecto, no autoriza nada.
 * Quien protege los datos es RLS. No confundir con la service_role key, que nunca
 * puede salir del servidor.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Obligatorio para clientes publicos (RFC 8252): en una app nativa el
        // redirect puede ser interceptado, y PKCE hace que un codigo robado no sirva.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no esta configurado: falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}
