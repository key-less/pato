import { Link } from 'react-router-dom'
import { useHaptics } from '../hooks/useHaptics.js'
import {
  HomeIcon,
  CalendarHeartIcon,
  PhotosIcon,
  LetterIcon,
  MoreIcon,
} from './icons/TabIcons.jsx'

/**
 * Barra de pestañas inferior, patrón de navegación nativo de iOS.
 *
 * Cuatro destinos frecuentes más "Más", que abre el menú lateral con el resto
 * (perfil, playlists, configuración, historial) — el mismo recurso que usa
 * UITabBarController cuando hay más secciones que pestañas.
 *
 * Solo se muestra en pantallas táctiles pequeñas; en escritorio manda el menú.
 */
const tabs = [
  { path: '/', label: 'Inicio', Icon: HomeIcon },
  { path: '/citas', label: 'Citas', Icon: CalendarHeartIcon },
  { path: '/fotos', label: 'Fotos', Icon: PhotosIcon },
  { path: '/cartas', label: 'Cartas', Icon: LetterIcon },
]

export function TabBar({ currentPath, onOpenMenu, menuOpen }) {
  const haptic = useHaptics()

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 pato-chrome"
      style={{
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(251,245,236,0.88) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 -8px 32px -16px rgba(184, 117, 96, 0.28)',
      }}
      aria-label="Navegación principal"
    >
      <ul className="flex items-stretch justify-around h-[3.75rem]">
        {tabs.map(({ path, label, Icon }) => {
          const active = currentPath === path
          return (
            <li key={path} className="flex-1">
              <Link
                to={path}
                onClick={() => haptic('light')}
                aria-current={active ? 'page' : undefined}
                className={`h-full flex flex-col items-center justify-center gap-[3px] tappable transition-colors ${
                  active ? 'text-pato-terra' : 'text-pato-smoke/70'
                }`}
              >
                <Icon width={23} height={23} strokeWidth={active ? 2 : 1.7} />
                <span className={`text-[10px] leading-none tracking-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => {
              haptic('light')
              onOpenMenu()
            }}
            aria-expanded={menuOpen}
            aria-label="Abrir menú con más secciones"
            className={`w-full h-full flex flex-col items-center justify-center gap-[3px] tappable transition-colors ${
              menuOpen ? 'text-pato-terra' : 'text-pato-smoke/70'
            }`}
          >
            <MoreIcon width={23} height={23} />
            <span className={`text-[10px] leading-none tracking-tight ${menuOpen ? 'font-semibold' : 'font-medium'}`}>
              Más
            </span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
