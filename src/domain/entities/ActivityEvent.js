export function createActivityEvent({ id, type, description, profileIndex = 0, createdAt } = {}) {
  return {
    id: id ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: type ?? 'generic',
    description: description ?? '',
    profileIndex: profileIndex ?? 0,
    createdAt: createdAt ?? new Date().toISOString(),
  }
}
