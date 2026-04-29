export function removeActivityEvent(repo) {
  return async function execute(id) {
    await repo.remove(id)
  }
}
