export function getPlaylists(repository) {
  return async function execute() {
    const list = await repository.getAll()
    // Copia antes de ordenar: `sort` muta, y el repositorio devuelve su
    // array interno. Sin la copia, leer reordenaba lo almacenado.
    return [...list].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
  }
}
