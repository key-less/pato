// Genera el set de iconos de patos (SVG) dentro del asset catalog de la app iOS.
// Uso: node ios/tools/generate-ducks.mjs   (desde la raíz del repo)
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const catalog = join(here, '..', 'Pato', 'Resources', 'Assets.xcassets')
const ducksDir = join(catalog, 'Ducks')

const C = {
  yellow: '#FFD45C', yellowDark: '#F4B63B', yellowLight: '#FFE79A',
  cream: '#FFF6E0', creamDark: '#F1DFBD',
  beak: '#FF9A4A', beakDark: '#E97B2E',
  ink: '#4A3B36', cheek: '#FF9E9E', coral: '#F0806A', heart: '#F25C6E',
  water: '#7CCBDB', waterDark: '#4AA6BC', white: '#FFFFFF',
  leaf: '#8CC68A', red: '#E5484D', blue: '#6DB7F2', sick: '#B9D98A',
}

const svg = (body, vb = '0 0 120 120') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="120" height="120" fill="none">${body}</svg>\n`

// ---------- Pato de frente (expresivo) ----------
function frontDuck({ eyes, brows = '', beak = 'closed', extras = '', behind = '', body = C.yellow, shade = C.yellowDark, cheeks = C.cheek, light = C.yellowLight }) {
  const beaks = {
    closed: `<ellipse cx="60" cy="58" rx="12" ry="6.5" fill="${C.beak}"/><path d="M50 58.5 Q60 62 70 58.5" stroke="${C.beakDark}" stroke-width="1.6" stroke-linecap="round"/>`,
    open: `<ellipse cx="60" cy="61" rx="10" ry="7.5" fill="${C.beakDark}"/><ellipse cx="60" cy="64" rx="5.5" ry="3.5" fill="${C.coral}"/><ellipse cx="60" cy="56.5" rx="12" ry="5.5" fill="${C.beak}"/>`,
    sad: `<ellipse cx="60" cy="58" rx="12" ry="6.5" fill="${C.beak}"/><path d="M51 60.5 Q60 55.5 69 60.5" stroke="${C.beakDark}" stroke-width="1.6" stroke-linecap="round"/>`,
    flat: `<ellipse cx="60" cy="58" rx="12" ry="6" fill="${C.beak}"/><path d="M50 58.5 H70" stroke="${C.beakDark}" stroke-width="1.6" stroke-linecap="round"/>`,
    tongue: `<ellipse cx="60" cy="58" rx="12" ry="6.5" fill="${C.beak}"/><path d="M50 58.5 Q60 62 70 58.5" stroke="${C.beakDark}" stroke-width="1.6" stroke-linecap="round"/><path d="M61 61 q4.5 8 8 1.5 z" fill="${C.heart}"/>`,
  }
  return svg(`
  ${behind}
  <ellipse cx="60" cy="112" rx="30" ry="4" fill="${C.ink}" opacity=".10"/>
  <ellipse cx="46" cy="108" rx="9" ry="4.5" fill="${C.beak}"/><ellipse cx="74" cy="108" rx="9" ry="4.5" fill="${C.beak}"/>
  <ellipse cx="60" cy="86" rx="33" ry="25" fill="${body}"/>
  <ellipse cx="60" cy="94" rx="20" ry="13" fill="${light}" opacity=".7"/>
  <ellipse cx="28" cy="84" rx="8" ry="14" fill="${shade}" transform="rotate(14 28 84)"/>
  <ellipse cx="92" cy="84" rx="8" ry="14" fill="${shade}" transform="rotate(-14 92 84)"/>
  <path d="M56 19 q-3 -10 5 -11 q-2 5 1 8 q4 -7 9 -4 q-5 2 -5 8 z" fill="${shade}"/>
  <circle cx="60" cy="48" r="30" fill="${body}"/>
  <ellipse cx="48" cy="33" rx="10" ry="6" fill="${light}" opacity=".75" transform="rotate(-24 48 33)"/>
  <ellipse cx="38" cy="59" rx="6.5" ry="4" fill="${cheeks}" opacity=".8"/><ellipse cx="82" cy="59" rx="6.5" ry="4" fill="${cheeks}" opacity=".8"/>
  ${eyes}${brows}${beaks[beak]}
  ${extras}`)
}

const eye = (x, y = 46, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/><circle cx="${x + 1.4}" cy="${y - 1.5}" r="${r * 0.33}" fill="#fff"/>`
const dotEyes = eye(46) + eye(74)
const arcEyes = `<path d="M41 47 q5 -7 10 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><path d="M69 47 q5 -7 10 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`
const sleepEyes = `<path d="M41 45 q5 5 10 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><path d="M69 45 q5 5 10 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`
const heartAt = (x, y, s, fill = C.heart, o = 1) => `<path transform="translate(${x} ${y}) scale(${s})" opacity="${o}" d="M0 3 C-1 -1 -7 -1 -7 4 C-7 8 0 12 0 12 C0 12 7 8 7 4 C7 -1 1 -1 0 3 Z" fill="${fill}"/>`
const drop = (x, y, s = 1, fill = C.blue) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 C3 -1 4.5 1.5 4.5 4 A4.5 4.5 0 0 1 -4.5 4 C-4.5 1.5 -3 -1 0 -6 Z" fill="${fill}"/>`

