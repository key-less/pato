import { useId } from 'react'

/**
 * Patos SVG originales para los módulos de Pato.
 * Cada pato comparte la misma silueta base (cuerpo, cabeza, pico, ojo) y se
 * diferencia por un accesorio que representa su módulo. Estilo: glassmorphism
 * suave con gradientes rose→coral, accesorios en colores complementarios.
 */

function useGradients() {
  const raw = useId()
  return raw.replace(/:/g, '')
}

function DuckBody({ size = 32, accent, className = '' }) {
  const gid = useGradients()
  const body = `pb-${gid}`
  const head = `ph-${gid}`
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={body} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#f3c5be" />
          <stop offset="55%" stopColor="#dd9e8f" />
          <stop offset="100%" stopColor="#b87560" />
        </linearGradient>
        <linearGradient id={head} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#f5cdc6" />
          <stop offset="100%" stopColor="#cf8676" />
        </linearGradient>
      </defs>
      <ellipse cx="22" cy="42" rx="14" ry="8" fill="#a86755" opacity="0.45" />
      <path
        d="M14 40 Q14 28 27 28 L40 28 Q50 28 50 40 Q50 50 32 50 Q14 50 14 40 Z"
        fill={`url(#${body})`}
      />
      <ellipse cx="22" cy="34" rx="6" ry="3" fill="#f8d6cd" opacity="0.45" />
      <circle cx="44" cy="24" r="11" fill={`url(#${head})`} />
      <ellipse cx="40" cy="20" rx="3.5" ry="3" fill="#f8d6cd" opacity="0.5" />
      <path d="M53 22 L60 24 L53 27 Z" fill="#f0a878" />
      <circle cx="46" cy="22.5" r="2" fill="#2d2424" />
      <circle cx="46.6" cy="22" r="0.55" fill="#fff" />
      {accent}
    </svg>
  )
}

export function DuckLogo(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <path
          d="M28 38 c-2 -2.5 -5.5 -1 -5.5 2 c0 2.2 5.5 5.5 5.5 5.5 c0 0 5.5 -3.3 5.5 -5.5 c0 -3 -3.5 -4.5 -5.5 -2z"
          fill="#9d4f48"
          opacity="0.85"
        />
      }
    />
  )
}

export function DuckHome(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <>
          <path d="M9 14 l1 2 l2 0.3 l-1.5 1.5 l0.4 2 l-1.9 -1 l-1.9 1 l0.4 -2 l-1.5 -1.5 l2 -0.3 z" fill="#d4af6a" />
          <circle cx="14" cy="22" r="1" fill="#d4af6a" opacity="0.7" />
          <circle cx="6" cy="22" r="0.7" fill="#d4af6a" opacity="0.5" />
        </>
      }
    />
  )
}

export function DuckPhotos(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <>
          <rect x="22" y="38" width="14" height="9" rx="1.5" fill="#5a4a52" />
          <rect x="32" y="36" width="3" height="2" fill="#5a4a52" />
          <circle cx="29" cy="42.5" r="3" fill="#a89098" />
          <circle cx="29" cy="42.5" r="1.5" fill="#2d2424" />
          <circle cx="29.4" cy="42" r="0.4" fill="#fff" opacity="0.85" />
        </>
      }
    />
  )
}

