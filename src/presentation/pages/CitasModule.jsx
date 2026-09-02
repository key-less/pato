import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { MODULE_ICONS } from '../config/assets.js'
import ModuleHeader from '../components/ModuleHeader.jsx'
import { glassStyle } from '../components/GlassPanel.jsx'
import ActionButton from '../components/ActionButton.jsx'
import Field from '../components/Field.jsx'

export default function CitasModule() {
  const [citas, setCitas] = useState([])

  const loadCitas = () => container.getCitas().then(setCitas)

  useEffect(() => { loadCitas() }, [])

  return (
    <div className="max-w-3xl mx-auto pt-14 pb-16 px-4">
      <ModuleHeader
        icon={MODULE_ICONS.citas}
        eyebrow="Nuestros encuentros"
        italic="Nuestras"
        title="citas"
        description="Cada lugar y cada hora que quisimos recordar."
      />

      <CitaForm onAdded={loadCitas} />

      <ul className="mt-6 space-y-3">
        {citas.length === 0 ? (
          <li
            className="rounded-3xl px-6 py-10 text-center"
            style={{
              // Estado vacío: borde punteado en lugar de superficie sólida. Comunica
              // "aquí va a haber algo" en vez de parecer una tarjeta más ya rellenada.
              border: '1px dashed rgba(217, 179, 168, 0.75)',
              background: 'rgba(255,255,255,0.28)',
            }}
          >
            <p className="font-display text-lg text-pato-charcoal/80 italic">Aún no hay citas registradas.</p>
            <p className="font-body text-xs text-pato-smoke mt-1.5">La primera que guardéis aparecerá aquí.</p>
          </li>
        ) : (
          citas.map((c, i) => (
            <CitaCard key={c.id} cita={c} onRemoved={loadCitas} index={i} />
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
    await container.addActivityEvent({
      type: 'cita_added',
      description: `Agregó una nueva cita: ${formatDateShort(date.trim())}${lugar.trim() ? ` en ${lugar.trim()}` : ''}`,
    })
    setDate('')
    setLugar('')
    setHoraEncuentro('')
    setNote('')
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl p-6 space-y-4" style={glassStyle}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="Fecha de la cita"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Field
          label="Hora de encuentro"
          type="time"
          value={horaEncuentro}
          onChange={(e) => setHoraEncuentro(e.target.value)}
        />
      </div>
      <Field
        label="Lugar"
        type="text"
        value={lugar}
        onChange={(e) => setLugar(e.target.value)}
        placeholder="Ej. Restaurante El Jardín"
      />
      <Field
        label="Nota (opcional)"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Detalles o recuerdo"
      />
      <ActionButton type="submit" className="w-full sm:w-auto">
        Agregar cita
      </ActionButton>
    </form>
  )
}

function CitaCard({ cita, onRemoved, index = 0 }) {
  const remove = async () => {
    if (window.confirm('¿Quitar esta cita?')) {
      await container.removeCita(cita.id)
      await container.addActivityEvent({
        type: 'cita_removed',
        description: `Quitó la cita del ${formatDateShort(cita.date)}${cita.lugar ? ` en ${cita.lugar}` : ''}`,
      })
      onRemoved?.()
    }
  }

  return (
    <li
      className="rounded-3xl px-5 py-4 flex items-start justify-between gap-3 animate-slide-up hover:-translate-y-0.5 transition-transform duration-200"
      style={{ ...glassStyle, animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="min-w-0">
        <div className="font-body font-medium text-pato-charcoal">{formatDate(cita.date)}</div>
        {(cita.lugar || cita.horaEncuentro) && (
          <div className="font-body text-pato-smoke text-sm mt-0.5">
            {[cita.lugar, cita.horaEncuentro || null].filter(Boolean).join(' · ')}
          </div>
        )}
        {cita.note && <p className="font-body text-pato-smoke text-sm mt-1">{cita.note}</p>}
      </div>
      <button
        type="button"
        onClick={remove}
        className="font-body text-pato-smoke text-xs hover:text-pato-terra hover:underline shrink-0 min-h-[44px] px-1"
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

function formatDateShort(iso) {
  try {
    return new Date(iso + 'T00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
