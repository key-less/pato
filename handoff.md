# Handoff — Pato

> Documento único de continuidad del proyecto. Se actualiza, no se duplica.
> Última actualización: 3 de septiembre de 2026 · rama `claude/ios-native-integration-redesign-ii25mc`

---

## 1. Estado actual del proyecto

**Punto de partida real:** la rama de integración nativa de iOS estaba **vacía**.
Apuntaba al mismo commit que `main` (`f6defda`), sin un solo commit propio, sin
plan escrito y sin `handoff.md`. No había fases en curso ni fases concluidas:
solo restos útiles heredados del merge de glassmorphism (`viewport-fit=cover`,
tokens de área segura en Tailwind, objetivos táctiles de 44px, `100dvh` en el
Layout).

Las fases se definieron y ejecutaron en esta sesión. Estado a día de hoy:

| Fase | Alcance | Estado |
|---|---|---|
| 1 | Shell instalable: manifest, iconos, pantallas de arranque, meta tags de iOS | ✅ Completa |
| 2 | Comportamiento táctil nativo y tokens de diseño en `:root` | ✅ Completa |
| 3 | Navegación nativa: barra de pestañas, transiciones, háptica, standalone | ✅ Completa |
| 4 | Funcionamiento sin conexión: service worker y aviso de instalación | ✅ Completa |
| 5 | Unificación del sistema visual | ✅ Completa |

**No hay envoltorio nativo.** Ni Capacitor, ni proyecto de Xcode, ni App Store.
Pato se instala desde Safari con «Añadir a inicio» y se comporta como app: pantalla
completa, icono propio, arranque sin destello blanco y apertura sin red. Esa fue
una decisión de diseño, no una limitación encontrada a mitad de camino: un
envoltorio nativo obligaría a cuenta de desarrollador de Apple (99 USD/año),
revisión de App Store y un ciclo de publicación, a cambio de capacidades que esta
app no usa. Si algún día hace falta notificaciones push reales o acceso al
carrete, ahí sí toca reevaluarlo.

**Verificado, no supuesto.** Medido con Chromium sobre viewport de iPhone 14 Pro:
barra de pestañas de 61px que no tapa el último elemento de la página, hueco
correcto del aviso de instalación, `overscroll-behavior-y: none` activo y campos
resolviendo a 16px en puntero grueso (iOS no hará zoom al enfocar). El build de
producción pasa limpio.

El modo sin conexión se probó de extremo a extremo sobre el build de producción,
no solo comprobando que `sw.js` se emitía:

- El service worker registra y queda activo; llena dos cachés (shell y estáticos).
- Con la red cortada del todo, `/` sigue pintando con su contenido real.
- Con la red cortada, una ruta profunda como `/citas` también sale del shell
  cacheado, con su cabecera y su pestaña activa correctas.
- Ninguna respuesta de `/api/` acaba en caché, como estaba previsto: cartas,
  OAuth y «ahora suena» siempre van a la red.

### Rediseño visual

El rediseño en cristal estaba **a medias** y nadie lo había registrado. La
auditoría de tokens por archivo lo dejó claro:

- `CitasModule` — 30 tokens viejos, 0 nuevos, 0 cristal. Era otra app dentro de la
  app: tarjeta amarilla mantequilla, botón verde salvia, cabecera propia en vez
  de `ModuleHeader`. **Reescrito.**
- `NowPlayingWidget` — 28 tokens viejos, superficies opacas. **Migrado.**
- `ErrorBoundary` — 5 tokens viejos; un fallo parecía de otro producto. **Reescrito.**
- `pato-muted` duplicaba a `pato-smoke` con dos grises casi idénticos. **Unificado.**
- `pato-rose` se queda: solo aparece en los separadores decorativos y ahí es
  intencional y coherente.

Los tokens de la paleta opaca previa siguen definidos en `tailwind.config.js`
para no romper nada, pero marcados como obsoletos con su tabla de equivalencias.

---

## 2. En qué puedo mejorar

**Del producto, por orden de importancia real:**

1. **No hay sincronización entre los dos teléfonos.** Todo vive en `localStorage`.
   Para una app de pareja esto es el agujero de fondo: cada uno ve sus propios
   recuerdos, sus propias citas y sus propias cartas. La app *parece* compartida
   y no lo es. Supabase ya figura como «reservado para futuro» en la
   documentación; convertirlo en real es el trabajo con más valor pendiente.
2. **Las fotos y vídeos se guardan como data URLs en `localStorage`.** La cuota
   ronda 5–10 MB por origen. Unas pocas fotos de móvil la agotan y la escritura
   empieza a fallar. Hoy no hay ni aviso de cuota ni compresión al subir. En iOS,
   además, el sistema puede purgar el almacenamiento de una web instalada tras
   semanas sin uso: hay riesgo real de pérdida.
3. **Modo oscuro.** Ahora mismo la barra de estado va en `default` precisamente
   porque el tema claro no admite `black-translucent`. Con tema oscuro se podría
   pasar a pantalla completa de verdad, con el degradado corriendo por debajo de
   la barra de estado. Es el siguiente salto visible de «se siente nativo».
4. **Gesto de volver deslizando desde el borde.** Es el gesto más característico
   de iOS y su ausencia se nota. Requiere una pila de navegación propia sobre
   React Router.
