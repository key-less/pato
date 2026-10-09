# Pato · Brief de diseño para app nativa de iOS

> **Documento de entrada para Claude Design.**
> Define el replanteamiento completo de identidad, tipografía, color, interacción y
> arquitectura de pantallas para migrar **Pato** de web app (React + Tailwind + localStorage,
> una sola pareja) a **app nativa de iOS (SwiftUI) distribuible en el App Store para
> cualquier pareja del mundo**.
>
> Autor: Kevin · Fecha: 2026-10-09 · Versión: 1.0
> Repositorio de origen: `key-less/pato` · Rama de trabajo: `claude/eloquent-ritchie-800kc4`

---

## 0. Cómo usar este documento

**Para Claude Design:** este brief es la fuente de verdad del *qué* y del *por qué*.
Lo que se espera de vuelta está en la **§21 Entregables**. Si algo del brief entra en
conflicto con las Human Interface Guidelines de Apple, **gana Apple** y se anota la
desviación. Si algo falta, está listado en **§23 Preguntas abiertas** — se puede proponer
una respuesta por defecto y marcarla como supuesto, no hay que bloquearse.

**Orden de lectura recomendado:** §1 → §3 → §5 → §6 → §9 → §10 → §21.

---

## 1. El producto hoy vs. el producto que queremos

### 1.1 Hoy (web app, privada, hecha para una pareja)

| Dimensión | Estado actual |
|---|---|
| Plataforma | SPA React 18 + Vite + Tailwind, desplegada en Vercel |
| Navegación | Sidebar hamburguesa con 8 entradas, rutas `react-router` |
| Datos | **Todo en `localStorage`**, sin base de datos, media como data URLs |
| Multiusuario | No existe: dos "perfiles de pareja" son dos objetos en el mismo navegador |
| Backend | Un Express de un solo archivo: envío de cartas por Gmail, OAuth de Spotify/YouTube, "ahora suena" |
| Estética | Glassmorphism CSS: cremas, miel, melocotón, coral; serif `Cormorant Garamond` + sans `Geist` |
| Idioma | Español, hardcodeado en el JSX |
| Accesibilidad | No evaluada |
| Modo oscuro | No existe |

### 1.2 Mañana (app nativa, pública, para cualquier pareja)

- **SwiftUI nativo**, no WebView, no wrapper. Se rehace la capa de presentación desde cero.
- **Cuenta + emparejamiento**: dos personas, dos dispositivos, un mismo espacio compartido.
- **Sincronización real** (CloudKit o backend propio) en lugar de `localStorage`.
- **Internacionalizada** (es/en de salida), **accesible** (Dynamic Type + VoiceOver), con
  **modo claro y oscuro**.
- **Descargable por cualquiera**: onboarding que funciona sin que nadie te explique nada,
  contenido de ejemplo cero, lenguaje que sirve a cualquier pareja.
- Pensada para **ecosistema**: widgets, Live Activities, notificaciones, Apple Watch,
  Shortcuts, Share Sheet.

> **El cambio de marco más importante de todo el proyecto:** Pato deja de ser *"nuestra"*
> app y pasa a ser *"la app de cada pareja"*. Todo texto, ilustración, campo y valor por
> defecto tiene que sobrevivir a ese cambio. Lo que hoy es un detalle entrañable hardcodeado
> (un pato concreto, una fecha concreta, unas fotos concretas) mañana es o bien **contenido
> del usuario**, o bien **identidad de marca**. No hay tercera categoría.

---

## 2. Audiencia y contexto de uso

### 2.1 Quién la usa

- **Parejas de 16 a 40 años**, cualquier género y composición. Nativas de móvil,
  acostumbradas a Instagram/BeReal/Locket: esperan fluidez, gestos y gratificación inmediata.
- **Dos roles simétricos.** No hay "dueño" y "invitada": ambas personas editan, ambas ven
  lo mismo. El diseño no debe sugerir jerarquía.
- **Dos escenarios de distancia**: parejas que se ven a diario y parejas a distancia
  (LDR) con **husos horarios distintos** — relevante para el contador, las citas y las
  notificaciones.

### 2.2 Momentos de uso (diseñar para estos, en este orden)

1. **El vistazo de 5 segundos** — abrir, ver el contador y qué está escuchando la otra
   persona, cerrar. Es el 70% de las sesiones. Tiene que ser instantáneo y precioso.
2. **El aporte de 30 segundos** — subir una foto, registrar una cita, dejar una nota.
   Máximo dos toques desde el inicio hasta empezar a aportar.
3. **La sesión larga y emocional** — escribir una carta, recorrer el álbum, leer el
   historial. Aquí sí se vale pantalla completa, tipografía grande y lentitud deliberada.
4. **La celebración** — aniversarios, hitos (100 días, 1 año). Momentos puntuales con
   tratamiento especial.

---

## 3. Principios de diseño

1. **El contenido es la decoración.** Las fotos, las palabras y las fechas de la pareja son
   lo bonito. La interfaz es el marco: cálida, discreta y sin competir. Si un adorno de la UI
   compite con una foto, el adorno se va.
2. **Cálido, no cursi.** Pato debe sentirse como papel bueno, luz de tarde y tinta — no como
   purpurina, corazones flotantes y rosa chicle. La emoción se transmite con tipografía,
   espacio y ritmo; no con stickers.
3. **Íntimo por defecto.** Nada se comparte fuera de la pareja sin un acto explícito. No hay
   feed, no hay likes, no hay descubrimiento de gente. La app es una habitación de dos.
4. **Nativa de verdad.** Gestos del sistema, materiales del sistema, SF Symbols, Dynamic Type,
   haptics, swipe-back. Si un patrón ya existe en iOS, se usa ese y no uno inventado.
5. **Simétrica.** Toda pantalla que muestre a la pareja trata a ambas personas igual: mismo
   tamaño, mismo peso visual, mismo orden estable y predecible.
6. **Usable por cualquiera.** Legible a 60 años y a plena luz del sol, operable con VoiceOver,
   comprensible sin tutorial, traducible sin romper el layout.
7. **Vacío que invita.** Una app nueva está vacía por definición: los estados vacíos son la
   primera impresión real del producto y se diseñan como pantallas de primera clase, no como
   un texto gris de disculpa.

---

## 4. Identidad de marca

### 4.1 La mascota

El pato es el activo de marca más valioso y hay que **profesionalizarlo**, no eliminarlo.
Hoy son JPG fotográficos de patos de goma y SVGs sueltos por módulo. Se necesita:

