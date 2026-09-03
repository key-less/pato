/**
 * Superficie del sistema: papel mate.
 *
 * Sustituye al vidrio esmerilado que estaba en todas las tarjetas. Dos razones,
 * de «Aguas tranquilas»:
 *
 * 1. Cuando toda superficie flota, ninguna flota. El vidrio dejaba de significar
 *    nada por repetición, y encima competía con las fotos, que son el contenido.
 * 2. `backdrop-filter: blur(20px)` repetido en una lista larga hunde el scroll a la
 *    mitad de los fps dentro de un WKWebView, que es donde va a vivir la app.
 *
 * El vidrio queda reservado a lo único que de verdad flota sobre el contenido: el
 * widget de «ahora suena».
 *
 * Papel: blanco cálido, un borde de un pelo y una sombra muy baja. Se lee mejor y
 * envejece mejor.
 */
export const paperStyle = {
  background: '#FFFCF8',
  border: '1px solid rgba(31, 58, 61, 0.07)',
  boxShadow: [
    '0 1px 2px -1px rgba(31, 58, 61, 0.10)',
    '0 6px 16px -12px rgba(31, 58, 61, 0.16)',
  ].join(', '),
}

/** Variante elevada, para el elemento principal de una pantalla. */
export const paperStyleRaised = {
  ...paperStyle,
  boxShadow: [
    '0 1px 2px -1px rgba(31, 58, 61, 0.12)',
    '0 14px 32px -18px rgba(31, 58, 61, 0.24)',
  ].join(', '),
}

export default function Panel({ as: Tag = 'div', raised = false, className = '', style, children, ...rest }) {
  return (
    <Tag
      className={`rounded-3xl ${className}`}
      style={{ ...(raised ? paperStyleRaised : paperStyle), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
