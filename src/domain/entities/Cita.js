/**
 * Una cita registrada en el historial.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.date - ISO date (YYYY-MM-DD)
 * @param {string} [props.note]
 * @param {string} [props.lugar] - Lugar de encuentro
 * @param {string} [props.horaEncuentro] - Hora de encuentro (ej. "19:00" o "7:00 p. m.")
 */
export function createCita({ id, date, note, lugar, horaEncuentro }) {
  return {
    id,
    date: date ?? '',
    note: note ?? '',
    lugar: lugar ?? '',
    horaEncuentro: horaEncuentro ?? '',
  }
}