- Un **pato ilustrado propio**, vectorial, con una construcción geométrica consistente
  (grid, grosor de trazo, radios) que funcione a 20 pt y a 240 pt.
- Un **set de 6–8 poses** para estados vacíos y celebraciones (saludando, dormido,
  escribiendo una carta, con cámara, con auriculares, bajo la lluvia para errores,
  con confeti para hitos).
- **Dos patos** cuando se represente a la pareja, diferenciables por color/accesorio
  neutro — nunca por género.
- Un pato **monocromo de una sola línea** para barras de navegación e icono pequeño.

El pato es simpático, no infantil: debe poder aparecer en una pantalla donde alguien está
escribiendo algo serio sin romper el tono.

### 4.2 Tono de voz

| Sí | No |
|---|---|
| "Vuestro primer recuerdo" | "¡Awww, qué lindos! 💕" |
| "Aún no hay cartas. La primera siempre es la más difícil." | "¡Ups! No hay nada aquí 😅" |
| "Guardado" | "¡Guardado con éxito!" |
| "Hoy hace 3 años, 2 meses y 11 días" | "¡3 años juntitos!" |

Español neutro (no regionalismos), segunda persona del plural inclusiva, cero signos de
exclamación encadenados, máximo un emoji por pantalla y solo si aporta información.
**Nunca asumir el género de ninguna de las dos personas** (ni con "-o/-a" ni con "@"):
se usan construcciones neutras y, cuando no hay forma elegante, se usa el nombre que la
persona escribió.

---

## 5. Sistema de color

### 5.1 Qué conservar y qué cambiar

La paleta actual (`#fdf8f0` crema, `#f5e6c8` miel, `#f8d7c4` melocotón, `#d4897a` coral)
tiene **el alma correcta** y se conserva como base emocional. Los problemas a resolver:

- **Contraste insuficiente.** `#d4897a` sobre `#fdf8f0` ≈ 2.3:1 → ilegible para texto.
- **No hay modo oscuro.** Obligatorio en 2026; además la app se usa de noche, en la cama.
- **Colores aplicados literalmente** (`text-pato-coral` en el JSX) → imposible de retematizar.
  Se necesita una capa de **tokens semánticos**.
- **Sin señales de estado** (éxito/aviso/error) coherentes con la paleta.

### 5.2 Paleta base (rampas)

Rampas de 11 pasos por familia (0 = más claro, 1000 = más oscuro). Valores clave:

| Familia | 50 | 100 | 300 | 500 | 700 | 900 |
|---|---|---|---|---|---|---|
| **Crema** (neutro cálido) | `#FDF8F2` | `#F7EDE2` | `#E6D5C6` | `#C0A897` | `#6B5A55` | `#2A2220` |
| **Coral** (primario) | `#FFF1EC` | `#FFD9CC` | `#F5A28A` | `#D4897A` | `#A8452F` | `#5E2317` |
| **Miel** (secundario) | `#FFF8E7` | `#FAEBC8` | `#E8C98A` | `#C98A2E` | `#8A5A2B` | `#4A2F14` |
| **Salvia** (positivo) | `#EEF6F1` | `#D3E8DC` | `#8FD0AE` | `#4E9A75` | `#2F6B52` | `#1A3B2D` |
| **Ciruela** (acento 2) | `#F8EFF3` | `#EBD6DF` | `#C79CAE` | `#9B6B7F` | `#7E4F62` | `#422833` |

### 5.3 Tokens semánticos

La UI **nunca** referencia un hex ni un paso de rampa: solo tokens. Cada token tiene valor
en claro y en oscuro.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg/canvas` | `#FDF8F2` | `#16110F` | Fondo raíz de la app |
| `bg/surface` | `#FFFFFF` | `#211A18` | Tarjetas, hojas, celdas |
| `bg/surface-raised` | `#FFF8EF` | `#2B2220` | Tarjeta sobre tarjeta, popovers |
| `bg/sunk` | `#F7EDE2` | `#100C0B` | Campos de texto, pistas de slider |
| `text/primary` | `#2A2220` | `#F5EBE2` | Títulos y cuerpo |
| `text/secondary` | `#6B5A55` | `#C9B6AC` | Metadatos, subtítulos |
| `text/tertiary` | `#8C7A73` | `#9B8780` | Marcas de agua, contadores de caracteres |
| `text/on-accent` | `#FFFFFF` | `#16110F` | Texto sobre relleno de acento |
| `accent/primary` | `#A8452F` | `#FFA48C` | Acción principal, enlaces, selección |
| `accent/primary-fill` | `#A8452F` | `#FFA48C` | Fondo de botón primario |
| `accent/secondary` | `#8A5A2B` | `#E8B57A` | Acento cálido, hitos |
| `state/positive` | `#2F6B52` | `#8FD0AE` | Guardado, sincronizado, enviado |
| `state/warning` | `#8A5A2B` | `#E8B57A` | Sin conexión, pendiente |
| `state/danger` | `#A3302A` | `#FF9A90` | Destructivo, error |
| `border/hairline` | `#00000014` | `#FFFFFF1F` | Separadores de 0.5 pt |
| `border/focus` | `#A8452F` | `#FFA48C` | Anillo de foco de teclado/switch control |

**Contrastes verificados (WCAG 2.1, calculados, no estimados):**

| Par | Ratio | Nivel |
|---|---|---|
| `text/primary` sobre `bg/canvas` (claro) | **14.75:1** | AAA |
| `text/secondary` sobre `bg/canvas` (claro) | **6.18:1** | AA |
| `accent/primary` sobre `bg/canvas` (claro) | **5.59:1** | AA |
| `text/on-accent` sobre `accent/primary-fill` (claro) | **5.90:1** | AA |
| `state/positive` sobre `bg/canvas` (claro) | **5.94:1** | AA |
| `text/primary` sobre `bg/canvas` (oscuro) | **15.93:1** | AAA |
| `text/secondary` sobre `bg/canvas` (oscuro) | **9.61:1** | AAA |
| `accent/primary` sobre `bg/surface` (oscuro) | **8.56:1** | AAA |

Regla: **≥4.5:1 para todo texto**, **≥3:1 para bordes y controles**. Cualquier token nuevo
se valida antes de entrar al sistema.

### 5.4 Reglas de uso del color

- El coral es para **acción**, no para decoración. Si todo es coral, nada es coral:
  **máximo un elemento coral por pantalla** compitiendo por la atención.
- **El color nunca es el único portador de información** (estado de relación, tipo de
  recuerdo, quién escribió qué): siempre va acompañado de forma, icono o texto.
