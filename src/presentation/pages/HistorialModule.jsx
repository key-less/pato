import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { DuckHistory } from '../components/icons/Ducks.jsx'
import GlassPanel from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

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
    <div className="max-w-3xl mx-auto pt-14 pb-6 px-4">
      <ModuleHeader
        icon={DuckHistory}
        eyebrow="Registro de actividad"
        italic="Nuestro"
        title="historial"
        description="Todo lo que han hecho en la app, ordenado del más reciente al más antiguo."
      />

      {events.length === 0 ? (
        <GlassPanel className="px-5 py-10 text-center">
          <p className="font-body italic text-pato-smoke text-sm">
            Aún no hay actividad registrada. Las acciones que realicen en la app irán apareciendo aquí.
          </p>
        </GlassPanel>
      ) : (
        <ul className="space-y-3">
          {events.map((evt, i) => (
            <ActivityEventCard
              key={evt.id}
              event={evt}
              profiles={profiles}
              onRemoved={load}
              index={i}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ActivityEventCard({ event, profiles, onRemoved, index = 0 }) {
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
    <li
      className="animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <GlassPanel className="px-4 py-3 flex items-start gap-3 hover:-translate-y-0.5 hover:shadow-glass transition-all duration-200">
        <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-white/60 bg-pato-shell flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-pato-charcoal select-none">{initial}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-pato-charcoal leading-snug">{event.description}</p>
          <time className="font-body text-xs text-pato-smoke mt-0.5 block">{formatRelativeTime(event.createdAt)}</time>
        </div>

        <button
          type="button"
          onClick={remove}
          className="shrink-0 font-body text-xs text-pato-smoke hover:text-pato-coral transition-colors mt-0.5"
        >
          Quitar
        </button>
      </GlassPanel>
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
