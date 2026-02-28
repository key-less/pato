/**
 * Borra los datos guardados de un perfil de la pareja (índice 0 o 1).
 * Deja ese slot sin información.
 */
export function clearPartnerProfile(repository) {
  return async function execute(index) {
    await repository.save(null, index)
  }
}