const moods = {
  feliz: frontDuck({ eyes: arcEyes, beak: 'open', extras: `<path d="M98 22 l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6 z" fill="${C.yellowDark}"/><path d="M18 34 l1 2.8 l2.8 1 l-2.8 1 l-1 2.8 l-1 -2.8 l-2.8 -1 l2.8 -1 z" fill="${C.yellowDark}"/>` }),
  enamorado: frontDuck({ eyes: heartAt(46, 40, 0.85) + heartAt(74, 40, 0.85), beak: 'open', extras: heartAt(100, 14, 1.1) + heartAt(16, 24, 0.7, C.coral) + heartAt(106, 40, 0.5, C.coral) }),
  tranquilo: frontDuck({ eyes: sleepEyes, beak: 'closed', extras: `<path d="M92 20 q10 -8 16 2 q-10 6 -16 -2 z" fill="${C.leaf}"/><path d="M94 20 q6 -1 12 1" stroke="#fff" stroke-width="1" opacity=".7"/>` }),
  jugueton: frontDuck({ eyes: eye(46) + `<path d="M69 47 q5 -7 10 0" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`, beak: 'tongue', extras: `<path d="M14 26 l8 3 M12 38 l8 -1 M20 16 l5 6" stroke="${C.coral}" stroke-width="2.4" stroke-linecap="round"/>` }),
  cansado: frontDuck({ eyes: `<path d="M41 46 h10 M69 46 h10" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/><path d="M41 51 q5 3 10 0 M69 51 q5 3 10 0" stroke="${C.shade ?? C.yellowDark}" stroke-width="1.8" stroke-linecap="round"/>`, beak: 'flat', extras: `<g fill="none" stroke="${C.waterDark}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M90 26 h8 l-8 9 h8"/><path d="M103 10 h6 l-6 7 h6"/></g>` }),
  triste: frontDuck({ eyes: eye(46, 48) + eye(74, 48), brows: `<path d="M40 40 l10 -4 M80 40 l-10 -4" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`, beak: 'sad', extras: drop(42, 62, 0.9) + `<path d="M84 12 a8 8 0 0 1 14 -3 a7 7 0 0 1 9 9 h-25 a5 5 0 0 1 2 -6 z" fill="#C9D6E2"/>` + drop(90, 28, 0.5) + drop(100, 30, 0.5) }),
  enojado: frontDuck({ eyes: eye(46, 48) + eye(74, 48), brows: `<path d="M39 37 l13 5 M81 37 l-13 5" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`, beak: 'sad', cheeks: C.red, extras: `<g stroke="${C.red}" stroke-width="3" stroke-linecap="round"><path d="M96 14 q4 4 0 8 M104 14 q-4 4 0 8 M92 18 q4 -4 8 0 M92 18 q4 4 8 0" transform="translate(2 0)"/></g><path d="M12 30 q6 -3 4 -9 M22 24 q5 -4 2 -10" stroke="#C9D6E2" stroke-width="3" stroke-linecap="round"/>` }),
  ansioso: frontDuck({ eyes: `<circle cx="46" cy="46" r="6" fill="#fff"/><circle cx="74" cy="46" r="6" fill="#fff"/><circle cx="46" cy="46" r="2.2" fill="${C.ink}"/><circle cx="74" cy="46" r="2.2" fill="${C.ink}"/>`, brows: `<path d="M40 37 l9 -2 M80 37 l-9 -2" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`, beak: 'flat', extras: drop(94, 30, 0.9) + drop(102, 44, 0.6) + `<path d="M12 60 l4 4 M12 72 l5 -2 M108 66 l-4 4" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" opacity=".45"/>` }),
  enfermo: frontDuck({ eyes: sleepEyes, beak: 'flat', cheeks: C.sick, extras: `<rect x="66" y="55" width="30" height="5" rx="2.5" fill="#fff" stroke="${C.ink}" stroke-width="1.2" transform="rotate(-18 66 57)"/><circle cx="96" cy="48" r="4" fill="${C.red}" stroke="${C.ink}" stroke-width="1.2"/><path d="M34 74 q26 12 52 0 l2 9 q-28 13 -56 0 z" fill="${C.coral}"/><path d="M40 82 l-4 18 l9 1 l3 -16 z" fill="${C.coral}"/><path d="M38 79 q22 9 44 0" stroke="#fff" stroke-width="1.6" opacity=".6"/>` }),
  colicos: frontDuck({ eyes: `<path d="M41 44 l9 3 l-9 3 M79 44 l-9 3 l9 3" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`, beak: 'sad', extras: `<rect x="44" y="80" width="32" height="26" rx="8" fill="${C.heart}"/><rect x="55" y="74" width="10" height="8" rx="2" fill="${C.red}"/>${heartAt(60, 87, 0.9, '#fff', 0.9)}<path d="M88 74 q4 -4 0 -8 q-4 -4 0 -8 M98 76 q4 -4 0 -8" stroke="${C.coral}" stroke-width="2.2" stroke-linecap="round"/>` + drop(100, 22, 1.2, C.red) }),
  hambriento: frontDuck({ eyes: `<path d="M46 40 l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8 z" fill="${C.ink}"/><path d="M74 40 l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8 z" fill="${C.ink}"/>`, beak: 'open', extras: drop(69, 72, 0.7) + `<g transform="translate(90 10) rotate(12)"><rect x="0" y="6" width="22" height="16" rx="5" fill="#E8B878"/><path d="M-1 8 a6 6 0 0 1 6 -7 h12 a6 6 0 0 1 6 7 z" fill="#C98B4B"/><path d="M5 12 v6 M11 12 v6 M17 12 v6" stroke="#C98B4B" stroke-width="1.4" stroke-linecap="round"/></g>` }),
  estresado: frontDuck({ eyes: `<g fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"><path d="M46 46 m0 0 a1.5 1.5 0 0 1 3 0 a3 3 0 0 1 -6 0 a4.5 4.5 0 0 1 9 0 a6 6 0 0 1 -11 3"/><path d="M74 46 m0 0 a1.5 1.5 0 0 1 3 0 a3 3 0 0 1 -6 0 a4.5 4.5 0 0 1 9 0 a6 6 0 0 1 -11 3"/></g>`, beak: 'flat', extras: `<path d="M100 8 l-8 12 h6 l-4 12 l12 -15 h-7 z" fill="${C.yellowDark}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/><path d="M14 18 l6 5 M10 30 h8 M22 10 l3 7" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>` }),
}

