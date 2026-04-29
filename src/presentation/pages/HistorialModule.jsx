import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { LOGO_DUCK } from '../config/assets.js'

export default function HistorialModule() {
  const [events, setEvents] = useState([])
  const [profiles, setProfiles] = useState([null, null])

  const load = async () => {
    const [evts, profs] = await Promise.all([
      container.getActivityEvents(),
      container.getPartnerProfiles(),
    ])
    setEvents(evts)
    setProfiles(profs)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-3xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Historial</h1>
        <span className="text-pato-muted text-sm">· Actividad de la app</span>
      </header>

      {events.length === 0 ? (
        <div className="rounded-xl px-4 py-10 bg-pato-butter/60 border border-pato-honey/40 text-pato-muted text-sm text-center">
          Aún no hay actividad registrada. Las acciones que realicen en la app irán apareciendo aquí.
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((evt) => (
            <ActivityEventCard
              key={evt.id}
              event={evt}
              profiles={profiles}
              onRemoved={load}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ActivityEventCard({ event, profiles, onRemoved }) {
  const profile = Array.isArray(profiles) ? (profiles[event.profileIndex] ?? null) : null
  const photoUrl = profile?.profilePhotoUrl || null
  const initial = profile?.nombre?.[0]?.toUpperCase() ?? '?'

  const remove = async () => {
    if (window.confirm('¿Quitar este evento del historial?')) {
      await container.removeActivityEvent(event.id)
      onRemoved?.()
    }
  }

  return (
    <li className="rounded-xl px-4 py-3 bg-pato-butter/80 border border-pato-honey/50 flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-pato-honey/40 bg-pato-peach/60 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-pato-ink select-none">{initial}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-pato-ink leading-snug">{event.description}</p>
        <time className="text-xs text-pato-muted mt-0.5 block">{formatRelativeTime(event.createdAt)}</time>
      </div>

      <button
        type="button"
        onClick={remove}
        className="shrink-0 text-pato-muted text-xs hover:text-pato-coral hover:underline mt-0.5"
      >
        Quitar
      </button>
    </li>
  )
}

function formatRelativeTime(iso) {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora mismo'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
