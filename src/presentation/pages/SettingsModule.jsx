import { useState, useEffect } from 'react'
import { useAppState } from '../hooks/useAppState'
import { DuckSettings } from '../components/icons/Ducks.jsx'
import GlassPanel from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'
import { DEFAULT_STATUSES } from '../../domain/entities/RelationshipStatus.js'

export default function SettingsModule() {
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
        <div className="animate-pulse font-body text-pato-coral">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pt-14 pb-28 px-4">
      <ModuleHeader
        icon={DuckSettings}
        eyebrow="Personaliza tu Pato"
        italic="Tus"
        title="ajustes"
      />

      <div className="space-y-6">
        <GlassPanel className="p-6">
          <h2 className="font-display text-xl text-pato-charcoal mb-4">Fecha en que se conocieron</h2>
          <input
            type="date"
            value={metSince}
            onChange={(e) => setMetSince(e.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-body text-pato-charcoal focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
          />
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="font-display text-xl text-pato-charcoal mb-4">Estado actual de la relación</h2>
          <select
            value={currentStatusId}
            onChange={(e) => setCurrentStatusId(e.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-body text-pato-charcoal focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
          >
            <option value="">— Seleccionar —</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="font-display text-xl text-pato-charcoal mb-2">Estados personalizados</h2>
          <p className="font-body text-sm text-pato-smoke mb-4">Puedes agregar más estados además de los predefinidos.</p>
          <ul className="space-y-1 mb-4">
            {statuses.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-white/40 last:border-0">
                <span className="font-body text-pato-charcoal">{s.label}</span>
                {!DEFAULT_STATUSES.some((d) => d.id === s.id) && (
                  <button
                    type="button"
                    onClick={() => removeStatus(s.id)}
                    className="font-body text-sm text-pato-smoke hover:text-pato-coral transition-colors"
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
              className="flex-1 rounded-2xl border border-white/70 bg-white/85 px-4 py-2 font-body text-pato-charcoal placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
            />
            <button
              type="button"
              onClick={addStatus}
              className="px-4 py-2 rounded-2xl bg-white/70 text-pato-charcoal font-body font-medium hover:bg-white transition-colors"
            >
              Agregar
            </button>
          </div>
        </GlassPanel>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors"
        >
          {saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
