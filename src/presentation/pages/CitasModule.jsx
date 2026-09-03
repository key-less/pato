import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { DuckLetters } from '../components/icons/Ducks.jsx'
import GlassPanel from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'
import { useHaptics } from '../hooks/useHaptics.js'

const inputClass =
  'w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-pato-charcoal placeholder-pato-smoke font-body focus:outline-none focus:ring-2 focus:ring-pato-coral/40'
const labelClass = 'block font-body text-xs font-medium text-pato-smoke mb-1.5'

export default function CitasModule() {
  const [citas, setCitas] = useState([])

  const loadCitas = () => container.getCitas().then(setCitas)

  useEffect(() => {
    loadCitas()
  }, [])

  return (
    <div className="max-w-3xl mx-auto pt-14 pb-6 px-4">
      <ModuleHeader
        icon={DuckLetters}
        eyebrow="Nuestros planes"
        italic="Nuestras"
        title="citas"
        description="Cada salida que vale la pena recordar, con su fecha, su lugar y su nota."
      />

      <CitaForm onAdded={loadCitas} />

      <ul className="mt-6 space-y-3">
        {citas.length === 0 ? (
          <li className="font-body italic text-center text-pato-smoke py-12">
            Aún no hay citas registradas. Agrega la primera aquí arriba.
          </li>
        ) : (
          citas.map((c, i) => <CitaCard key={c.id} cita={c} onRemoved={loadCitas} index={i} />)
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
  const haptic = useHaptics()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date.trim()) return
    await container.addCita({
      date: date.trim(),
      lugar: lugar.trim(),
      horaEncuentro: horaEncuentro.trim(),
      note: note.trim(),
    })
    await container.addActivityEvent({
      type: 'cita_added',
      description: `Agregó una nueva cita: ${formatDateShort(date.trim())}${lugar.trim() ? ` en ${lugar.trim()}` : ''}`,
    })
    haptic('success')
    setDate('')
    setLugar('')
    setHoraEncuentro('')
    setNote('')
    onAdded?.()
  }

  return (
    <GlassPanel as="form" onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cita-fecha" className={labelClass}>
            Fecha de la cita
          </label>
          <input
            id="cita-fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cita-hora" className={labelClass}>
            Hora de encuentro
          </label>
          <input
            id="cita-hora"
            type="time"
            value={horaEncuentro}
            onChange={(e) => setHoraEncuentro(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="cita-lugar" className={labelClass}>
          Lugar
        </label>
        <input
          id="cita-lugar"
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Ej. Restaurante El Jardín"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cita-nota" className={labelClass}>
          Nota (opcional)
        </label>
        <input
          id="cita-nota"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Detalles o recuerdo"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors tappable"
      >
        Agregar cita
      </button>
    </GlassPanel>
  )
}

function CitaCard({ cita, onRemoved, index = 0 }) {
  const haptic = useHaptics()

  const remove = async () => {
    if (window.confirm('¿Quitar esta cita?')) {
      await container.removeCita(cita.id)
      await container.addActivityEvent({
        type: 'cita_removed',
        description: `Quitó la cita del ${formatDateShort(cita.date)}${cita.lugar ? ` en ${cita.lugar}` : ''}`,
      })
      haptic('medium')
      onRemoved?.()
    }
  }

  return (
    <GlassPanel
      as="li"
      className="px-5 py-4 flex items-start justify-between gap-3 animate-slide-up hover:-translate-y-0.5 transition-transform duration-200"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="min-w-0">
        <div className="font-display text-xl text-pato-charcoal leading-tight">{formatDate(cita.date)}</div>
        {(cita.lugar || cita.horaEncuentro) && (
          <div className="font-body text-sm text-pato-smoke mt-1">
            {[cita.lugar, cita.horaEncuentro || null].filter(Boolean).join(' · ')}
          </div>
        )}
        {cita.note && <p className="font-body text-sm text-pato-smoke mt-1">{cita.note}</p>}
      </div>
      <button
        type="button"
        onClick={remove}
        className="font-body text-xs text-pato-smoke hover:text-pato-coral transition-colors shrink-0 tappable"
      >
        Quitar
      </button>
    </GlassPanel>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso + 'T00:00').toLocaleDateString('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatDateShort(iso) {
  try {
    return new Date(iso + 'T00:00').toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
