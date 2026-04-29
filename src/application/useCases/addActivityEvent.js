import { createActivityEvent } from '../../domain/entities/ActivityEvent.js'

export const addActivityEvent = (repo) => async (eventData) => {
  const event = createActivityEvent(eventData)
  await repo.save(event)
  return event
}
