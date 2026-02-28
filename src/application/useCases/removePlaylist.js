export function removePlaylist(repository) {
  return async function execute(id) {
    await repository.remove(id)
  }
}