- Sobre fotos, el texto va con **capa de legibilidad** (degradado o material), nunca
  directamente — el contraste contra una foto arbitraria es incontrolable.
- Se respeta **Increase Contrast** del sistema: variante de tokens con bordes sólidos y
  secundarios más oscuros.

### 5.5 Color de pareja (personalización)

Cada pareja elige **un tema** de 6 presets con nombre (`Atardecer` coral · `Miel` ámbar ·
`Salvia` verde · `Ciruela` morado · `Océano` azul · `Tinta` monocromo). El tema cambia
`accent/*` pero **nunca** los neutros ni las señales de estado, para que no se pueda
romper la legibilidad. Esto es además una palanca de monetización natural (§19) y de
identidad: "nuestro color".

---

## 6. Tipografía

### 6.1 Diagnóstico de la tipografía actual

`Cormorant Garamond` + `Geist` es una combinación elegante **en web de escritorio** y
problemática en iOS:

- Cormorant tiene **ejes muy finos y contraste alto**: a 15 pt en un iPhone bajo el sol
  desaparece, y en Dynamic Type grande se vuelve frágil.
- Fuentes web no participan de **Dynamic Type** ni del escalado de accesibilidad sin
  trabajo extra, y añaden peso al bundle.
- Dos fuentes de Google + dos de respaldo = cuatro familias para dos roles reales.

### 6.2 Sistema propuesto

| Rol | Familia | Por qué |
|---|---|---|
| **Display / editorial** | **New York** (serif del sistema, `.serif` design) | Serif de Apple, variable óptica, soporta Dynamic Type nativo, cero bundle, se ve "de libro" sin ser frágil |
| **UI / cuerpo** | **SF Pro** (`.default`) | Legibilidad máxima, todos los pesos, todos los idiomas, métricas del sistema |
| **Numérico** | SF Pro con **`.monospacedDigit`** | Obligatorio en el contador: evita el baile de dígitos cada segundo |
| **Firma (opcional, decorativo)** | Una script variable embebida, p. ej. Caveat | **Solo** para la firma al pie de una carta y las comillas ornamentales. Jamás cuerpo de texto, jamás UI |

> Si en validación New York resulta demasiado sobrio para la marca, la alternativa es
> **una sola serif variable embebida** (Fraunces o Instrument Serif) **solo para display
> ≥20 pt**, con SF Pro para todo lo demás. Nunca más de dos familias activas.

### 6.3 Escala (anclada a los text styles de iOS)

| Token | Text style | Tamaño base | Familia / peso | Uso |
|---|---|---|---|---|
| `display/xl` | largeTitle | 34 | New York Medium | Contador en Inicio |
| `display/l` | title1 | 28 | New York Medium | Títulos de pantalla editoriales |
| `display/m` | title2 | 22 | New York Regular | Citas, encabezados de carta |
| `heading/l` | title3 | 20 | SF Pro Semibold | Secciones |
| `heading/m` | headline | 17 | SF Pro Semibold | Títulos de tarjeta y celda |
| `body/l` | body | 17 | SF Pro Regular | Cuerpo por defecto |
| `body/serif` | body | 17 | New York Regular | Cuerpo de cartas y notas largas |
| `body/m` | callout | 16 | SF Pro Regular | Cuerpo denso |
| `label/l` | subheadline | 15 | SF Pro Medium | Etiquetas de campo |
| `label/m` | footnote | 13 | SF Pro Regular | Metadatos |
| `label/s` | caption1 | 12 | SF Pro Medium | Chips, badges |
| `overline` | caption2 | 11 | SF Pro Semibold, tracking +0.08em, mayúsculas | Eyebrows (ya existe en la web, se conserva) |

### 6.4 Reglas tipográficas

- **Todo texto escala con Dynamic Type hasta AX5.** Prohibido `fixedSize` y prohibido
  truncar texto de usuario para que "quepa": el layout se adapta, el texto no se recorta.
- **Longitud de línea** 60–75 caracteres en lectura larga (cartas): en iPad se limita el
  ancho, no se estira a toda la pantalla.
- **Jerarquía por tamaño y familia, no por color.** El gris claro no es jerarquía, es
  pérdida de contraste.
- La cursiva es un **recurso de marca** (ya se usa en los títulos: *"Nuestros* recuerdos")
  y se conserva, pero solo en display ≥20 pt — nunca en cuerpo ni en labels.
- Interlineado: 1.25 en display, 1.45 en cuerpo, 1.6 en cartas.

---

## 7. Materiales, forma, profundidad y espaciado

### 7.1 Del glassmorphism CSS al material nativo

La web simula el vidrio con `backdrop-filter` + gradientes blancos + sombras coral. En iOS
eso **se reemplaza por materiales del sistema** (`.ultraThinMaterial`, `.thinMaterial`,
`.regularMaterial`): se ven mejor, responden al fondo real y respetan *Reduce Transparency*
automáticamente.

- Si el objetivo de despliegue es **iOS 26+**, usar el lenguaje **Liquid Glass** nativo para
  barras, controles flotantes y la hoja de "ahora suena", agrupando elementos en un mismo
  contenedor de efecto para que se comporten como una sola pieza de vidrio.
  *(Verificar APIs y disponibilidad exacta contra la documentación vigente de Apple antes de
  implementar; si se soporta iOS 18–25, el fallback es `.material` + sombra suave.)*
- **Regla de legibilidad por encima del efecto:** si un texto sobre vidrio no llega a 4.5:1,
  el vidrio se cambia por superficie opaca. Siempre.
- **Como máximo dos planos de vidrio superpuestos.** Más es ruido y coste de GPU.

### 7.2 Forma

| Elemento | Radio |
|---|---|
| Tarjeta grande, hoja modal | 28 pt (continuous) |
| Tarjeta estándar, celda | 20 pt |
| Campo de texto, chip, botón | 14 pt |
| Miniatura de media | 16 pt |
| Avatar, FAB, badge | círculo |

Siempre `RoundedRectangle(cornerRadius:style: .continuous)` — el radio circular de CSS no
es el de iOS y se nota.

### 7.3 Espaciado y rejilla

Escala base **4 pt**: `2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72`.
Margen lateral de pantalla: **20 pt** (16 pt en iPhone SE/mini). Separación entre tarjetas:
12 pt. Padding interno de tarjeta: 16–20 pt. **Todo respeta safe areas** (ya se contemplan
en la web vía `env(safe-area-inset-*)`, se mantiene el criterio).

### 7.4 Elevación

