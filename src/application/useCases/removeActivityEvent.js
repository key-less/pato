export const removeActivityEvent = (repo) => async (id) => {
  await repo.remove(id)
}
