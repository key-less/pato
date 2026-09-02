import { useState, useEffect } from 'react'
import { onStorageFailure } from '../../infrastructure/storage/storageAlerts.js'

const QUOTA_MESSAGE =
  'No queda espacio en este dispositivo, así que el último cambio no se guardó. Exporta una copia desde Configuración y borra algunas fotos antes de seguir.'
const GENERIC_MESSAGE =
  'El último cambio no se guardó. Vuelve a intentarlo; si sigue fallando, exporta una copia desde Configuración.'

/**
 * Red de seguridad: una escritura fallida siempre llega al usuario, aunque la
 * pantalla que la disparó no la capture. Sin esto, la app decía «guardado»
 * sobre datos que nunca tocaron el disco.
 */
export function StorageAlert() {
  const [failure, setFailure] = useState(null)

  useEffect(() => onStorageFailure(setFailure), [])

  if (!failure) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] rounded-2xl px-5 py-4 flex items-start gap-3"
      style={{
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        background: '#fffbf4',
        border: '1px solid rgba(207, 90, 68, 0.45)',
        boxShadow: '0 12px 40px -12px rgba(31, 58, 61, 0.35)',
      }}
    >
      <span aria-hidden className="mt-0.5 w-2 h-2 rounded-full bg-pato-coral flex-shrink-0" />
      <p className="flex-1 font-body text-sm text-pato-agua leading-relaxed">
        {failure.name === 'StorageQuotaError' ? QUOTA_MESSAGE : GENERIC_MESSAGE}
      </p>
      <button
        type="button"
        onClick={() => setFailure(null)}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-pato-junco hover:text-pato-agua hover:bg-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        aria-label="Cerrar aviso"
      >
        <span aria-hidden className="text-base leading-none">×</span>
      </button>
    </div>
  )
}
