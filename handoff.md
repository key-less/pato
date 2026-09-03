# Handoff — Pato

> Documento único de continuidad del proyecto. Se actualiza, no se duplica.

**Última actualización:** 2026-09-02 (Fase 1 completada)
**Rama de trabajo:** `claude/continuacion-trabajo-anterior-8n98jy`

---

## 1. Estado actual del proyecto

App de pareja (React 18 + Vite + Tailwind, Clean Architecture, `localStorage` como
persistencia) con backend Express en `server/`.

**Completado y verificado:**

| Bloque | Estado |
|---|---|
| Clean Architecture (domain / application / infrastructure / presentation) | Estable |
| Módulos: Citas, Cartas, Media, Playlists, Perfil, Ajustes, Historial | Funcionando |
| Feed de actividad (`ActivityEvent` + 7 módulos instrumentados) | Completo y cableado en el DI |
| Rediseño glassmorphism (Cormorant + Geist, patos SVG, GlassPanel) | Aplicado |
| Endurecimiento del API (helmet, CORS, API key, rate limit, sanitización) | Aplicado y **probado end-to-end** |
| Despliegue: Vercel (frontend) + Render (backend) | Configurado; deuda de plataforma ya limpiada |
| `npm run build` | Pasa — 98 módulos, ~53 kB gzip de vendor |
| `npm ci` en `server/` | Pasa (antes fallaba, ver abajo) |

El plan V2 (`docs/superpowers/plans/2026-04-29-pato-v2.md`) está **implementado al
completo** aunque sus casillas sigan sin marcar: los archivos, rutas, use cases y el
registro en el contenedor DI existen y compilan.

---

## 2. En qué me equivoqué (defectos que dejó el merge anterior)

El merge `f6defda` integró tres líneas de trabajo con seis resoluciones de conflicto
manuales y **nadie verificó el resultado**. Compilaba, pero llevaba siete defectos.
Los tres primeros habrían roto producción:

1. **`server/package-lock.json` desincronizado.** El endurecimiento añadió `helmet` a
   `package.json` pero no al lockfile. `npm ci` fallaba con
   `Missing: helmet@8.3.0 from lock file` — **el backend no habría desplegado en Render**.
   Reproducido y corregido.
2. **CORS con un solo origen.** `FRONTEND_URL` se leía como string único, así que
   cualquier deploy preview de Vercel (URL distinta por rama) quedaba bloqueado. Y si
   la variable faltaba en Render, el valor por defecto era `localhost:5173`: producción
   entera sin API.
3. **Rechazo de CORS devolvía HTTP 500.** En los logs de Render un origen no permitido
   parecía una caída del servidor, no una decisión de seguridad.
4. **`sendEmailApi` y `playlistApi` tenían copias divergentes** de la resolución de
   `API_BASE`: solo `playlistApi` normalizaba el protocolo. Con
   `VITE_API_URL=api.dominio.com` (sin `https://`) las playlists funcionaban y las
   cartas fallaban.
5. **Rate limits documentados ≠ implementados.** `CLAUDE.md` decía 120/10 por minuto;
   el código tenía 30/5. Con el widget "Ahora suena" sondeando cada 15 s por servicio y
   dos personas tras la misma IP pública, 30/min se agotaba solo.
6. **Task 12 a medias.** Se borraron `netlify.toml` y `railway.toml`, pero quedaron
   referencias a Netlify/Railway en `server/index.js`, `playlistApi.js`, ambos
   `.env.example`, `CLAUDE.md` y `README.md`. Y `wrangler.jsonc` (Cloudflare Pages)
   seguía en el repo contradiciendo la decisión de usar Vercel.
7. **`VITE_API_SECRET` documentado como si fuera autenticación.** Vite lo incrusta en
   el bundle: es público. Los `.env.example` no lo advertían.

**Lección aplicada:** después de un merge con conflictos resueltos a mano, verificar el
resultado (`npm run build`, `npm ci`, arrancar el servidor y probar los endpoints) es
parte del merge, no un paso opcional posterior.

