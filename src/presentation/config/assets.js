import {
  DuckLogo,
  DuckHome,
  DuckPhotos,
  DuckProfile,
  DuckPlaylists,
  DuckLetters,
  DuckSettings,
  DuckHistory,
} from '../components/icons/Ducks.jsx'

/** Iconos por módulo (se usan como componentes React en Sidebar) */
export const MODULE_ICONS = {
  inicio: DuckHome,
  fotos: DuckPhotos,
  perfil: DuckProfile,
  playlists: DuckPlaylists,
  cartas: DuckLetters,
  configuracion: DuckSettings,
  historial: DuckHistory,
}

/** Logo principal (para el header del sidebar) */
export const LOGO_DUCK_ICON = DuckLogo

/** Compatibilidad con código antiguo: ya no se usan los JPG de /images. */
export const DUCK_IMAGES = []
export const LOGO_DUCK = '/favicon.svg'
