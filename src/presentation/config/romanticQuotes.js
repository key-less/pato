/**
 * Frases románticas de autores famosos. Se muestra una distinta cada 24 horas
 * (índice según el día del año).
 */
export const ROMANTIC_QUOTES = [
  { text: 'Amar no es mirarse el uno al otro; es mirar juntos en la misma dirección.', author: 'Antoine de Saint-Exupéry' },
  { text: 'El amor no se manifiesta en el deseo de acostarse con alguien, sino en el deseo de dormir junto a alguien.', author: 'Milan Kundera' },
  { text: 'El amor es la única razón sensata y satisfactoria para vivir.', author: 'Leo Buscaglia' },
  { text: 'Amar es encontrar en la felicidad de otro la propia felicidad.', author: 'Gottfried Leibniz' },
  { text: 'El amor es paciente, es bondadoso. No tiene envidia, no hace alarde, no se envanece.', author: 'Pablo de Tarso' },
  { text: 'Donde no hay amor, pon amor y sacarás amor.', author: 'Juan de la Cruz' },
  { text: 'El amor es la poesía de los sentidos.', author: 'Honoré de Balzac' },
  { text: 'Amar es la mitad de creer.', author: 'Victor Hugo' },
  { text: 'El amor es la fuerza más humilde pero más poderosa de que dispone el mundo.', author: 'Mahatma Gandhi' },
  { text: 'El amor no consiste en mirarse el uno al otro, sino en mirar juntos en la misma dirección.', author: 'Antoine de Saint-Exupéry' },
  { text: 'Siempre hay un poco de locura en el amor. Pero siempre hay un poco de razón en la locura.', author: 'Friedrich Nietzsche' },
  { text: 'El amor es como el viento, no puedes verlo pero puedes sentirlo.', author: 'Nicholas Sparks' },
  { text: 'Te amo no por quien eres, sino por quien soy cuando estoy contigo.', author: 'Gabriel García Márquez' },
  { text: 'El amor es la respuesta, y ustedes saben eso por cierto. El amor es la flor; ustedes tienen que permitir que crezca.', author: 'John Lennon' },
  { text: 'Un corazón que ama es siempre joven.', author: 'Proverbio griego' },
  { text: 'El amor es la única realidad y no es solo un sentimiento. Es la verdad última que yace en el corazón de la creación.', author: 'Rabindranath Tagore' },
  { text: 'Amar es dejar que la otra persona sea ella misma.', author: 'Anónimo' },
  { text: 'El amor es la belleza del alma.', author: 'San Agustín' },
  { text: 'El amor es la llave que abre la cerradura de un corazón.', author: 'Anónimo' },
  { text: 'En el amor, uno y uno son uno.', author: 'Jean-Paul Sartre' },
]

/**
 * Devuelve la frase del día (cambia cada 24h según la fecha).
 */
export function getQuoteOfTheDay() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  const index = dayOfYear % ROMANTIC_QUOTES.length
  return ROMANTIC_QUOTES[index]
}
