import { createSentLetterLog } from '../../domain/entities/SentLetterLog.js'

export function logSentLetter(sentLetterLogRepository) {
  return async function execute(letter) {
    const id = `sent-${Date.now()}`
    const bodyPreview = (letter.body ?? '').slice(0, 200)
    const log = createSentLetterLog({
      id,
      letterId: letter.id,
      subject: letter.subject ?? '',
      bodyPreview,
      sentAt: new Date().toISOString(),
    })
    await sentLetterLogRepository.save(log)
    return log
  }
}
