/**
 * Iconos de trazo para la barra de pestañas.
 *
 * A diferencia de los patos ilustrados (que viven en el menú y en las
 * cabeceras), estos son monocromos y usan `currentColor`: así la pestaña
 * activa se distingue por color, como en las apps nativas de iOS.
 */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.4 12 3.8l8.5 6.6" />
      <path d="M5.6 9v9.2a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4V9" />
      <path d="M9.7 19.6v-5.1h4.6v5.1" />
    </svg>
  )
}

export function CalendarHeartIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="3" />
      <path d="M3.4 9.9h17.2M8.2 3.4v3.4M15.8 3.4v3.4" />
      <path d="M12 18.2s-2.9-1.8-2.9-3.6a1.6 1.6 0 0 1 2.9-.9 1.6 1.6 0 0 1 2.9.9c0 1.8-2.9 3.6-2.9 3.6Z" />
    </svg>
  )
}

export function PhotosIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="3" />
      <circle cx="8.7" cy="10" r="1.5" />
      <path d="M3.9 16.6l4.3-4.1a1.8 1.8 0 0 1 2.5 0l3.2 3.1M13.1 14.2l1.9-1.8a1.8 1.8 0 0 1 2.5 0l2.6 2.5" />
    </svg>
  )
}

export function LetterIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2.6" />
      <path d="M3.9 7.7 12 13l8.1-5.3" />
    </svg>
  )
}

export function MoreIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.4" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18.6" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  )
}