Cuatro niveles, y la sombra es **cálida** (tintada con coral/marrón, nunca gris neutro —
esto ya es un acierto de la web y se conserva):

| Nivel | Uso | Sombra (claro) |
|---|---|---|
| 0 | Fondo, celdas en lista | ninguna |
| 1 | Tarjeta | y 2, blur 12, `#8A4A3A` al 8% |
| 2 | Tarjeta flotante, FAB | y 6, blur 24, `#8A4A3A` al 12% |
| 3 | Hoja modal, menú | y 16, blur 48, `#8A4A3A` al 18% |

En modo oscuro las sombras casi desaparecen y la elevación se expresa con **luminosidad de
superficie + hairline superior**, no con sombra.

---

## 8. Iconografía e ilustración

- **SF Symbols 6+ para todo lo funcional**, en modo jerárquico, alineados ópticamente y
  con `.imageScale` coherente. Nada de iconos de terceros en la UI.
- Mapa de símbolos sugerido:
  `house.fill` Inicio · `photo.stack.fill` Recuerdos · `calendar.heart` Citas ·
  `envelope.fill` Cartas · `person.2.fill` Nosotros · `music.note` Ahora suena ·
  `clock.arrow.circlepath` Historial · `gearshape.fill` Ajustes.
- **El pato ilustrado se reserva** para: icono de app, onboarding, estados vacíos,
  celebraciones de hito y pantalla de error. No se usa como icono de navegación salvo en la
  versión monolínea.
- Las ilustraciones se entregan **vectoriales, en claro y oscuro**, con variante
  monocroma para *Increase Contrast*.
- Nada de fotos de stock de patos de goma en la app de producción (los JPG actuales en
  `/images` son material de prototipo).

---

## 9. Arquitectura de información y navegación

### 9.1 El cambio estructural

La sidebar hamburguesa de 8 entradas **se elimina**. En iOS esconde la navegación detrás de
un toque y rompe la memoria muscular. Se reemplaza por **TabView de 5 pestañas**, que es el
patrón nativo y permite cambiar de contexto sin perder estado.

### 9.2 Las cinco pestañas

| Pestaña | Contiene | Mapeo desde la web |
|---|---|---|
| **1. Inicio** | Contador, estado de la relación, frase del día, "ahora suena" de ambos, próxima cita, últimos recuerdos, hitos | `LandingPage` |
| **2. Recuerdos** | Álbum de fotos y videos, visor, subida, captions, fecha y estado asociado | `MediaModule` |
| **3. Citas** | Timeline de citas pasadas y próximas, alta/edición, lugar, hora, nota | `CitasModule` |
| **4. Cartas** | Bandeja (recibidas/enviadas/borradores), editor, lectura a pantalla completa | `LettersModule` + `SentLetterLog` |
| **5. Nosotros** | Los dos perfiles, playlists, historial de actividad, ajustes de pareja, ajustes de cuenta | `PartnerProfileModule` + `PlaylistsModule` + `HistorialModule` + `SettingsModule` |

Decisiones deliberadas:
- **Playlists deja de ser pestaña**: es consumo esporádico. Vive en *Nosotros*, mientras
  "ahora suena" (que sí es diario) sube a *Inicio* como pieza protagonista.
- **Historial y Ajustes no merecen pestaña**: son destinos de mantenimiento, van en *Nosotros*.
- **La acción de aportar es global**: botón flotante en Inicio con menú contextual
  (Añadir recuerdo · Registrar cita · Escribir carta) — camino de dos toques desde cualquier
  punto de la app.

### 9.3 Jerarquía de presentación

- **Push** (`NavigationStack`) para profundizar en contenido: cita → detalle, carta → lectura.
- **Sheet** para crear/editar: formularios cortos en `.medium`, formularios largos en `.large`.
- **Full screen cover** solo para: visor de foto/video y lectura de carta.
- **Nunca** modal sobre modal. **Siempre** swipe-back y swipe-to-dismiss.

---

## 10. Mapa de pantallas

Para cada pantalla se pide: layout, estado vacío, estado de carga, estado de error,
jerarquía de Dynamic Type, y comportamiento en iPhone pequeño / iPhone grande / iPad.

### 10.1 Onboarding y emparejamiento (NUEVO — no existe en la web)

La pieza más crítica del producto público. La web no la necesitaba porque los datos estaban
ya ahí; la app no existe sin ella.

**Flujo:**
1. **Bienvenida** — pato saludando, nombre, una frase que diga qué es Pato en ≤12 palabras,
   dos botones: *Empezar* / *Me invitaron*.
2. **Cuenta** — Sign in with Apple primero (obligatorio si hay otros proveedores),
   más email. Sin fricción, sin pedir datos que no se usan.
3. **Tu nombre** — un campo. Nada más.
4. **Emparejar** — pantalla con **código de 6 caracteres** + botón *Compartir invitación*
   (Share Sheet) + campo para introducir un código recibido. Estados: esperando, vinculado,
   código caducado.
5. **Vuestra fecha** — selector de la fecha en que empezó todo, con opción *Luego*.
   Esta fecha alimenta el contador: es el dato más emocional de la app, merece su pantalla.
6. **Vuestro tema** — los 6 presets de color con vista previa en vivo.
7. **Permisos, uno a uno y justificados en el momento**: notificaciones (al activar el
   primer recordatorio), fotos (al subir el primer recuerdo). **Nunca al arranque.**
8. **Listo** — el pato con confeti y un *único* siguiente paso sugerido.

**Reglas:** máximo 7 pantallas, saltable a partir de la 5, progreso visible, cero jerga,
y un **modo "mirar antes de entrar"** que permita ver la app con datos de demostración
claramente marcados.

### 10.2 Inicio

Secciones, en orden de arriba a abajo:

1. **Contador** — pieza heroica. Años/meses/días (y opcionalmente horas/minutos) con
   dígitos monoespaciados. Toque = cambia de formato (desglosado ↔ "1.234 días" ↔
   "desde el 3 de mayo de 2023"). Tratamiento especial en hitos (§12.4).
2. **Estado de la relación** — chip editable (ya existe el concepto de estados
   personalizados en la web: se conserva y se expone mejor).
3. **Ahora suena, lado a lado** — dos tarjetas simétricas, una por persona, con portada,
   título, artista y onda animada cuando hay reproducción; estado "nada sonando" digno,
   y estado "sin conectar" con CTA discreto.
4. **Frase del día** — serif grande, comillas ornamentales, autoría. Gesto: swipe para
   otra frase, long press para guardar como favorita.
