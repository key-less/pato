import { defineRepository } from './defineRepository.js'

/**
 * Puerto para los dos perfiles de la pareja.
 *
 * Su `save` es el único que recibe un índice: los perfiles no son una colección abierta,
 * son exactamente dos posiciones (0 = "Yo", 1 = "Pareja"). Guardar `null` vacía el slot.
 *
 * Contrato:
 * - `getAll(): Promise<[PartnerProfile | null, PartnerProfile | null]>`
 * - `save(profile: PartnerProfile | null, index: 0 | 1): Promise<void>`
 */
export const createPartnerProfileRepository = defineRepository('PartnerProfileRepository', [
  'getAll',
  'save',
])