### Error cometido en esta sesión (y corregido)

Borré `wrangler.jsonc` por coherencia con la decisión de usar Vercel. El CI del PR lo
rechazó: la **integración de Cloudflare Workers sigue conectada al repositorio** y
ejecuta el check `Workers Builds: pato` en cada PR. Borrar el archivo no desconecta la
integración — solo hace que su build falle al no encontrar configuración.

Archivo restaurado, con la razón escrita dentro para que nadie lo vuelva a borrar sin
saberlo. **Para retirar Cloudflare de verdad:** desconectar primero la integración en el
dashboard de Cloudflare y después borrar el archivo. Requiere acceso al dashboard.

**Lección:** el repositorio no es la única fuente de verdad del despliegue. Antes de
borrar un archivo de configuración de plataforma, comprobar si esa plataforma sigue
conectada y ejecutando checks.

---

## 3. Qué se corrigió en esta sesión

- **`src/infrastructure/api/apiConfig.js` (nuevo)** — fuente única de `API_BASE` y de
  las cabeceras. `playlistApi` y `sendEmailApi` ahora importan de aquí y no pueden
  divergir. Normaliza el protocolo y las barras finales.
- **CORS multi-origen** — `FRONTEND_URL` acepta lista separada por comas, normaliza
  barras finales, deja pasar peticiones sin `Origin` (healthcheck de Render, curl,
  callbacks de OAuth) y registra en log el origen rechazado con la lista permitida.
- **`primaryFrontendUrl`** — los tres redirects de OAuth usan el primer origen de la
  lista; con la variable cruda habrían construido una URL inválida al pasar a lista.
- **Manejador de error de CORS** → 403 JSON en vez de 500.
- **Rate limits a 120/min y 10/min**, alineados con la documentación y con el uso real.
- **Lockfile del servidor regenerado** con `helmet`.
- **Deuda de plataforma eliminada**: cero referencias a Netlify/Railway en código y
  documentación. `wrangler.jsonc` se conserva a propósito (ver abajo).
- **Documentación honesta sobre `VITE_API_SECRET`** en ambos `.env.example` y en
  `CLAUDE.md`: filtra bots, no es autenticación.
- **`docs/CHECKLIST_PRODUCCION.md`**: nueva sección de diagnóstico de CORS (403 vs 401).

**Verificación ejecutada** (servidor real en un puerto de pruebas):

| Caso | Resultado |
|---|---|
| Healthcheck sin `Origin` | 200 |
| Origen permitido | 200 + `Access-Control-Allow-Origin` correcto |
| Preview con barra final en la variable | 200 (normalizado) |
| Origen no permitido | 403 `Origen no permitido.` |
| `/api/*` sin `x-api-key` | 401 |
| `/api/*` con `x-api-key` correcta | 200 |
| Callback de OAuth (exento de API key) | 302 |
| Ruta `/api/*` inexistente | 404 JSON |
| `npm run build` / `npm ci` en `server/` | Ambos limpios |

---

## 4. Próximos pasos

**Antes de desplegar (bloqueante):**
1. En Render, poner `FRONTEND_URL` con el dominio de Vercel; si usas previews, añadirlos
   separados por coma. Redeploy.
2. Si defines `API_SECRET` en Render, define el mismo valor como `VITE_API_SECRET` en
   Vercel y **vuelve a desplegar el frontend** (Vite lo incrusta en el build).
3. Comprobar `https://tu-api.onrender.com/api/health` → `{"ok":true}`.
4. **Decidir qué hacer con Cloudflare Workers.** Sigue conectado al repositorio y
   ejecuta un check en cada PR, aunque el frontend se sirva desde Vercel. Si no lo usas,
   desconéctalo en el dashboard de Cloudflare y borra `wrangler.jsonc`; mientras siga
   conectado, el archivo debe quedarse o todos los PR saldrán en rojo.

**Plan de trabajo:** las fases y la dirección visual salen de los artefactos del
proyecto, no de una numeración propia — ver **[docs/ROADMAP.md](docs/ROADMAP.md)**.