// ---------- Iconos de sección (pato + accesorio) ----------
const base = (extras, opts = {}) => frontDuck({ eyes: dotEyes, beak: 'closed', extras, ...opts })
const features = {
  logo: frontDuck({ eyes: arcEyes, beak: 'closed', extras: heartAt(60, 80, 1.5) }),
  hoy: base(`<circle cx="100" cy="20" r="9" fill="${C.yellowDark}"/><g stroke="${C.yellowDark}" stroke-width="2.4" stroke-linecap="round"><path d="M100 5 v-3 M100 38 v-3 M85 20 h-3 M118 20 h-3 M89.5 9.5 l-2 -2 M110.5 30.5 l2 2 M110.5 9.5 l2 -2 M89.5 30.5 l-2 2"/></g>`),
  recuerdos: base(`<rect x="40" y="78" width="40" height="28" rx="6" fill="${C.ink}"/><rect x="50" y="73" width="14" height="7" rx="2" fill="${C.ink}"/><circle cx="60" cy="92" r="9" fill="#8E7F7A"/><circle cx="60" cy="92" r="5.5" fill="#2E2522"/><circle cx="62" cy="90" r="1.6" fill="#fff"/><circle cx="74" cy="83" r="1.8" fill="${C.yellow}"/>`),
  fechas: base(`<rect x="40" y="76" width="40" height="32" rx="6" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/><path d="M40 82 a6 6 0 0 1 6 -6 h28 a6 6 0 0 1 6 6 v4 h-40 z" fill="${C.coral}"/><path d="M50 72 v8 M70 72 v8" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>${heartAt(60, 90, 0.95)}`),
  cartas: base(`<rect x="38" y="78" width="44" height="29" rx="5" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/><path d="M39 81 l21 15 l21 -15" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>${heartAt(60, 91, 0.75)}`),
  rio: base(`<path d="M60 70 c-10 0 -17 7.5 -17 16.5 c0 11 17 24 17 24 s17 -13 17 -24 c0 -9 -7 -16.5 -17 -16.5 z" fill="${C.coral}"/><circle cx="60" cy="86.5" r="6.5" fill="#fff"/>`, { behind: `<path d="M0 100 q15 -8 30 0 t30 0 t30 0 t30 0 v20 h-120 z" fill="${C.water}"/>` }),
  musica: base(`<path d="M27 50 a33 33 0 0 1 66 0" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><rect x="18" y="44" width="13" height="22" rx="6" fill="${C.coral}"/><rect x="89" y="44" width="13" height="22" rx="6" fill="${C.coral}"/><g fill="${C.ink}"><ellipse cx="103" cy="24" rx="4" ry="3"/><rect x="105.6" y="8" width="1.8" height="16"/><path d="M105.6 8 l9 3 v4 l-9 -3 z"/></g>`),
  animo: frontDuck({ eyes: arcEyes, beak: 'open', extras: `<circle cx="100" cy="20" r="11" fill="${C.cheek}"/><path d="M95 22 q5 5 10 0" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/><circle cx="96" cy="17" r="1.4" fill="${C.ink}"/><circle cx="104" cy="17" r="1.4" fill="${C.ink}"/><circle cx="20" cy="26" r="9" fill="${C.water}"/><path d="M16 29 q4 -4 8 0" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/><circle cx="17" cy="23.5" r="1.2" fill="${C.ink}"/><circle cx="23" cy="23.5" r="1.2" fill="${C.ink}"/>` }),
  ciclo: base(`<circle cx="60" cy="90" r="15" fill="none" stroke="#fff" stroke-width="6"/><path d="M60 75 a15 15 0 0 1 14.3 10.4" stroke="${C.heart}" stroke-width="6" stroke-linecap="round"/><path d="M75 90 a15 15 0 0 1 -9 13.7" stroke="${C.coral}" stroke-width="6" stroke-linecap="round" opacity=".7"/>${drop(60, 90, 0.9, C.heart)}`),
  ajustes: base(`<g transform="translate(60 91)"><g fill="${C.ink}">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-3.2" y="-17" width="6.4" height="9" rx="2" transform="rotate(${a})"/>`).join('')}<circle r="11.5"/></g><circle r="5" fill="${C.yellowLight}"/></g>`),
  quack: frontDuck({ eyes: arcEyes, beak: 'open', extras: `<g stroke="${C.coral}" stroke-width="3" stroke-linecap="round"><path d="M92 46 l12 -6 M94 58 h14 M92 70 l12 6"/></g>` }),
}

// ---------- Pareja y patos nadando (vista lateral, para el río) ----------
function swimDuck({ body, shade, light, bow = false }) {
  return svg(`
  <path d="M22 62 q-12 -6 -14 -20 q10 6 18 6 z" fill="${shade}"/>
  <path d="M18 66 Q18 46 44 46 H70 Q92 46 92 66 Q92 86 55 86 Q18 86 18 66 Z" fill="${body}"/>
  <path d="M34 62 q14 -10 30 0 q-6 14 -20 12 q-8 -2 -10 -12 z" fill="${shade}"/>
  <ellipse cx="42" cy="54" rx="10" ry="4" fill="${light}" opacity=".7"/>
  <circle cx="82" cy="38" r="20" fill="${body}"/>
  <ellipse cx="75" cy="28" rx="7" ry="4.5" fill="${light}" opacity=".75" transform="rotate(-24 75 28)"/>
  <path d="M78 19 q-2 -8 5 -9 q-2 4 1 7 q3 -6 8 -3 q-5 2 -5 7 z" fill="${shade}"/>
  <path d="M99 36 q14 0 17 6 q-4 5 -17 4 z" fill="${C.beak}"/><path d="M100 41.5 q8 1 15 0.5" stroke="${C.beakDark}" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="88" cy="35" r="3.6" fill="${C.ink}"/><circle cx="89.2" cy="33.8" r="1.2" fill="#fff"/>
  <ellipse cx="84" cy="46" rx="5" ry="3" fill="${C.cheek}" opacity=".8"/>
  ${bow ? `<path d="M70 20 l-9 -7 v12 z M70 20 l9 -9 l2 12 z" fill="${C.heart}"/><circle cx="70" cy="20" r="3" fill="${C.red}"/>` : ''}
  <path d="M4 84 q9 -7 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 v10 q-9 7 -18 0 t-18 0 t-18 0 t-18 0 t-18 0 t-18 0 z" fill="${C.water}"/>
  <path d="M10 96 q7 -4 14 0 M48 98 q7 -4 14 0 M88 96 q7 -4 14 0" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`)
}
const river = {
  'nadando-yo': swimDuck({ body: C.yellow, shade: C.yellowDark, light: C.yellowLight }),
  'nadando-pareja': swimDuck({ body: C.cream, shade: C.creamDark, light: '#fff', bow: true }),
}
const couple = svg(`
  <ellipse cx="60" cy="110" rx="46" ry="5" fill="${C.ink}" opacity=".10"/>
  ${heartAt(60, 8, 1.5)}
  <g><ellipse cx="34" cy="84" rx="26" ry="22" fill="${C.yellow}"/><ellipse cx="34" cy="92" rx="15" ry="11" fill="${C.yellowLight}" opacity=".7"/><circle cx="38" cy="50" r="22" fill="${C.yellow}"/><path d="M35 29 q-2 -8 4 -9 q-1 4 1 6 q3 -5 7 -3 q-4 2 -4 7 z" fill="${C.yellowDark}"/><path d="M56 50 q10 1 12 5 q-3 4 -12 3 z" fill="${C.beak}"/><path d="M40 49 q4 -6 8 0" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="42" cy="58" rx="5" ry="3" fill="${C.cheek}" opacity=".8"/><ellipse cx="26" cy="106" rx="8" ry="4" fill="${C.beak}"/></g>
  <g><ellipse cx="86" cy="84" rx="26" ry="22" fill="${C.cream}"/><ellipse cx="86" cy="92" rx="15" ry="11" fill="#fff" opacity=".8"/><circle cx="82" cy="50" r="22" fill="${C.cream}"/><path d="M64 50 q-10 1 -12 5 q3 4 12 3 z" fill="${C.beak}"/><path d="M72 49 q4 -6 8 0" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="78" cy="58" rx="5" ry="3" fill="${C.cheek}" opacity=".8"/><path d="M88 31 l-8 -6 v11 z M88 31 l8 -8 l2 11 z" fill="${C.heart}"/><circle cx="88" cy="31" r="2.8" fill="${C.red}"/><ellipse cx="94" cy="106" rx="8" ry="4" fill="${C.beak}"/></g>`)

// ---------- Escritura ----------
const all = {}
for (const [k, v] of Object.entries(moods)) all[`duck-mood-${k}`] = v
for (const [k, v] of Object.entries(features)) all[`duck-${k}`] = v
for (const [k, v] of Object.entries(river)) all[`duck-${k}`] = v
all['duck-pareja'] = couple

if (existsSync(ducksDir)) rmSync(ducksDir, { recursive: true })
mkdirSync(ducksDir, { recursive: true })
writeFileSync(join(catalog, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) + '\n')
writeFileSync(join(ducksDir, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) + '\n')
for (const [name, content] of Object.entries(all)) {
  const dir = join(ducksDir, `${name}.imageset`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.svg`), content)
  writeFileSync(join(dir, 'Contents.json'), JSON.stringify({
    images: [{ filename: `${name}.svg`, idiom: 'universal' }],
    info: { author: 'xcode', version: 1 },
    properties: { 'preserves-vector-representation': true },
  }, null, 2) + '\n')
}

