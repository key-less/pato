import { useState, useEffect, useRef } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { formatBytes } from '../utils/formatBytes.js'
import Panel from './Panel.jsx'

const CONFIRM_RESTORE =
  'Restaurar reemplaza TODO el contenido actual de Pato: fotos, citas, cartas y perfiles. Esto no se puede deshacer. ¿Continuar?'

function downloadJson(snapshot) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `pato-copia-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revocar de inmediato cancela la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function BackupPanel() {
  const [mediaBytes, setMediaBytes] = useState(null)
  const [includeMedia, setIncludeMedia] = useState(true)
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    container.getMediaBytes().then(setMediaBytes)
  }, [])

  const handleExport = async () => {
    setBusy('export')
    setMessage(null)
    try {
      downloadJson(await container.exportBackup({ includeMedia }))
      setMessage({ tone: 'ok', text: 'Copia descargada. Guárdala fuera del teléfono.' })
    } catch (error) {
      setMessage({ tone: 'error', text: `No se pudo crear la copia: ${error.message}` })
    } finally {
      setBusy(null)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm(CONFIRM_RESTORE)) return

    setBusy('import')
    setMessage(null)
    try {
      const summary = await container.importBackup(JSON.parse(await file.text()))
      setMessage({
        tone: 'ok',
        text: `Restaurado: ${summary.media} archivos, ${summary.citas} citas, ${summary.letters} cartas. Recargando…`,
      })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof SyntaxError ? 'El archivo no es una copia válida.' : error.message,
      })
      setBusy(null)
    }
  }

  return (
    <Panel className="p-6">
      <h2 className="font-display text-xl text-pato-agua mb-2">Copia de seguridad</h2>
      <p className="font-body text-sm text-pato-junco mb-5">
        Todo vive en este navegador. Si borras los datos del navegador o cambias de teléfono, se pierde.
        Exporta una copia de vez en cuando y guárdala en otro sitio.
      </p>

      <label className="flex items-start gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={includeMedia}
          onChange={(e) => setIncludeMedia(e.target.checked)}
          className="mt-1 rounded border-white/70 accent-pato-coral"
        />
        <span className="font-body text-sm text-pato-agua">
          Incluir fotos y videos
          {mediaBytes !== null && (
            <span className="block text-xs text-pato-junco mt-0.5">
              El álbum pesa {formatBytes(mediaBytes)}. Incluido en la copia ocupa cerca de {formatBytes(Math.round(mediaBytes * 1.37))}.
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy !== null}
          className="flex-1 py-3 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra disabled:opacity-60 transition-colors"
        >
          {busy === 'export' ? 'Preparando…' : 'Exportar copia'}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy !== null}
          className="flex-1 py-3 rounded-2xl bg-white/70 text-pato-agua font-body font-medium hover:bg-white disabled:opacity-60 transition-colors"
        >
          {busy === 'import' ? 'Restaurando…' : 'Restaurar copia'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {message && (
        <p
          role="alert"
          className={`font-body text-sm mt-4 ${message.tone === 'error' ? 'text-pato-terra' : 'text-pato-agua'}`}
        >
          {message.text}
        </p>
      )}
    </Panel>
  )
}
