export function removeCita(citaRepository) {
  return async function execute(id) {
    await citaRepository.remove(id)
  }
}
