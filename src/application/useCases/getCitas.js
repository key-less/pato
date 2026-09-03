/**
 * Obtiene todas las citas del historial.
 */
export function getCitas(citaRepository) {
  return async function execute() {
    const list = await citaRepository.getAll()
    // Copia antes de ordenar: `sort` muta, y el repositorio devuelve su
    // array interno. Sin la copia, leer reordenaba lo almacenado.
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}
