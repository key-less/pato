/**
 * Superficie de vidrio compartida por toda la app.
 *
 * El problema que resuelve esta versión: la paleta entera vive en una banda de
 * luminosidad muy estrecha (crema #fdf8f0 a rosa #f2c4c4), así que un panel con
 * 35-60% de blanco encima apenas se distinguía del fondo. Las tarjetas no se leían
 * como tarjetas.
 *
 * La corrección no cambia los colores —son los que son y funcionan— sino el rango:
 * más blanco en la superficie, un borde con valor propio y una sombra de contacto
 * que ancla la tarjeta. Sigue siendo vidrio, pero ahora se ve el canto.
 */
export const glassStyle = {
  background: 'linear-gradient(150deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
  backdropFilter: 'blur(20px) saturate(115%)',
  WebkitBackdropFilter: 'blur(20px) saturate(115%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: [
    '0 1px 2px -1px rgba(122, 74, 60, 0.16)',
    '0 8px 24px -12px rgba(122, 74, 60, 0.22)',
    'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  ].join(', '),
}

/** Variante elevada, para el elemento principal de una pantalla. */
export const glassStyleRaised = {
  ...glassStyle,
  background: 'linear-gradient(150deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.68) 100%)',
  boxShadow: [
    '0 2px 4px -2px rgba(122, 74, 60, 0.20)',
    '0 20px 48px -20px rgba(122, 74, 60, 0.30)',
    'inset 0 1px 0 rgba(255, 255, 255, 0.95)',
  ].join(', '),
}

export default function GlassPanel({ as: Tag = 'div', raised = false, className = '', style, children, ...rest }) {
  return (
    <Tag
      className={`rounded-3xl ${className}`}
      style={{ ...(raised ? glassStyleRaised : glassStyle), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
