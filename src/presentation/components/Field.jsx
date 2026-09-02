/**
 * Campo de formulario del sistema.
 *
 * Los módulos repetían la misma cadena de clases en cada input
 * (`rounded-xl border border-pato-honey bg-white/95 px-3 py-2 ...`), así que el
 * estilo de los formularios dependía de recordar copiarla. Aquí vive una sola vez.
 *
 * Altura mínima de 44px porque el uso principal es el móvil, y estado de foco
 * visible: los inputs anteriores no tenían ninguno, así que navegando con teclado
 * no se sabía dónde estabas.
 */
export default function Field({ label, hint, id, className = '', ...rest }) {
  const inputId = id || `campo-${label?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block font-body text-[11px] uppercase tracking-[0.14em] text-pato-smoke mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={
          'w-full min-h-[44px] rounded-2xl px-4 py-2.5 ' +
          'font-body text-sm text-pato-charcoal placeholder-pato-smoke/60 ' +
          'bg-white/75 border border-white/85 ' +
          'shadow-[inset_0_1px_2px_rgba(122,74,60,0.06)] ' +
          'transition-shadow duration-200 ' +
          'focus:outline-none focus:border-pato-terra/45 ' +
          'focus:shadow-[inset_0_1px_2px_rgba(122,74,60,0.06),0_0_0_3px_rgba(184,117,96,0.16)]'
        }
        {...rest}
      />
      {hint && <p className="mt-1.5 font-body text-xs text-pato-smoke">{hint}</p>}
    </div>
  )
}
