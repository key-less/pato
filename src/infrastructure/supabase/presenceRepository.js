import { requireSupabase } from './client.js'
import { requireCoupleId } from './coupleContext.js'

/**
 * La onda compartida.
 *
 * Cuando los dos tienen la app abierta a la vez, en las dos pantallas nace la
 * misma onda. Nadie escribe nada y nadie tiene que contestar.
 *
 * Usa Presence de Realtime, que es efimero por definicion: no se guarda una fila,
 * no queda registro de cuando estuvo cada uno conectado. Eso importa — un historial
 * de presencia seria justo lo que la direccion de diseno dice no hacer.
 */
export function createSupabasePresenceRepository() {
  const client = requireSupabase()

  return {
    /** @returns {Promise<() => void>} funcion para darse de baja */
    async subscribe(listener) {
      const coupleId = await requireCoupleId()
      const { data: { user } } = await client.auth.getUser()
      if (!user) return () => {}

      const canal = client.channel(`presencia:${coupleId}`, {
        config: { presence: { key: user.id } },
      })

      const revisar = () => {
        const presentes = Object.keys(canal.presenceState())
        listener({ acompanado: presentes.some((id) => id !== user.id) })
      }

      canal
        .on('presence', { event: 'sync' }, revisar)
        .on('presence', { event: 'join' }, revisar)
        .on('presence', { event: 'leave' }, revisar)
        .subscribe((estado) => {
          if (estado === 'SUBSCRIBED') canal.track({ desde: new Date().toISOString() })
        })

      return () => {
        client.removeChannel(canal)
      }
    },
  }
}