5. **Próxima cita** — tarjeta con cuenta atrás si está a menos de 7 días.
6. **Recuerdos recientes** — carrusel horizontal de 3–5, toque abre el visor.
7. **Hitos** — cinta discreta cuando falta poco para uno ("faltan 12 días para 2 años").

**Estado vacío de Inicio** (pareja recién emparejada): el contador es lo único que existe;
debajo, tres tarjetas de invitación ("Subid vuestra primera foto", "Registrad vuestra primera
cita", "Escribid la primera carta"). Que la app vacía ya se sienta bien.

> Se elimina de Inicio el efecto de **fotos y videos flotantes** (`FloatingPhotos`,
> `FloatingVideos`): es encantador en web de escritorio pero en móvil roba atención,
> gasta batería, choca con el scroll y es un problema de accesibilidad con *Reduce Motion*.
> Su valor emocional se recupera en el carrusel de recuerdos y en el widget.

### 10.3 Recuerdos

- **Rejilla** de 3 columnas (2 en AX grande) con agrupación por mes, encabezados sticky.
- Conmutadores de vista: *Todo · Fotos · Videos · Favoritos*.
- **Visor a pantalla completa**: zoom con pinch, swipe horizontal entre medios,
  swipe vertical para cerrar, transición `matchedGeometryEffect` desde la miniatura.
- **Metadatos por recuerdo**: fecha, caption, lugar opcional, **estado de la relación en ese
  momento** (concepto propio de Pato que ya existe en la web y es una joya: conservarlo y
  mostrarlo como sello/badge), y quién lo subió.
- **Subida**: `PhotosPicker` nativo, múltiple, con progreso por elemento y reintento.
  Importante: en nativo la media va a almacenamiento real, no a data URLs — el diseño puede
  asumir álbumes de cientos de elementos (la web no podía).
- Acciones por elemento: favorito, editar caption, compartir, eliminar (con confirmación y
  deshacer).

### 10.4 Citas

- **Timeline vertical** partida en *Próximas* y *Pasadas*, con la línea de tiempo como
  elemento gráfico.
- Tarjeta de cita: fecha grande, hora, lugar, nota, y fotos vinculadas si las hay.
- **Alta en una hoja**: fecha, hora, lugar, nota. Cuatro campos, un toque para guardar.
- Extras nativos: *Añadir a Calendario*, recordatorio push, mapa estático del lugar,
  y **vincular recuerdos a la cita** (la gran mejora frente a la web, donde citas y fotos
  viven separadas).
- Estado vacío con pato y copy que invite a registrar la primera.

### 10.5 Cartas

El módulo más emocional y el que más cambia respecto a la web.

- **Hoy**: se escribe una carta y se envía **por email** vía backend con Gmail.
  **En nativo**: la carta se entrega **dentro de la app** a la otra persona, con push
  ("Tienes una carta"), y el email queda como opción secundaria de exportación.
  Esto elimina dependencia de Gmail, mejora la privacidad y crea el mejor bucle de
  retención del producto.
- **Bandeja** con tres segmentos: *Recibidas · Enviadas · Borradores*.
- **Editor**: lienzo tipo papel (textura sutilísima), serif, foco total (sin barras),
  autoguardado, contador de palabras discreto, y **selector de papel/sello** como
  personalización ligera.
- **Lectura**: pantalla completa, scroll pausado, firma al pie con la script decorativa,
  fecha de envío, y un único gesto para responder.
- **Cartas programadas** (futuro, muy alto valor): escribir hoy, se entrega en una fecha.
  Diseñar el estado "sellada hasta el 14 de febrero" con cierre visual de sobre.

### 10.6 Nosotros

- **Dos perfiles en paralelo**, simétricos. Cada uno con foto, nombre, cumpleaños y los
  campos de gustos que ya existen (color favorito, comida favorita, lugar favorito, deporte,
  *lo que más le encanta del otro*, *qué los hace únicos*). Se replantean como **tarjetas de
  "ficha"** rellenables poco a poco, con indicador de completitud — es contenido, no
  formulario.
- **Solo puedes editar tu propia ficha**; la de la otra persona se ve, no se edita.
  Excepción: el campo "lo que más me encanta de ti" lo escribe cada uno **sobre el otro**,
  y eso merece un tratamiento visual distinto (cita dedicada).
- **Playlists**: lista de playlists vinculadas (Spotify / YouTube Music) con portada, número
  de canciones y apertura en la app externa. Alta pegando un enlace.
- **Historial de actividad**: feed cronológico de todo lo que ha pasado en el espacio
  compartido, con avatar de quién lo hizo. Agrupado por día.
- **Ajustes**: fecha de inicio, estados de relación personalizados, tema, notificaciones,
  privacidad y datos, idioma, desvincular pareja (con fricción deliberada y explicación
  honesta de qué pasa con los datos), exportar todo, eliminar cuenta.

### 10.7 Pantallas de sistema que hay que diseñar igual

Sin conexión · Sincronizando · Conflicto de sincronización · Sesión caducada ·
Pareja desvinculada · Almacenamiento lleno · Permiso de fotos denegado ·
Actualización requerida · Error genérico (pato bajo la lluvia).

---

## 11. Catálogo de componentes

Entregar cada uno con **todos sus estados** (reposo, presionado, deshabilitado, cargando,
error, foco de teclado) en claro/oscuro y en tamaños de Dynamic Type por defecto y AX3.

**Fundamentos:** botón (primario / secundario / terciario / destructivo), chip/tag,
campo de texto, área de texto, selector de fecha, toggle, segmented control, slider,
checkbox, stepper.

**Contenedores:** tarjeta, tarjeta de vidrio, celda de lista, sección con encabezado,
hoja modal, popover, banner, toast, barra de navegación, barra de pestañas, FAB con menú.

**Específicos de Pato:** tarjeta de contador · chip de estado de relación ·
tarjeta "ahora suena" (con onda animada) · tarjeta de cita · miniatura de recuerdo ·
sello de estado-en-el-momento · tarjeta de ficha de perfil · avatar de pareja (dos
avatares entrelazados) · tarjeta de carta (cerrada / abierta / sellada) · fila de playlist ·
fila de evento de historial · cinta de hito · tarjeta de invitación de estado vacío ·
código de emparejamiento.

**Visuales:** estados vacíos (8 variantes con pato), skeleton de carga por tipo de
contenido, indicador de progreso de subida, celebración de hito.

---

## 12. Interacción, gesto y movimiento

El usuario pidió explícitamente que **todo sea interactivo**. La interactividad aquí no es
animar por animar: es que cada elemento responda, y que responder signifique algo.

### 12.1 Regla de respuesta

**Todo lo tocable responde en menos de 100 ms**, con al menos dos de: cambio de escala
(0.97), cambio de material/opacidad, haptic. Nada se toca "en vano".

### 12.2 Gestos por pantalla

| Gesto | Dónde | Resultado |
|---|---|---|
| Toque | Contador | Cambia formato |
| Long press | Tarjeta de recuerdo | Menú contextual con vista previa |
| Pinch | Visor | Zoom |
| Swipe ← → | Visor / frase del día | Siguiente elemento / otra frase |
| Swipe ↓ | Visor, lectura de carta | Cerrar con arrastre proporcional |
| Swipe ← en celda | Citas, cartas, playlists | Acciones (favorito / eliminar) |
| Pull to refresh | Inicio, Recuerdos | Sincronizar |
| Drag | Rejilla de recuerdos | Reordenar favoritos |
| Shake / nada | — | **No usar**: no descubrible |

Toda acción destructiva tiene **confirmación o deshacer**, nunca ambos y nunca ninguno.

### 12.3 Movimiento

- **Springs, no curvas de duración.** Respuesta 0.35–0.45, amortiguación 0.8 para UI;
  respuesta 0.5, amortiguación 0.7 para transiciones de contenido grande.
- **Transiciones compartidas** (`matchedGeometryEffect`) entre miniatura y visor, entre
  tarjeta de carta y lectura: es lo que hace que la app se sienta nativa y no una web.
- **Entradas escalonadas** de 40 ms por elemento en listas, máximo 6 elementos; a partir del
  séptimo, sin animación.
- **El contador se anima en cada tick** solo con una transición numérica mínima; nada que
  llame la atención cada segundo.
- **`Reduce Motion`**: todas las transiciones de movimiento pasan a fundido cruzado; cero
  paralaje, cero flotación, cero confeti con movimiento (se sustituye por un fundido festivo).

### 12.4 Hitos y celebración

Los hitos (100 días, 6 meses, cada aniversario, cumpleaños de cada uno, cita número 10/50/100)
son el momento en que la app puede permitirse ser emotiva de verdad:
contador con tratamiento especial, una pantalla de celebración compartida en ambos
dispositivos, y un recuerdo generable para compartir fuera. **Máximo un momento de
celebración al día** y siempre descartable con un toque.

### 12.5 Haptics

| Evento | Feedback |
|---|---|
| Selección, cambio de pestaña | `.selection` |
| Guardado, envío de carta | `.success` |
| Error de validación | `.error` |
| Favorito | impacto ligero |
| Hito alcanzado | secuencia de impactos medios |

Nada de haptics en scroll ni en aparición de contenido. Respetar el ajuste del sistema.

### 12.6 Sonido

Opcional y **desactivado por defecto**: cierre de sobre al enviar carta, obturador suave al
guardar un recuerdo. Nunca música de fondo. Jamás sonido sin ajuste para apagarlo.

---

## 13. Estados: carga, vacío, error, offline

Cada pantalla se entrega con **cinco estados obligatorios**: ideal, vacío, cargando,
error, offline. Reglas:

- **Carga**: skeleton con la forma del contenido real. Nunca spinner a pantalla completa
  si ya hay datos en caché que mostrar. Nunca bloquear la interacción si se puede evitar.
- **Vacío**: ilustración + título en display + una frase + **una** acción. Nunca un párrafo
  de disculpa.
- **Error**: qué pasó en lenguaje humano, qué puede hacer la persona, y botón de reintento.
  Nunca un código de error sin traducción.
- **Offline**: la app es **local-first**: se lee y se escribe sin conexión y se sincroniza
  después. Indicador discreto y persistente, nunca modal bloqueante.
- **Optimista**: lo que la persona crea aparece de inmediato con marca de "pendiente", y la
  marca desaparece al sincronizar.

---

## 14. Accesibilidad (requisito, no extra)

Checklist que el diseño debe poder aprobar:

- [ ] **Contraste** ≥4.5:1 en texto, ≥3:1 en controles y bordes, en claro y en oscuro,
      incluido texto sobre vidrio y sobre foto.
- [ ] **Dynamic Type** de xSmall a **AX5** sin solapamientos, sin truncar texto de usuario y
      sin scroll horizontal. Layouts que pasan a vertical cuando el texto crece.
- [ ] **Objetivos táctiles** ≥44×44 pt con ≥8 pt de separación.
- [ ] **VoiceOver**: orden de foco lógico, `accessibilityLabel` en todo control sin texto,
      agrupación de tarjetas en un solo elemento con resumen (el contador se lee
      "3 años, 2 meses y 11 días juntos", no dígito a dígito), rotor de encabezados,
      anuncio de cambios con `accessibilityAnnouncement`.
- [ ] **Reduce Motion**, **Reduce Transparency**, **Increase Contrast**, **Bold Text**,
      **Differentiate Without Color** — las seis con variante definida.
- [ ] **Daltonismo**: ninguna información solo por color; probado en protanopia,
      deuteranopia y tritanopia.
- [ ] **Teclado y Switch Control**: todo alcanzable, anillo de foco visible.
- [ ] **Medios**: alt text en fotos (editable por la pareja), subtítulos/mute en video,
      nada que parpadee más de 3 veces por segundo.
- [ ] **Lectura**: cuerpo de cartas con ancho limitado y opción de espaciado aumentado.

---

## 15. Internacionalización

- **Idiomas de salida: español e inglés.** Siguiente ola: portugués, francés, italiano,
  alemán. Estructura lista desde el día 1.
- **Cero texto en imágenes.** Todo string localizable, nada concatenado.
- **Pluralización y género gramatical** vía stringsdict: "1 día" / "2 días", "1 cita" /
  "2 citas". El contador es el caso más delicado: *"3 años, 2 meses y 11 días"* tiene
  estructura distinta en cada idioma; se localiza la **frase completa**, no las piezas.
- **Fechas, horas y números** siempre con formateadores del sistema. Primer día de la semana
  según región. Formato 12/24 h según dispositivo.
- **+35% de longitud** prevista en el layout (el alemán rompe todo lo apretado).
- **RTL** (árabe, hebreo) contemplado en la estructura: layouts espejables, iconos
  direccionales invertidos, nada de márgenes "left/right" fijos.
- **Zonas horarias**: parejas a distancia. Las citas se muestran en hora local de cada
  persona con indicación cuando difieren; el contador se calcula sobre una zona de
  referencia acordada por la pareja.
- Nombres: campo único y largo, Unicode completo, sin asumir nombre + apellido ni longitud.

---

## 16. Inclusividad: de "nuestra app" a "la app de cualquier pareja"

Esto es lo que más hay que reescribir del producto actual.

| Hoy | Debe ser |
|---|---|
| "Perfil de la pareja" con dos perfiles anónimos | Dos personas con nombre, simétricas, cada una dueña de su ficha |
| Idioma español hardcodeado | Localizable |
| Dos patos que podrían leerse como géneros | Dos patos diferenciados por color/accesorio neutro |
| Copy con "-o/-a" implícito | Neutro o con el nombre propio |
| Un solo modelo de relación | Estados de relación **personalizables** (ya existe en la web: es una de las mejores ideas del producto, y hay que elevarla) |
| Una fecha de inicio única | Fecha de inicio + opción de hitos personalizados (cada pareja cuenta desde lo que quiere) |

Además: evitar asumir convivencia, matrimonio, hijos o monogamia en el copy; evitar fechas
festivas específicas de una cultura como contenido obligatorio (San Valentín es opcional y
local); permitir apodos; permitir que una persona no quiera foto.

---

## 17. Privacidad y confianza (y lo que exige el App Store)

El contenido de Pato es lo más íntimo que alguien puede guardar en el teléfono. La confianza
es una **característica de diseño**:

- **Pantalla de privacidad explicada en lenguaje humano** en onboarding y en ajustes:
  qué se guarda, dónde, quién lo ve, qué pasa si desvinculáis.
- **Bloqueo con Face ID / Touch ID** opcional (y por módulo: que las cartas se puedan
  bloquear aparte).
- **Permisos pedidos en contexto**, con una frase propia antes del diálogo del sistema.
- **Exportar todo** y **eliminar cuenta** accesibles de verdad (requisito del App Store),
  no enterrados.
- **Nada de analítica invasiva ni rastreo** entre apps. Si hay métricas, anónimas y
  declaradas en la ficha de privacidad.
- **Desvincular pareja**: diseñar este flujo con cuidado y honestidad. Es el peor día de
  alguien usando la app. Nada de confeti, nada de "¿seguro?" frívolo: explicar qué pasa con
  los recuerdos de cada uno y ofrecer exportación antes de confirmar.
- **Edad**: clasificación 12+ probable; sin contenido explícito y sin funciones sociales
  abiertas. Revisar las guidelines antes de enviar.

---

## 18. Ecosistema Apple (diseñar ya, construir después)

| Superficie | Qué muestra | Prioridad |
|---|---|---|
| **Widget de pantalla de inicio** (S/M/L) | Contador, foto del día, próxima cita | **Alta** — es la mejor publicidad del producto |
| **Widget de pantalla de bloqueo** | Días juntos, cuenta atrás al hito | Alta |
| **Notificaciones push** | Carta recibida, recuerdo nuevo, hito, recordatorio de cita | Alta |
| **Live Activity** | Cuenta atrás el día de un aniversario o de una cita | Media |
| **Apple Watch** | Complicación de contador, "ahora suena", enviar una nota corta | Media |
| **Shortcuts / Siri** | "Añadir recuerdo a Pato", "¿cuántos días llevamos?" | Media |
| **Share Extension** | Compartir una foto desde Fotos directo a Recuerdos | Media |
| **App Clip** | Abrir una invitación de emparejamiento sin instalar | Baja |
| **iPad / Mac (Catalyst)** | Álbum y lectura de cartas en pantalla grande | Baja |
| **SharePlay** | Ver el álbum juntos a distancia | Idea |

Las notificaciones son el punto donde una app de parejas se vuelve molesta: **máximo una
push no solicitada al día**, todas desactivables por categoría, y ninguna que presione
emocionalmente ("hace 5 días que no subes nada" está prohibido).

---

## 19. Monetización futura y su diseño

No condiciona la v1, pero el diseño debe dejarle sitio sin volverse hostil.

- **Gratis**: contador, perfiles, citas, cartas, recuerdos hasta un límite generoso,
  1 tema, widget básico.
- **Pato Plus** (suscripción de pareja, un pago cubre a ambos): recuerdos ilimitados,
  todos los temas, cartas programadas, papeles y sellos, widgets avanzados, exportar álbum
  en PDF/libro, respaldo.
- **Reglas de diseño del paywall**: nunca interrumpir un momento emocional (jamás al
  terminar de escribir una carta ni al abrir una recibida); un solo paywall, honesto, con el
  precio visible y el botón de cerrar visible; nunca bloquear el acceso a contenido ya
  creado — degradar funciones, no secuestrar recuerdos.

---

## 20. App Store

- **Icono**: el pato monolínea sobre degradado crema→coral. Legible a 29 pt, sin texto,
  sin degradado complejo. Entregar también variantes de **icono tintado y oscuro** (iOS 18+).
- **Capturas**: 6 por idioma, cada una con un titular corto. Orden: contador → recuerdos →
  cartas → citas → ahora suena → widgets.
- **Nombre y subtítulo**: "Pato" + subtítulo que explique la categoría (el nombre no es
  autoexplicativo fuera del contexto de la pareja; valorar "Pato · Recuerdos de pareja").
- **Ficha de privacidad** y texto de revisión con **una cuenta de demostración ya
  emparejada**: sin ella, una app de parejas es irrevisable y la rechazan.

---

## 21. Entregables que se piden a Claude Design

1. **Dirección visual** — 2 o 3 propuestas de estilo sobre la pantalla de Inicio, en claro y
   oscuro, para elegir una antes de escalar.
2. **Design tokens** — JSON (color, tipografía, espaciado, radios, elevación, movimiento)
   con valores para claro y oscuro, exportable a Swift.
3. **Especificación tipográfica** — escala completa mapeada a los text styles de iOS, con
   muestras en xSmall / Large / AX3 / AX5.
4. **Especificación de color** — rampas, tokens semánticos, tabla de contrastes verificados,
   los 6 temas de pareja.
5. **Biblioteca de componentes** — el catálogo de §11 con todos los estados.
6. **Pantallas** — las de §10 en alta fidelidad, cada una con sus 5 estados, en iPhone
   pequeño y grande; iPad para Recuerdos y Cartas.
7. **Flujos** — onboarding y emparejamiento, subir un recuerdo, escribir y enviar una carta,
   registrar una cita, desvincular pareja.
8. **Especificación de movimiento** — tabla de transiciones con parámetros de spring,
   gestos y haptics, más la variante *Reduce Motion*.
9. **Set de ilustración** — pato en 6–8 poses + 8 estados vacíos, claro/oscuro, vectorial.
10. **Iconografía** — mapa de SF Symbols por función y pato monolínea.
11. **Informe de accesibilidad** — el checklist de §14 verificado contra los diseños.
12. **Guía de copy** — tono, glosario es/en, y los strings reales de todas las pantallas
    (que es lo que después se localiza).
13. **Assets de App Store** — icono en sus variantes y las 6 capturas con titulares.
14. **Prototipo interactivo** — navegación entre las 5 pestañas y los gestos clave, para
    validar antes de escribir SwiftUI.

**Formato de entrega preferido:** documentación en Markdown + tokens en JSON + prototipo
navegable. Todo debe poder traducirse a SwiftUI sin ambigüedad: medidas en pt, nombres de
token, nombres de SF Symbols, parámetros de animación.

---

## 22. Fuera de alcance / decisiones ya tomadas

- **No** es un WebView ni una PWA empaquetada. Se rehace la presentación en SwiftUI nativo.
- **No** se portan el glassmorphism CSS, las fuentes web ni los JPG de patos de goma.
- **No** se mantiene la sidebar hamburguesa.
- **No** se mantienen las fotos/videos flotantes en Inicio.
- **No** hay funciones sociales: ni feed, ni perfiles públicos, ni descubrimiento, ni
  comparación entre parejas.
- **No** hay chat: Pato no compite con WhatsApp. Las cartas son deliberadamente lentas.
- **No** se diseña Android en esta fase (pero los tokens se mantienen agnósticos para que sea
  posible después).
- **No** se usa IA generativa en la experiencia por ahora.

---

## 23. Preguntas abiertas

Si bloquean el avance, se puede proponer una respuesta por defecto y marcarla como supuesto.

1. **Versión mínima de iOS.** ¿iOS 26+ (permite usar Liquid Glass nativo, reduce trabajo,
   limita audiencia) o iOS 18+ (más alcance, hay que diseñar dos sistemas de material)?
   *Supuesto sugerido: iOS 18+ con mejoras progresivas en 26+.*
2. **Sincronización.** ¿CloudKit (gratis, privado, sin backend, pero solo Apple y complica
   compartir con usuarios de Android después) o backend propio tipo Supabase (ya mencionado
   en el repo para el futuro)? Afecta a los estados de sincronización y conflicto del diseño.
3. **Alcance de la v1.** ¿Las 5 pestañas completas, o v1 = Inicio + Recuerdos + Citas y las
   cartas y playlists en la v1.1?
4. **Música.** ¿Se mantiene Spotify + YouTube Music, o se añade Apple Music (lo esperado en
   iOS y con mejor API de "ahora suena")?
5. **Cartas por email.** ¿Se conserva el envío por Gmail como opción, o la entrega es solo
   in-app? (Recomendación: solo in-app, con exportar a PDF.)
6. **Nombre público.** "Pato" es entrañable pero no dice nada en el App Store ni fuera del
   español. ¿Se mantiene tal cual, con subtítulo que lo explique?
7. **Monetización.** ¿Gratis con Plus desde el inicio, o gratis puro hasta tener tracción?
8. **Migración.** ¿Hay que importar los datos actuales de `localStorage` de la pareja
   fundadora (es decir, diseñar un flujo de importación), o la app empieza limpia?

---

## Anexo A · Inventario funcional de la web actual

Para que el diseño cubra todo lo que ya existe. Fuente: código en `src/`.

**Entidades de dominio:** `AppState` (fecha de inicio, nº de citas, estado actual, estados
personalizados), `Cita` (fecha, hora de encuentro, lugar, nota), `Media` (tipo foto/video,
fuente, miniatura, fecha, estado de relación asociado, caption, mostrar en inicio),
`Letter`, `SentLetterLog`, `PartnerProfile` (nombre, apellido, fecha de nacimiento, color
favorito, comida favorita, lo que más le encanta del otro, lugar favorito, deporte favorito,
qué los hace únicos, foto de perfil), `Playlist`, `ActivityEvent`, `RelationshipStatus`.

**Pantallas:** Inicio (`LandingPage`), Fotos y videos (`MediaModule`), Perfil de la pareja
(`PartnerProfileModule`), Playlists (`PlaylistsModule`), Cartas (`LettersModule`), Citas
(`CitasModule`), Historial (`HistorialModule`), Configuración (`SettingsModule`).

**Componentes propios:** contador en vivo (`useElapsedCounter`, `useDaysSince`), widget de
"ahora suena" con Spotify/YouTube, panel de vidrio, cabecera de módulo, fotos y videos
flotantes, iconos de patos por módulo, frases románticas del día (`romanticQuotes`).

**Servicios de backend:** envío de cartas por Gmail, OAuth de Spotify por perfil (0 y 1),
OAuth de YouTube, lectura de metadatos de playlists, "ahora suena".

**Deuda que la migración resuelve:** sin persistencia real, sin multiusuario, sin modo
oscuro, sin accesibilidad, sin i18n, media como data URLs (límite de ~5 MB de localStorage),
tokens de OAuth en memoria del proceso (se pierden al reiniciar), color aplicado
literalmente en el JSX.

---

## Anexo B · Resumen ejecutivo en una página

> **Pato** pasa de ser una web app privada para una pareja a una **app nativa de iOS para
> cualquier pareja del mundo**. Conserva su alma —cremas y corales cálidos, tipografía
> editorial, el pato, el contador, los estados de relación personalizados, el sello del
> "estado en ese momento" en cada recuerdo— y gana lo que necesita para existir en público:
> **emparejamiento de dos cuentas, sincronización real, modo oscuro, accesibilidad completa,
> internacionalización, navegación nativa por pestañas y entrega de cartas dentro de la app**.
>
> El trabajo de diseño consiste en: **(1)** convertir una paleta bonita pero inaccesible en un
> sistema de tokens con contraste verificado en claro y oscuro; **(2)** sustituir dos fuentes
> web frágiles por New York + SF Pro con Dynamic Type hasta AX5; **(3)** cambiar el
> glassmorphism CSS por materiales nativos sin sacrificar legibilidad; **(4)** reemplazar la
> sidebar de 8 entradas por 5 pestañas con una acción de aportar siempre a dos toques;
> **(5)** diseñar de cero el onboarding y el emparejamiento, que es la pantalla que decide si
> un desconocido se queda; y **(6)** hacer que cada toque responda —gesto, movimiento con
> spring, haptic— sin que la app se vuelva ruidosa.
>
> El criterio para cada decisión: **el contenido de la pareja es lo bonito; la interfaz es el
> marco.**
