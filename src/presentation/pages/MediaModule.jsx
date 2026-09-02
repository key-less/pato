import { useState, useEffect, useRef } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { useAppState } from '../hooks/useAppState'
import { useMediaUrl } from '../hooks/useMediaUrl'
import { createImageThumbnail } from '../../infrastructure/media/imageProcessing.js'
import { DuckPhotos } from '../components/icons/Ducks.jsx'
import Panel, { estiloPapel } from '../components/Panel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

const QUOTA_MESSAGE = 'No queda espacio en este dispositivo. Exporta una copia desde Configuración y libera algo antes de seguir subiendo.'
const UPLOAD_MESSAGE = 'No se pudieron guardar todos los archivos. Los que sí entraron ya aparecen abajo.'

export default function MediaModule() {
  const { state } = useAppState()
  const [media, setMedia] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const loadMedia = () => { container.getMediaList().then(setMedia) }
  useEffect(() => { loadMedia() }, [])

  const statuses = state?.relationshipStatuses ?? []

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/')
        const type = isVideo ? 'video' : 'photo'
        await container.addMedia({
          type,
          blob: file,
          thumbnailBlob: isVideo ? null : await createImageThumbnail(file),
          date: new Date().toISOString().slice(0, 10),
          relationshipStatusId: state?.currentRelationshipStatusId ?? null,
        })
        await container.addActivityEvent({
          type: 'media_added',
          description: `Agregó ${isVideo ? 'un video' : 'una foto'} al álbum`,
        })
      }
    } catch (error) {
      setUploadError(error.name === 'StorageQuotaError' ? QUOTA_MESSAGE : UPLOAD_MESSAGE)
    } finally {
      setUploading(false)
      e.target.value = ''
      loadMedia()
    }
  }

  // Recargar siempre: si la escritura falló, la vista vuelve a lo que hay en disco
  // en vez de quedarse mostrando un cambio que no se guardó.
  const persist = async (action) => {
    try {
      await action()
    } catch {
      // StorageAlert ya avisa al usuario del fallo.
    } finally {
      loadMedia()
    }
  }

  const handleUpdate = (id, updates) => persist(() => container.updateMedia(id, updates))

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar este archivo del álbum?')) return
    return persist(async () => {
      await container.deleteMedia(id)
      await container.addActivityEvent({
        type: 'media_removed',
        description: 'Eliminó un archivo del álbum',
      })
    })
  }

  const toggleShowOnLanding = (id, current) => persist(() => container.updateMedia(id, { showOnLanding: !current }))

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-28 px-4">
      <ModuleHeader
        icon={DuckPhotos}
        eyebrow="Nuestro álbum"
        italic="Fotos"
        title="y videos"
        description="Recuerdos compartidos. Marca los que quieras ver flotando en la página principal."
      />

      <div className="mb-10 flex flex-col items-center gap-4">
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
          className="px-6 py-3 rounded-2xl font-body font-medium text-pato-agua disabled:opacity-60 transition-transform hover:scale-[1.02]"
          style={estiloPapel}
        >
          {uploading ? 'Subiendo…' : '+ Agregar fotos o videos'}
        </button>
        {uploadError && (
          <p role="alert" className="font-body text-sm text-pato-terra text-center max-w-md">
            {uploadError}
          </p>
        )}
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
        <p className="text-pato-junco font-body italic text-center py-12">
          Aún no hay fotos ni videos. Cuando agregues algunos, podrás marcar los que aparezcan flotando en Inicio.
        </p>
      )}
    </div>
  )
}

function MediaCard({ item, statuses, onUpdate, onDelete, onToggleShowOnLanding }) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(item.date ?? '')
  const [statusId, setStatusId] = useState(item.relationshipStatusId ?? '')
  const url = useMediaUrl(item, { original: item.type === 'video' })

  const save = () => {
    onUpdate(item.id, { date: date || null, relationshipStatusId: statusId || null })
    setEditing(false)
  }

  return (
    <Panel className="overflow-hidden">
      <div className="aspect-square relative bg-pato-shell/40">
        {url && (item.type === 'photo' ? (
          <img src={url} alt={item.caption || ''} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <video src={url} controls preload="metadata" className="w-full h-full object-cover" />
        ))}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label="Eliminar"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <label className="flex items-center gap-2 font-body text-xs text-pato-junco cursor-pointer">
          <input
            type="checkbox"
            checked={!!item.showOnLanding}
            onChange={() => onToggleShowOnLanding(item.id, item.showOnLanding)}
            className="rounded border-white/70 accent-pato-coral"
          />
          Mostrar en Inicio
        </label>
        {editing ? (
          <>
            <label className="block font-body text-xs font-medium text-pato-agua mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-white/70 bg-white/80 px-2 py-1.5 text-sm text-pato-agua mb-2"
            />
            <label className="block font-body text-xs font-medium text-pato-agua mb-1">Estado en ese momento</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full rounded-lg border border-white/70 bg-white/80 px-2 py-1.5 text-sm text-pato-agua mb-2"
            >
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={save} className="flex-1 py-1.5 rounded-lg bg-pato-coral text-white text-sm font-medium hover:bg-pato-terra transition-colors">Guardar</button>
              <button type="button" onClick={() => setEditing(false)} className="py-1.5 px-3 rounded-lg bg-white/60 text-pato-agua text-sm">Cancelar</button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left font-body text-sm text-pato-junco hover:text-pato-agua transition-colors"
          >
            {item.date ? formatDate(item.date) : 'Sin fecha'} · {statuses.find(s => s.id === item.relationshipStatusId)?.label ?? 'Sin estado'}
          </button>
        )}
      </div>
    </Panel>
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
  // Sin la hora, 'YYYY-MM-DD' se parsea como UTC y la fecha se corre un dia.
  try {
    return new Date(`${iso}T00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
