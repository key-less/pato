import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { LOGO_DUCK } from '../config/assets.js'

export default function CitasModule() {
  const [citas, setCitas] = useState([])

  const loadCitas = () => container.getCitas().then(setCitas)

  useEffect(() => { loadCitas() }, [])

  return (
    <div className="max-w-3xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Citas</h1>
      </header>

      <CitaForm onAdded={loadCitas} />

      <ul className="mt-6 space-y-3">
        {citas.length === 0 ? (
          <li className="rounded-xl px-4 py-5 bg-pato-butter/60 border border-pato-honey/40 text-pato-muted text-sm text-center">
            Aún no hay citas registradas.
          </li>
        ) : (
          citas.map((c) => (
            <CitaCard key={c.id} cita={c} onRemoved={loadCitas} />
          ))
        )}
      </ul>
    </div>
  )
}

function CitaForm({ onAdded }) {
  const [date, setDate] = useState('')
  const [lugar, setLugar] = useState('')
  const [horaEncuentro, setHoraEncuentro] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date.trim()) return
    await container.addCita({ date: date.trim(), lugar: lugar.trim(), horaEncuentro: horaEncuentro.trim(), note: note.trim() })
    setDate('')
    setLugar('')
    setHoraEncuentro('')
    setNote('')
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 bg-pato-butter/80 border border-pato-honey/50 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-pato-muted mb-1">Fecha de la cita</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-pato-muted mb-1">Hora de encuentro</label>
          <input
            type="time"
            value={horaEncuentro}
            onChange={(e) => setHoraEncuentro(e.target.value)}
            className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-pato-muted mb-1">Lugar</label>
        <input
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Ej. Restaurante El Jardín"
          className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm placeholder-pato-muted"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-pato-muted mb-1">Nota (opcional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Detalles o recuerdo"
          className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm placeholder-pato-muted"
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-pato-sage/70 text-pato-ink text-sm font-medium"
      >
        Agregar cita
      </button>
    </form>
  )
}

function CitaCard({ cita, onRemoved }) {
  const remove = async () => {
    if (window.confirm('¿Quitar esta cita?')) {
      await container.removeCita(cita.id)
      onRemoved?.()
    }
  }

  return (
    <li className="rounded-xl px-4 py-4 bg-pato-butter/80 border border-pato-honey/50 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium text-pato-ink">{formatDate(cita.date)}</div>
        {(cita.lugar || cita.horaEncuentro) && (
          <div className="text-pato-muted text-sm mt-0.5">
            {[cita.lugar, cita.horaEncuentro || null].filter(Boolean).join(' · ')}
          </div>
        )}
        {cita.note && <p className="text-pato-muted text-sm mt-1">{cita.note}</p>}
      </div>
      <button
        type="button"
        onClick={remove}
        className="text-pato-muted text-xs hover:text-pato-coral hover:underline shrink-0"
      >
        Quitar
      </button>
    </li>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso + 'T00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}
