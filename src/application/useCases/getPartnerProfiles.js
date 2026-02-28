export function getPartnerProfiles(repository) {
  return async function execute() {
    const list = await repository.getAll()
    return [list[0] ?? null, list[1] ?? null]
  }
}
