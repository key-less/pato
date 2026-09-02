/**
 * Estado vacío del sistema.
 *
 * Cada módulo resolvía el suyo por su cuenta: unos con un párrafo en cursiva suelto
 * sobre el degradado, otro dentro de un GlassPanel, otro con una tarjeta de color.
 * Seis pantallas, seis tratamientos distintos para exactamente la misma situación.
 *
 * El contorno punteado comunica "aquí va a haber algo" en lugar de parecer una tarjeta
 * ya rellenada, y da un límite visible a una zona que si no queda flotando en el fondo.
 */
export default function EmptyState({ title, hint, className = '' }) {
  return (
    <div
      className={`rounded-3xl px-6 py-10 text-center ${className}`}
      style={{
        border: '1px dashed rgba(217, 179, 168, 0.75)',
        background: 'rgba(255,255,255,0.28)',
      }}
    >
      <p className="font-display text-lg text-pato-charcoal/80 italic">{title}</p>
      {hint && <p className="font-body text-xs text-pato-smoke mt-1.5 max-w-sm mx-auto">{hint}</p>}
    </div>
  )
}
