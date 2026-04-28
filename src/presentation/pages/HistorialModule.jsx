import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { DuckHistory } from '../components/icons/Ducks.jsx'
import GlassPanel from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

export default function HistorialModule() {
  const [citas, setCitas] = useState([])
  const [sentLetters, setSentLetters] = useState([])

  const loadCitas = () => container.getCitas().then(setCitas)
  const loadSentLetters = () => container.getSentLetterLogs().then(setSentLetters)

  useEffect(() => {
    loadCitas()
    loadSentLetters()
  }, [])

  return (
    <div className="max-w-3xl mx-auto pt-14 pb-28 px-4">
      <ModuleHeader
        icon={DuckHistory}
        eyebrow="Cronología de la pareja"
        italic="Nuestro"
        title="historial"
        description="Citas guardadas y cartas enviadas. Cada momento que vale la pena recordar."
      />

      <section className="mb-12">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          <h2 className="font-display text-xl text-pato-charcoal tracking-tight">Citas registradas</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
        </div>

        <CitaForm onAdded={loadCitas} />

        <ul className="mt-6 space-y-3">
          {citas.length === 0 ? (
            <li>
              <GlassPanel className="px-5 py-6 text-center">
                <p className="font-body italic text-pato-smoke text-sm">Aún no hay citas registradas.</p>
              </GlassPanel>
            </li>
          ) : (
            citas.map((c) => (
              <CitaCard key={c.id} cita={c} onRemoved={loadCitas} />
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          <h2 className="font-display text-xl text-pato-charcoal tracking-tight">Cartas enviadas</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
        </div>
        <ul className="space-y-3">
          {sentLetters.length === 0 ? (
            <li>
              <GlassPanel className="px-5 py-6 text-center">
                <p className="font-body italic text-pato-smoke text-sm">Aún no hay cartas enviadas.</p>
              </GlassPanel>
            </li>
          ) : (
            sentLetters.map((log) => (
              <li key={log.id}>
                <GlassPanel className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-body font-medium text-pato-charcoal text-sm">{log.subject || '(Sin asunto)'}</div>
                    <p className="font-body text-xs text-pato-smoke line-clamp-2 mt-1">{log.bodyPreview}</p>
                    <time className="font-display italic text-xs text-pato-smoke mt-1 inline-block">{formatDateTime(log.sentAt)}</time>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('¿Quitar esta carta del historial?')) {
                        await container.removeSentLetterLog(log.id)
                        loadSentLetters()
                      }
                    }}
                    className="font-body text-xs text-pato-smoke hover:text-pato-coral transition-colors shrink-0"
                  >
                    Quitar
                  </button>
                </GlassPanel>
              </li>
            ))
          )}
        </ul>
      </section>
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
    <GlassPanel as="form" onSubmit={handleSubmit} className="p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-body text-xs font-medium text-pato-smoke mb-1">Fecha de la cita</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-medium text-pato-smoke mb-1">Hora de encuentro</label>
          <input
            type="time"
            value={horaEncuentro}
            onChange={(e) => setHoraEncuentro(e.target.value)}
            className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal"
          />
        </div>
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-pato-smoke mb-1">Lugar</label>
        <input
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Ej. Restaurante El Jardín"
          className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal placeholder-pato-smoke"
        />
      </div>
      <div>
        <label className="block font-body text-xs font-medium text-pato-smoke mb-1">Nota (opcional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Detalles o recuerdo"
          className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal placeholder-pato-smoke"
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-pato-coral text-white font-body font-medium text-sm hover:bg-pato-terra transition-colors"
      >
        Agregar cita
      </button>
    </GlassPanel>
  )
}

function CitaCard({ cita, onRemoved }) {
  const remove = async () => {
    if (window.confirm('¿Quitar esta cita del historial?')) {
      await container.removeCita(cita.id)
      onRemoved?.()
    }
  }

  return (
    <li>
      <GlassPanel className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-body font-medium text-pato-charcoal">{formatDate(cita.date)}</div>
          {(cita.lugar || cita.horaEncuentro) && (
            <div className="font-body text-pato-smoke text-sm mt-0.5">
              {[cita.lugar, cita.horaEncuentro ? formatTime(cita.horaEncuentro) : null].filter(Boolean).join(' · ')}
            </div>
          )}
          {cita.note && <p className="font-display italic text-pato-smoke text-sm mt-1">{cita.note}</p>}
        </div>
        <button
          type="button"
          onClick={remove}
          className="font-body text-xs text-pato-smoke hover:text-pato-coral transition-colors shrink-0"
        >
          Quitar
        </button>
      </GlassPanel>
    </li>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatTime(value) {
  return value || ''
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