// Icono de la app (SVG fuente; el PNG 1024 se renderiza con render-preview.mjs)
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3D1"/><stop offset="1" stop-color="#FFD9A8"/></linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <path d="M0 760 q128 -70 256 0 t256 0 t256 0 t256 0 v264 h-1024 z" fill="${C.water}"/>
  <path d="M0 850 q128 -60 256 0 t256 0 t256 0 t256 0 v174 h-1024 z" fill="${C.waterDark}" opacity=".55"/>
  <g transform="translate(152 96) scale(6)">${features.logo.replace(/<\/?svg[^>]*>/g, '').replace(/<ellipse cx="60" cy="112"[^>]*>/, '')}</g>
  <path d="M0 880 q128 -60 256 0 t256 0 t256 0 t256 0 v144 h-1024 z" fill="${C.water}"/>
</svg>\n`
writeFileSync(join(here, 'app-icon.svg'), icon)

// Hoja de vista previa
const cells = Object.entries(all).map(([n, s]) => `<figure>${s}<figcaption>${n.replace('duck-', '')}</figcaption></figure>`).join('')
writeFileSync(join(here, 'preview.html'), `<!doctype html><meta charset="utf-8"><title>Patos</title><style>body{margin:0;padding:28px;background:#FFF8EA;font:600 13px ui-rounded,system-ui;color:#4A3B36}h1{margin:0 0 18px;font-size:24px}div{display:grid;grid-template-columns:repeat(7,1fr);gap:14px}figure{margin:0;background:#fff;border-radius:22px;padding:12px;text-align:center;box-shadow:0 2px 10px #4a3b3614}svg{width:100%;height:auto}</style><h1>Pato · set de iconos (${Object.keys(all).length})</h1><div>${cells}</div>`)
console.log(`OK: ${Object.keys(all).length} patos`)
