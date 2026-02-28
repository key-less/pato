/**
 * Obtiene todas las citas del historial.
 */
export function getCitas(citaRepository) {
  return async function execute() {
    const list = await citaRepository.getAll()
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}
