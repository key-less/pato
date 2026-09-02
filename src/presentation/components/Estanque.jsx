/**
 * Los dos patos en el agua.
 *
 * El estado de la relacion deja de ser una etiqueta de texto y pasa a ser la
 * distancia entre las dos siluetas: al principio nadan separados con sus propias
 * ondas, al final comparten una sola. Ver la direccion «Aguas tranquilas».
 */

const LINEA_AGUA = 86

/**
 * Los estados por defecto, de mas lejos a mas cerca.
 *
 * Un pato ocupa de x-26 (cola) a x+27 (pico). Cuando se miran, la separacion no
 * puede bajar de 28 o los picos se atraviesan: quedan cerca, nunca encimados.
 */
const ETAPAS = {
  conociendose:     { separacion: 62, ondaComun: 0 },
  poniendose_serio: { separacion: 52, ondaComun: 0 },
  ya_casi:          { separacion: 42, ondaComun: 0.35 },
  somos_pareja:     { separacion: 34, ondaComun: 0.7, mirandose: true },
  casados:          { separacion: 32, ondaComun: 1, mirandose: true },
}

const ORDEN = ['conociendose', 'poniendose_serio', 'ya_casi', 'somos_pareja', 'casados']

/**
 * Un estado personalizado no tiene posicion propia: usa la del estado por defecto
 * mas cercano segun su `order`. El dibujo nunca impide crear estados nuevos.
 */
export function etapaPara(statusId, statuses = []) {
  if (ETAPAS[statusId]) return ETAPAS[statusId]

  const propio = statuses.find((s) => s.id === statusId)
  if (!propio) return ETAPAS.conociendose

  const indice = Math.min(ORDEN.length - 1, Math.max(0, (propio.order ?? 1) - 1))
  return ETAPAS[ORDEN[indice]]
}

function Pato({ x, mirandoIzquierda = false }) {
  return (
    // Espejar alrededor de un punto p es translate(2p) + scale(-1): asi el pato
    // gira sobre si mismo en vez de saltar a otro sitio del lienzo.
    <g
      transform={mirandoIzquierda ? `translate(${2 * x}, 0) scale(-1, 1)` : undefined}
      fill="currentColor"
    >
      <ellipse cx={x} cy="76" rx="19" ry="11.5" />
      <circle cx={x + 13} cy="60" r="7.2" />
      <path d={`M${x + 19} 58.5 l8 2.4 -8 3 z`} fill="#e9b44c" />
      <path d={`M${x - 17} 68 l-9 -4 2.5 9 z`} />
    </g>
  )
}

function Onda({ cx, rx, ry, color, opacity = 1 }) {
  return (
    <ellipse cx={cx} cy={LINEA_AGUA} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth="1.5" opacity={opacity} />
  )
}

/**
 * @param {Object} props
 * @param {string} [props.statusId] - id del estado actual
 * @param {Array}  [props.statuses] - lista completa, para ubicar estados personalizados
 * @param {boolean} [props.solo] - un solo pato esperando (pantalla de emparejamiento)
 * @param {number}  [props.saludo] - sube cuando la pareja aparece; dispara la onda compartida
 * @param {string} [props.label] - texto accesible
 */
export default function Estanque({ statusId, statuses, solo = false, saludo = 0, label, className = '' }) {
  const etapa = etapaPara(statusId, statuses)
  const centro = 100

  const izquierda = centro - etapa.separacion
  const derecha = centro + etapa.separacion
  const propia = 1 - etapa.ondaComun

  const descripcion = label ?? (solo
    ? 'Un pato solo en el agua, esperando'
    : 'Dos patos en el agua; la distancia entre ellos marca el estado de la relacion')

  return (
    <svg
      viewBox="0 0 200 118"
      role="img"
      aria-label={descripcion}
      className={`w-full h-auto text-pato-terra ${className}`}
    >
      {solo ? (
        <>
          <Onda cx={centro} rx={38} ry={7.5} color="#c2a898" opacity="0.7" />
          <Onda cx={centro} rx={24} ry={5} color="#c2a898" opacity="0.95" />
          <Pato x={centro - 8} />
        </>
      ) : (
        <>
          {/* Las ondas propias se apagan conforme nace la comun: al final, una sola
              onda para los dos. Sin esto, las tres se superponen en un enredo. */}
          {propia > 0.01 && (
            <>
              <Onda cx={izquierda + 4} rx={38} ry={7.5} color="#c2a898" opacity={propia * 0.65} />
              <Onda cx={izquierda + 4} rx={23} ry={4.8} color="#c2a898" opacity={propia * 0.95} />
              <Onda cx={derecha - 4} rx={38} ry={7.5} color="#c2a898" opacity={propia * 0.65} />
              <Onda cx={derecha - 4} rx={23} ry={4.8} color="#c2a898" opacity={propia * 0.95} />
            </>
          )}

          {etapa.ondaComun > 0 && (
            <>
              <Onda cx={centro} rx={26 + etapa.ondaComun * 34} ry={5 + etapa.ondaComun * 5} color="#d4664f" opacity={etapa.ondaComun * 0.55} />
              <Onda cx={centro} rx={16 + etapa.ondaComun * 20} ry={3.5 + etapa.ondaComun * 3} color="#d4664f" opacity={etapa.ondaComun * 0.85} />
            </>
          )}

          <Pato x={izquierda} />
          <Pato x={derecha} mirandoIzquierda={etapa.mirandose} />
        </>
      )}

      {/* La onda compartida. La `key` la remonta, y por eso vuelve a reproducirse
          cada vez que la otra persona aparece. */}
      {saludo > 0 && (
        <g key={saludo}>
          {[0, 0.5].map((retraso, i) => (
            <ellipse
              key={i}
              cx={centro}
              cy={LINEA_AGUA}
              rx="30"
              ry="6"
              fill="none"
              stroke="#d4664f"
              strokeWidth="1.5"
              opacity="0"
              className="motion-safe:animate-onda-saludo"
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${retraso}s` }}
            />
          ))}
        </g>
      )}

      <line x1="14" y1={LINEA_AGUA} x2="186" y2={LINEA_AGUA} stroke="#dcc8ba" strokeWidth="1" />
    </svg>
  )
}
