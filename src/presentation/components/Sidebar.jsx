import { Link } from 'react-router-dom'
import { LOGO_DUCK_ICON as DuckLogo, MODULE_ICONS } from '../config/assets.js'

const nav = [
  { path: '/', label: 'Inicio', Icon: MODULE_ICONS.inicio },
  { path: '/citas', label: 'Citas', Icon: MODULE_ICONS.citas },
  { path: '/fotos', label: 'Fotos y videos', Icon: MODULE_ICONS.fotos },
  { path: '/perfil-pareja', label: 'Perfil de la pareja', Icon: MODULE_ICONS.perfil },
  { path: '/playlists', label: 'Playlists', Icon: MODULE_ICONS.playlists },
  { path: '/cartas', label: 'Cartas', Icon: MODULE_ICONS.cartas },
  { path: '/configuracion', label: 'Configuración', Icon: MODULE_ICONS.configuracion },
  { path: '/historial', label: 'Historial', Icon: MODULE_ICONS.historial },
]

export function Sidebar({ open, onClose, currentPath }) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(31, 58, 61, 0.32)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col animate-fade-in"
        style={{
          // Papel, no vidrio. El menú es una superficie grande y opaca sobre un velo
          // que ya oscurece lo de detrás: el esmerilado no aportaba nada que se viera
          // y era el `blur` más caro de la app.
          background: '#FFFCF8',
          borderRight: '1px solid rgba(31, 58, 61, 0.08)',
          boxShadow: '24px 0 60px -24px rgba(31, 58, 61, 0.22)',
        }}
        aria-label="Menú principal"
      >
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #fbf5ec 0%, #f0c8c4 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 16px -4px rgba(184,117,96,0.2)',
              }}
            >
              <DuckLogo size={32} />
            </div>
            <span className="font-display text-2xl font-medium text-pato-charcoal tracking-tight">Pato</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-pato-smoke hover:bg-white/60 hover:text-pato-charcoal transition-colors"
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-pato-rose/45 to-transparent" />
        <nav className="flex-1 px-3 pt-4 pb-6 flex flex-col gap-1 overflow-y-auto">
          {nav.map(({ path, label, Icon }) => {
            const isActive = currentPath === path
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`group flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-white/70 shadow-soft text-pato-charcoal font-medium'
                    : 'text-pato-smoke hover:bg-white/45 hover:text-pato-charcoal'
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-br from-white to-pato-shell shadow-inner'
                      : 'bg-white/55'
                  }`}
                >
                  <Icon size={28} />
                </span>
                <span className="font-body text-[15px] tracking-tight">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="px-6 py-5 text-center">
          <p className="font-display italic text-xs text-pato-muted tracking-wide">Hecho con cariño</p>
        </div>
      </aside>
    </>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
