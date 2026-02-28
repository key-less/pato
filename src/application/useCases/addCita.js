import { createCita } from '../../domain/entities/Cita.js'

export function addCita(citaRepository) {
  return async function execute({ date, note, lugar, horaEncuentro }) {
    const id = `cita-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const cita = createCita({ id, date, note, lugar, horaEncuentro })
    await citaRepository.save(cita)
    return cita
  }
}
