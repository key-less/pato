/**
 * Indicador de carga: ondas en el agua en vez de un spinner.
 * Movimiento lento y sin rebotes, como pide la direccion de diseno.
 */
export default function Ondas({ label = 'Cargando', className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`} role="status" aria-live="polite">
      <span className="relative block w-16 h-16">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full border border-pato-coral/50 motion-safe:animate-onda"
            style={{ animationDelay: `${i * 0.9}s` }}
          />
        ))}
        <span aria-hidden className="absolute inset-[38%] rounded-full bg-pato-coral/70" />
      </span>
      <span className="font-body text-sm text-pato-junco">{label}</span>
    </div>
  )
}
