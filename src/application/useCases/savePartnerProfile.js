import { createPartnerProfile } from '../../domain/entities/PartnerProfile.js'

export function savePartnerProfile(repository) {
  return async function execute(data, index) {
    const id = data.id ?? `profile-${index}-${Date.now()}`
    const profile = createPartnerProfile({ ...data, id })
    await repository.save(profile, index)
    return profile
  }
}
