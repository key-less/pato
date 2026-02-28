import { Link } from 'react-router-dom'
import { DUCK_IMAGES, LOGO_DUCK } from '../config/assets.js'

const nav = [
  { path: '/', label: 'Inicio', duck: DUCK_IMAGES[0], hash: '' },
  { path: '/fotos', label: 'Fotos y videos', duck: DUCK_IMAGES[1], hash: '' },
  { path: '/perfil-pareja', label: 'Perfil de la pareja', duck: DUCK_IMAGES[0], hash: '' },
  { path: '/playlists', label: 'Playlists', duck: DUCK_IMAGES[1], hash: '' },
  { path: '/cartas', label: 'Cartas', duck: DUCK_IMAGES[2], hash: '' },
  { path: '/configuracion', label: 'Configuración', duck: DUCK_IMAGES[3], hash: '' },
  { path: '/historial', label: 'Historial', duck: DUCK_IMAGES[4], hash: '' },
]

export function Sidebar({ open, onClose, currentPath, currentHash = '' }) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-pato-butter border-r border-pato-honey shadow-xl flex flex-col"
        aria-label="Menú principal"
      >
        <div className="p-4 flex items-center justify-between border-b border-pato-honey/60">
          <div className="flex items-center gap-2">
            <img src={LOGO_DUCK} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-pato-coral/40" />
            <span className="font-display font-semibold text-pato-ink">Pato</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-pato-peach/50 text-pato-ink"
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {nav.map(({ path, label, duck, hash }, i) => {
            const to = hash ? `${path}#${hash}` : path
            const isActive = hash
              ? currentPath === path && currentHash === `#${hash}`
              : currentPath === path
            return (
              <Link
                key={to + i}
                to={to}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-pato-peach/70 text-pato-ink font-medium' : 'text-pato-muted hover:bg-pato-honey/50 hover:text-pato-ink'
                }`}
              >
                <img src={duck} alt="" className="w-8 h-8 shrink-0 rounded-full object-cover" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
