/**
 * Superficie de papel mate.
 *
 * Es la superficie por defecto de la app. Sustituye al vidrio esmerilado, que se
 * reserva para lo que de verdad flota sobre el contenido — hoy, solo el widget de
 * «ahora suena». Dos razones, y apuntan al mismo sitio: cuando toda superficie
 * flota ninguna flota, y `backdrop-filter` repetido en una lista larga hunde el
 * scroll dentro de un WebView.
 */
export const estiloPapel = {
  background: '#fffbf4',
  border: '1px solid #eadfce',
  boxShadow: '0 1px 2px rgba(31,58,61,0.05), 0 10px 24px -20px rgba(31,58,61,0.5)',
}

export default function Panel({ as: Tag = 'div', className = '', style, children, ...rest }) {
  return (
    <Tag className={`rounded-3xl ${className}`} style={{ ...estiloPapel, ...style }} {...rest}>
      {children}
    </Tag>
  )
}