| Fase | Qué resuelve |
|---|---|
| 0 — Frenar la pérdida | Escrituras que fallan en silencio, media a IndexedDB |
| 1 — Hacerlo compartido | Supabase: que la pareja comparta datos de verdad |
| 2 — Envolver para iOS | Capacitor |
| 3 — Que se sienta nativa | Widget, push, Face ID |
| 4 — Cerrar la deuda | Tests (hecho), contratos (hecho), TypeScript |

**Error corregido:** una versión anterior del roadmap declaró huérfana la numeración de
fases mirando solo el repositorio, sin saber que el plan existía en los artefactos, y
creó cinco fases distintas. También reforzó el glassmorphism justo cuando «Aguas
tranquilas» pedía quitarlo. Ambas cosas están revertidas y alineadas.

**Los tres problemas estructurales** que justifican ese orden (verificados en el código,
detallados en el roadmap):

1. **Nada se comparte.** Los ocho repositorios escriben solo en `localStorage` y no hay
   sincronización con ningún servidor. Cada navegador y cada dispositivo es un silo
   separado: en una app de pareja, la pareja no comparte. Ni siquiera el teléfono y el
   portátil de la misma persona.
2. **El almacenamiento rompe sin avisar.** `localStorageMediaRepository.save()` no tiene
   `try/catch`; al agotar los ~5 MB de cuota, `setItem` lanza `QuotaExceededError` sin
   que nadie lo capture. Los datos parecen guardarse y no se guardan.
3. ~~**Faltan contratos de repositorio.**~~ **RESUELTO en la Fase 1.** Los ocho contratos
   existen y validan de verdad: `defineRepository` comprueba la implementación al
   construirla y nombra los métodos que faltan. Las ocho implementaciones de
   `localStorage` pasan por su contrato, igual que los repositorios falsos de los tests.

### Fase 1 — lo hecho (2026-09-02)

125 tests con Vitest + happy-dom, CI en GitHub Actions (frontend: tests y build; backend:
`npm ci` y arranque real contra `/api/health`), y el rediseño de los contratos de
repositorio. Suite verificada con orden aleatorio.

**Encontró tres bugs reales que nadie había visto**, todos corregidos:

1. **Los estados personalizados de la relación no se guardaban nunca.** En
   `updateAppState`, la clave explícita `relationshipStatuses: current ?? partial ?? []`
   pisaba el valor de `partial`. Escribir un estado nuevo en Configuración y guardar no
   hacía nada. Es una funcionalidad documentada en el README que llevaba rota sin que
   nadie lo notara.
2. **`getCitas` reordenaba el almacén al leerlo** (`sort` muta y el repositorio devuelve
   su array interno). Con la caché en memoria, el efecto duraba toda la sesión.
3. **`getPlaylists`, idéntico.**

**Nota metodológica:** la fase estaba planteada sin cambios de comportamiento, pero
escribir tests que dieran por buenos esos tres defectos habría sido peor que no
escribirlos. Se corrigieron y quedan documentados aquí y en el roadmap.

**Menor:** `caniuse-lite` desactualizado (7 meses) — `npx update-browserslist-db@latest`.

**Estado del Plan V2:** marcado como completado y verificado contra el código. Quedan
6 casillas de verificación manual en navegador sin marcar **a propósito**: requieren una
persona delante y nadie las ha ejecutado. El código compila; el comportamiento en
pantalla no está comprobado.

---

## 5. Notas de arquitectura para quien siga

- Las páginas importan **solo** desde `container` (`src/infrastructure/di/container.js`),
  nunca de repositorios ni use cases directos. Mantener esa regla.
- Cada acción relevante emite un `ActivityEvent` vía `container.addActivityEvent`. Si se
  añade un módulo nuevo con acciones, instrumentarlo también o el feed quedará incompleto.
- El backend es **sin estado** salvo por los tokens de OAuth en memoria.
- Toda petición al API pasa por `apiConfig.js`. Si hace falta un cliente nuevo, importar
  de ahí en lugar de reimplementar la resolución de URL.
