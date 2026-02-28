export function getPlaylists(repository) {
  return async function execute() {
    const list = await repository.getAll()
    return list.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
  }
}
