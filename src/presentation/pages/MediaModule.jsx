import { useState, useEffect, useRef } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { useAppState } from '../hooks/useAppState'
import { LOGO_DUCK } from '../config/assets.js'

export default function MediaModule() {
  const { state } = useAppState()
  const [media, setMedia] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const loadMedia = () => {
    container.getMediaList().then(setMedia)
  }

  useEffect(() => {
    loadMedia()
  }, [])

  const statuses = state?.relationshipStatuses ?? []

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/')
        const type = isVideo ? 'video' : 'photo'
        const src = await readFileAsDataURL(file)
        await container.addMedia({
          type,
          src,
          date: new Date().toISOString().slice(0, 10),
          relationshipStatusId: state?.currentRelationshipStatusId ?? null,
        })
      }
      loadMedia()
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleUpdate = async (id, updates) => {
    await container.updateMedia(id, updates)
    loadMedia()
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este archivo del álbum?')) {
      await container.deleteMedia(id)
      loadMedia()
    }
  }

  const toggleShowOnLanding = async (id, current) => {
    await container.updateMedia(id, { showOnLanding: !current })
    loadMedia()
  }

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Fotos y videos</h1>
      </header>

      <div className="mb-8 flex flex-wrap gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-5 py-3 rounded-xl bg-pato-peach text-pato-ink font-medium hover:bg-pato-rose disabled:opacity-60 transition-colors"
        >
          {uploading ? 'Subiendo...' : 'Agregar fotos o videos'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {media.map((m) => (
          <MediaCard
            key={m.id}
            item={m}
            statuses={statuses}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onToggleShowOnLanding={toggleShowOnLanding}
          />
        ))}
      </div>

      {media.length === 0 && (
        <p className="text-pato-muted text-center py-12">
          Aún no hay fotos ni videos. Agrega algunos; luego marca &quot;Mostrar en página principal&quot; en las fotos que quieras que aparezcan flotando en Inicio.
        </p>
      )}
    </div>
  )
}

function MediaCard({ item, statuses, onUpdate, onDelete, onToggleShowOnLanding }) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(item.date ?? '')
  const [statusId, setStatusId] = useState(item.relationshipStatusId ?? '')

  const save = () => {
    onUpdate(item.id, { date: date || null, relationshipStatusId: statusId || null })
    setEditing(false)
  }

  return (
    <div className="bg-pato-butter/90 rounded-xl overflow-hidden border border-pato-honey/60 shadow-sm">
      <div className="aspect-square relative bg-pato-honey/30">
        {item.type === 'photo' ? (
          <img src={item.src} alt="" className="w-full h-full object-cover" />
        ) : (
          <video src={item.src} controls className="w-full h-full object-cover" />
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60"
          aria-label="Eliminar"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <label className="flex items-center gap-2 text-sm text-pato-muted cursor-pointer">
          <input
            type="checkbox"
            checked={!!item.showOnLanding}
            onChange={() => onToggleShowOnLanding(item.id, item.showOnLanding)}
            className="rounded border-pato-honey"
          />
          Mostrar en página principal
        </label>
        {editing ? (
          <>
            <label className="block text-xs font-medium text-pato-ink mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-pato-honey bg-white/95 px-2 py-1.5 text-sm text-pato-ink mb-2"
            />
            <label className="block text-xs font-medium text-pato-ink mb-1">Estado en ese momento</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full rounded-lg border border-pato-honey bg-white/95 px-2 py-1.5 text-sm text-pato-ink mb-2"
            >
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={save} className="flex-1 py-1.5 rounded-lg bg-pato-sage/70 text-pato-ink text-sm font-medium">Guardar</button>
              <button type="button" onClick={() => setEditing(false)} className="py-1.5 rounded-lg bg-pato-honey/60 text-pato-ink text-sm">Cancelar</button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left text-sm text-pato-muted hover:text-pato-ink hover:underline"
          >
            {item.date ? formatDate(item.date) : 'Sin fecha'} · {statuses.find(s => s.id === item.relationshipStatusId)?.label ?? 'Sin estado'}
          </button>
        )}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
