export function getActivityEvents(repo) {
  return async function execute() {
    const events = await repo.getAll()
    return [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}
