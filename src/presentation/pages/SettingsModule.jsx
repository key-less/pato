import { useState, useEffect } from 'react'
import { useAppState } from '../hooks/useAppState'
import { LOGO_DUCK } from '../config/assets.js'
import { DEFAULT_STATUSES } from '../../domain/entities/RelationshipStatus.js'

export function SettingsModule() {
  const { state, loading, update } = useAppState()
  const [metSince, setMetSince] = useState('')
  const [currentStatusId, setCurrentStatusId] = useState('')
  const [statuses, setStatuses] = useState([])
  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!state) return
    setMetSince(state.metSince?.slice(0, 10) ?? '')
    setCurrentStatusId(state.currentRelationshipStatusId ?? '')
    setStatuses(state.relationshipStatuses?.length ? state.relationshipStatuses : DEFAULT_STATUSES)
  }, [state])

  const handleSave = async () => {
    await update({
      metSince: metSince || new Date().toISOString().slice(0, 10),
      currentRelationshipStatusId: currentStatusId,
      relationshipStatuses: statuses,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addStatus = () => {
    if (!newStatusLabel.trim()) return
    const id = newStatusLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (!id) return
    setStatuses((prev) => [...prev, { id: `custom_${id}`, label: newStatusLabel.trim(), order: prev.length + 1 }])
    setNewStatusLabel('')
  }

  const removeStatus = (id) => {
    if (statuses.some((s) => s.id === id && DEFAULT_STATUSES.some((d) => d.id === id))) return
    setStatuses((prev) => prev.filter((s) => s.id !== id))
    if (currentStatusId === id) setCurrentStatusId('')
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-pato-coral">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Configuración</h1>
      </header>

      <div className="space-y-8">
        <section className="bg-pato-butter/90 rounded-2xl p-6 border border-pato-honey/60 shadow-sm">
          <h2 className="font-display font-medium text-pato-ink mb-4">Fecha en que se conocieron</h2>
          <input
            type="date"
            value={metSince}
            onChange={(e) => setMetSince(e.target.value)}
            className="w-full rounded-xl border border-pato-honey bg-white/95 px-4 py-3 text-pato-ink"
          />
        </section>

        <section className="bg-pato-butter/90 rounded-2xl p-6 border border-pato-honey/60 shadow-sm">
          <h2 className="font-display font-medium text-pato-ink mb-4">Estado actual de la relación</h2>
          <select
            value={currentStatusId}
            onChange={(e) => setCurrentStatusId(e.target.value)}
            className="w-full rounded-xl border border-pato-honey bg-white/95 px-4 py-3 text-pato-ink"
          >
            <option value="">— Seleccionar —</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </section>

        <section className="bg-pato-butter/90 rounded-2xl p-6 border border-pato-honey/60 shadow-sm">
          <h2 className="font-display font-medium text-pato-ink mb-4">Estados personalizados</h2>
          <p className="text-sm text-pato-muted mb-3">Puedes agregar más estados además de los predefinidos.</p>
          <ul className="space-y-2 mb-4">
            {statuses.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-pato-honey/40 last:border-0">
                <span className="text-pato-ink">{s.label}</span>
                {!DEFAULT_STATUSES.some((d) => d.id === s.id) && (
                  <button
                    type="button"
                    onClick={() => removeStatus(s.id)}
                    className="text-pato-muted text-sm hover:text-pato-ink hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStatusLabel}
              onChange={(e) => setNewStatusLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStatus()}
              placeholder="Ej: Mejor amigues"
              className="flex-1 rounded-xl border border-pato-honey bg-white/95 px-4 py-2 text-pato-ink placeholder-pato-muted"
            />
            <button
              type="button"
              onClick={addStatus}
              className="px-4 py-2 rounded-xl bg-pato-sage/70 text-pato-ink font-medium"
            >
              Agregar
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-pato-peach text-pato-ink font-medium hover:bg-pato-rose transition-colors"
        >
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
