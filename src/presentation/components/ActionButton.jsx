/**
 * Botón de acción principal.
 *
 * Existe porque cada módulo se inventaba el suyo: el de "Agregar cita" era verde
 * salvia (`bg-pato-sage`), un color que no pertenece a la paleta de la app —
 * crema, miel, melocotón y coral— y que rompía la pantalla al ser además el
 * elemento de mayor peso visual.
 *
 * La acción principal usa ahora el coral de la marca, que es el único color de la
 * paleta con suficiente valor para leerse como "esto es lo importante de la pantalla".
 */
const VARIANTS = {
  primary: {
    background: 'linear-gradient(150deg, #d4897a 0%, #b87560 100%)',
    color: '#fffaf6',
    border: '1px solid rgba(255,255,255,0.28)',
    boxShadow: '0 1px 2px -1px rgba(160, 84, 64, 0.35), 0 8px 20px -8px rgba(180, 100, 78, 0.45)',
  },
  secondary: {
    background: 'linear-gradient(150deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 100%)',
    color: '#5c4a4a',
    border: '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 1px 3px -1px rgba(122, 74, 60, 0.14), 0 4px 12px -6px rgba(122, 74, 60, 0.16)',
  },
}

export default function ActionButton({
  variant = 'primary',
  type = 'button',
  className = '',
  style,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      // min-h-[44px]: objetivo táctil mínimo recomendado en móvil, que es el uso principal.
      className={
        'inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-2xl ' +
        'font-body text-sm font-medium tracking-wide ' +
        'transition-all duration-200 hover:brightness-[1.04] hover:-translate-y-px ' +
        'active:translate-y-0 active:brightness-95 ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pato-terra/60 focus-visible:ring-offset-2 ' +
        'focus-visible:ring-offset-transparent disabled:opacity-55 disabled:pointer-events-none ' +
        'touch-manipulation ' +
        className
      }
      style={{ ...VARIANTS[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}
