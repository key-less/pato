/**
 * Superficie de papel mate.
 *
 * Reemplaza al vidrio esmerilado como superficie por defecto: se lee mejor sobre
 * fotos y no hunde el scroll dentro de un WebView. El vidrio queda reservado para
 * lo que de verdad flota, como el widget de «ahora suena».
 */
export const estiloPapel = {
  background: '#fffbf4',
  border: '1px solid #eadfce',
  boxShadow: '0 1px 2px rgba(31,58,61,0.05), 0 10px 24px -20px rgba(31,58,61,0.5)',
}

export default function Panel({ children, className = '', style }) {
  return (
    <div className={`rounded-3xl ${className}`} style={{ ...estiloPapel, ...style }}>
      {children}
    </div>
  )
}