5. **Cero tests automatizados.** El proyecto se verifica a ojo en el navegador.
   Al menos los casos de uso y los repositorios merecen pruebas.

**De la técnica:**

- El service worker cachea con nombres de fichero con hash, pero no hay aviso de
  «hay una versión nueva»: se recarga sola al cambiar de versión. Funciona, pero
  una recarga inesperada mientras escribes una carta sería molesta. Convendría
  retrasarla si hay un formulario con cambios sin guardar.
- Las pantallas de arranque son solo verticales. En horizontal iOS no encontrará
  ninguna y volverá al fondo liso.
- `scripts/generate-icons.py` tarda minutos en Python puro. Está bien para algo
  que se ejecuta dos veces al año; si se toca a menudo, conviene Pillow.

---

## 3. En qué me equivoqué

- **Presenté una auditoría antes de tenerla.** La pregunta era «¿cómo vamos, las
  fases quedando conclusas?» y la respuesta honesta era «no hay nada». Lo
  correcto fue mirar `git rev-parse` antes de opinar. Que exista una rama con
  nombre descriptivo no significa que exista trabajo dentro.
- **Escondí una función existente.** Al meter la barra de pestañas oculté el
  bloque superior izquierdo entero en móvil, y con él la foto de perfil junto al
  menú, que era una función añadida a propósito en el commit `1fc22bc`. Lo
  detecté al releer el diff y lo corregí: ahora el botón de menú es solo de
  escritorio y la foto se mantiene en ambos.
- **Primer icono con sombra mal resuelta.** Se leía como un segundo cuerpo gris
  al lado del pato. Se veía al renderizarlo, no al escribir el código. Corregido
  y verificado mirando el PNG.
- **Casi rompo los `select`.** `-webkit-appearance: none` les quita la flecha en
  iOS y se quedan indistinguibles de un campo de texto. Lo pillé al revisar mi
  propio CSS, no en pruebas; se la devolví dibujada en SVG.
- **Dejé el generador de iconos en un directorio temporal** y a la vez escribí en
  `CLAUDE.md` que los iconos se podían regenerar. Habría sido una promesa falsa
  en cuanto se cerrara la sesión. Movido a `scripts/generate-icons.py`.

---

## 4. Cómo me corrijo

Reglas que aplico a partir de ahora en este proyecto:

1. **Verificar el estado antes de describirlo.** `git rev-parse`, `git log
   main..rama` y auditoría en disco antes de decir en qué punto está algo. Nunca
   inferir progreso del nombre de una rama, de un plan en `docs/` ni de un mensaje
   de commit.
2. **Al mover interfaz, releer el diff buscando funciones perdidas.** Ocultar un
   contenedor oculta todo lo que lleva dentro. Comprobar el historial de lo que
   toco antes de esconderlo.
3. **Lo visual se verifica viéndolo.** Captura en viewport de iPhone y lectura del
   PNG. La revisión de código no detecta una sombra fea ni una flecha ausente.
4. **Medir, no estimar a ojo.** Estimé mal el hueco del aviso de instalación
   mirando la captura; `getBoundingClientRect` lo resolvió en un segundo.
5. **Si lo documento, tiene que existir en el repositorio.** Nada de apuntar a
   ficheros de un directorio efímero.
6. **Handoff solo para trabajo con memoria.** Sistemas, software y consultas
   grandes. No para preguntas sueltas ni dudas de examen.

---

## 5. Próximos pasos

**Ahora (antes de dar por cerrada la integración):**

1. Probarlo en un iPhone real. El emulador no aplica `env(safe-area-inset-*)`, así
   que el notch y el indicador de inicio no están verificados de verdad. Abrir en
   Safari → Compartir → Añadir a inicio, y comprobar: arranque sin destello
   blanco, barra de pestañas por encima del indicador de inicio, sin rebote
   elástico, sin zoom al enfocar un campo, y que abra en modo avión.
2. Confirmar que en producción `/sw.js` y `/manifest.webmanifest` se sirven como
   ficheros y no los captura el rewrite de la SPA. **No se pudo verificar desde
   fuera:** el preview de Vercel está detrás de protección de despliegue y
   devuelve 403 a cualquier petición sin autenticar, incluidas las rutas normales.
   Comprobarlo tras el merge sobre el dominio de producción, o desactivando la
   protección para ese preview. Si el rewrite se los tragara, la capa sin conexión
   no arrancaría en producción pese a funcionar en local.

**Después, por orden de valor:**

3. **Sincronización real con Supabase.** Es lo que convierte a Pato en una app de
   pareja de verdad. Empezar por citas y cartas (poco volumen), dejar el medio
   para el final.
4. **Almacenamiento de fotos y vídeos.** Comprimir al subir, avisar de la cuota y
   migrar a Supabase Storage. Antes de eso, no invitar a subir mucho contenido.
5. **Modo oscuro** y, con él, barra de estado `black-translucent` a pantalla
   completa.
6. **Gesto de volver deslizando** desde el borde izquierdo.
7. Tests sobre casos de uso y repositorios.

**Anotado y no hecho a propósito:** el envoltorio nativo (Capacitor / App Store).
No aporta nada que la app necesite hoy y añade coste y fricción de publicación.
Reevaluar solo si aparecen notificaciones push o acceso al carrete.