export function DuckProfile({ size = 32, className = '' }) {
  const gid = useGradients()
  const d1 = `dp1-${gid}`
  const d2 = `dp2-${gid}`
  return (
    <svg
      viewBox="0 0 80 64"
      width={size}
      height={(size * 64) / 80}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={d1} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#f3c5be" />
          <stop offset="100%" stopColor="#cf8676" />
        </linearGradient>
        <linearGradient id={d2} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#f5d8be" />
          <stop offset="100%" stopColor="#c08560" />
        </linearGradient>
      </defs>
      <g transform="translate(0 8) scale(0.7)">
        <ellipse cx="22" cy="42" rx="14" ry="8" fill="#a86755" opacity="0.4" />
        <path d="M14 40 Q14 28 27 28 L40 28 Q50 28 50 40 Q50 50 32 50 Q14 50 14 40 Z" fill={`url(#${d1})`} />
        <circle cx="44" cy="24" r="11" fill={`url(#${d1})`} />
        <path d="M53 22 L60 24 L53 27 Z" fill="#f0a878" />
        <circle cx="46" cy="22.5" r="2" fill="#2d2424" />
        <circle cx="46.6" cy="22" r="0.55" fill="#fff" />
      </g>
      <path d="M40 26 c-1.5 -2 -4.5 -0.8 -4.5 1.7 c0 2 4.5 4.5 4.5 4.5 c0 0 4.5 -2.5 4.5 -4.5 c0 -2.5 -3 -3.7 -4.5 -1.7z" fill="#d4897a" />
      <g transform="translate(80 8) scale(-0.7, 0.7)">
        <ellipse cx="22" cy="42" rx="14" ry="8" fill="#9a6555" opacity="0.4" />
        <path d="M14 40 Q14 28 27 28 L40 28 Q50 28 50 40 Q50 50 32 50 Q14 50 14 40 Z" fill={`url(#${d2})`} />
        <circle cx="44" cy="24" r="11" fill={`url(#${d2})`} />
        <path d="M53 22 L60 24 L53 27 Z" fill="#f0a878" />
        <circle cx="46" cy="22.5" r="2" fill="#2d2424" />
        <circle cx="46.6" cy="22" r="0.55" fill="#fff" />
      </g>
    </svg>
  )
}

export function DuckPlaylists(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <>
          <path d="M34 24 q0 -10 10 -10 q10 0 10 10" stroke="#7a8c9e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="32" y="22" width="4.5" height="7.5" rx="1.5" fill="#7a8c9e" />
          <rect x="51.5" y="22" width="4.5" height="7.5" rx="1.5" fill="#7a8c9e" />
          <rect x="32.5" y="23" width="3.5" height="3" rx="0.5" fill="#a8b8c8" />
          <rect x="52" y="23" width="3.5" height="3" rx="0.5" fill="#a8b8c8" />
        </>
      }
    />
  )
}

export function DuckLetters(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <>
          <rect x="20" y="37" width="16" height="10" rx="1" fill="#fdf6ee" stroke="#9d6c5e" strokeWidth="0.6" />
          <path d="M20.5 38 L28 43.5 L35.5 38" stroke="#9d6c5e" strokeWidth="0.7" fill="none" />
          <path d="M28 41.5 c-1.5 -1.8 -4 -0.7 -4 1.5 c0 1.5 4 3.5 4 3.5 c0 0 4 -2 4 -3.5 c0 -2.2 -2.5 -3.3 -4 -1.5z" fill="#d4897a" />
        </>
      }
    />
  )
}

export function DuckSettings(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <g transform="translate(48 42)">
          <path d="M-1 -7 L1 -7 L1 -4 L-1 -4 Z M-1 7 L1 7 L1 4 L-1 4 Z M-7 -1 L-7 1 L-4 1 L-4 -1 Z M7 -1 L7 1 L4 1 L4 -1 Z M-5 -5 L-3.5 -3.5 L-3 -4 L-4 -5 Z M5 5 L3.5 3.5 L3 4 L4 5 Z M-5 5 L-4 4 L-3 4.5 L-3.5 3.5 Z M5 -5 L4 -4 L3 -4.5 L3.5 -3.5 Z" fill="#9aa890" />
          <circle r="4" fill="#a8b8a0" />
          <circle r="1.6" fill="#fdf6ee" />
        </g>
      }
    />
  )
}

export function DuckHistory(props) {
  return (
    <DuckBody
      {...props}
      accent={
        <>
          <rect x="21" y="37" width="14" height="11" rx="1" fill="#fdf6ee" stroke="#7a8c9e" strokeWidth="0.6" />
          <rect x="21" y="37" width="14" height="3" fill="#7a8c9e" />
          <line x1="24" y1="35.5" x2="24" y2="38" stroke="#7a8c9e" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="32" y1="35.5" x2="32" y2="38" stroke="#7a8c9e" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="24.5" cy="42" r="0.7" fill="#9aa8b8" />
          <circle cx="28" cy="42" r="0.7" fill="#d4897a" />
          <circle cx="31.5" cy="42" r="0.7" fill="#9aa8b8" />
          <circle cx="24.5" cy="45" r="0.7" fill="#9aa8b8" />
          <circle cx="28" cy="45" r="0.7" fill="#9aa8b8" />
          <circle cx="31.5" cy="45" r="0.7" fill="#9aa8b8" />
        </>
      }
    />
  )
}

export const Duck = DuckHome
