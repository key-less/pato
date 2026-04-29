import { createActivityEvent } from '../../domain/entities/ActivityEvent.js'

export function addActivityEvent(repo) {
  return async function execute(eventData) {
    const event = createActivityEvent(eventData)
    await repo.save(event)
    return event
  }
}
