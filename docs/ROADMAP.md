# Roadmap — Pato

> **Sobre la numeración anterior.** En el repo había referencias sueltas a "Fase 5"
> (título de `docs/DEPLOY.md`) y a una "Fase 7" mencionada de pasada en
> `CHECKLIST_PRODUCCION.md`. No existía Fase 1, 2, 3, 4 ni 6, ni un documento que
> definiera ninguna. Era numeración heredada de conversaciones, sin alcance escrito.
> **Este documento la sustituye.** El título de `DEPLOY.md` se mantiene por no romper
> enlaces, pero "Fase 5" ahí significa "guía de despliegue", no una etapa de este plan.

**Estado de partida (2026-09-02):** el [Plan V2](superpowers/plans/2026-04-29-pato-v2.md)
está completado y en `main`. La app funciona, compila y despliega. Lo que sigue no es
continuación de aquel plan, sino la respuesta a tres problemas estructurales.

---

## Los tres problemas que definen este roadmap

Verificados leyendo el código, no supuestos:

### 1. La app de pareja no comparte nada

Los ocho repositorios de `src/infrastructure/storage/` leen y escriben **solo en
`localStorage`**. No hay sincronización con ningún servidor: el backend es sin estado y
únicamente envía correos y consulta APIs de música.

La consecuencia es que **cada persona ve datos completamente distintos**. Si tú añades
una cita, tu pareja no la ve. Si ella sube una foto, tú no la ves. Cada navegador y cada
dispositivo es un silo separado. Ni siquiera tu propio teléfono y tu portátil comparten
nada entre sí.

Es la limitación que define el producto: una app de pareja donde la pareja no comparte.

### 2. El almacenamiento va a romperse sin avisar

`localStorageMediaRepository.js` guarda así:

```js
function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))   // sin try/catch
}
```

Los vídeos y fotos se guardan como data URLs (base64) dentro de ese JSON. El límite de
`localStorage` es de unos **5 MB por dominio**, y base64 infla los archivos ~33%. Con
dos o tres vídeos cortos se alcanza el techo.

Cuando pase, `setItem` lanzará `QuotaExceededError` **sin que nadie lo capture**: el
guardado falla, la excepción sube sin control y el usuario no recibe ningún mensaje que
explique qué ocurrió. Los datos parecen guardarse y no se guardan.

### 3. Faltan interfaces de repositorio en el dominio

`src/domain/repositories/` solo define tres contratos: `AppStateRepository`,
`LetterRepository` y `MediaRepository`. Las otras cinco entidades (`Cita`, `Playlist`,
`PartnerProfile`, `ActivityEvent`, `SentLetterLog`) tienen implementación en
`infrastructure` pero **ningún contrato en `domain`**.

Hoy no molesta. En cuanto haya una segunda implementación (Supabase junto a
localStorage), esa asimetría se convierte en el punto donde las dos se desincronizan,
porque no hay nada que obligue a que cumplan la misma forma.

---

## Fase 1 — Red de seguridad: tests automatizados

> **COMPLETADA (2026-09-02).** 125 tests en verde, CI en GitHub Actions, y los contratos
> de repositorio rediseñados para validar de verdad. Encontró y corrigió **tres bugs
> reales** que nadie había detectado — detallados al final de esta sección.


**Por qué va primera:** las fases 2 y 3 reescriben la capa de persistencia entera. Sin
tests, cada refactor se hace a ciegas y la única verificación es abrir el navegador y
probar a mano. Es la fase que hace que las siguientes sean seguras en lugar de temerarias.

**Alcance:**
- Vitest + `happy-dom` como entorno.
- Tests unitarios de los use cases. Son funciones puras con dependencias inyectadas
  (`addCita(repo)`), así que se prueban con un repositorio falso, sin navegador.
- Tests de los ocho repositorios de `localStorage` contra un `Storage` simulado,
  incluyendo el caso de cuota agotada.
- Un test del contenedor DI que verifique que toda dependencia queda cableada — habría
  detectado un `container.addActivityEvent` sin registrar.
- GitHub Actions: `npm run build` + `npm test` en cada PR.

**Fuera de alcance:** tests de componentes React y end-to-end. Vendrán cuando la
persistencia esté estable; hacerlos ahora significa reescribirlos en la fase 3.

**Terminada cuando:** `npm test` pasa en CI, cubre los use cases y los repositorios, y
un PR con un fallo introducido a propósito sale en rojo.

### Lo que se entregó

- **125 tests** en `tests/`, repartidos en dominio, aplicación e infraestructura.
- **Rediseño de los contratos de repositorio** (era el problema 3). `defineRepository`
  sustituye a las funciones identidad: ahora cada contrato valida su implementación al
  construirse y nombra los métodos que faltan. Se escribieron los cinco contratos
  ausentes, y las ocho implementaciones de `localStorage` pasan por ellos.
- **Test del contenedor DI** que exige la lista completa de casos de uso y falla tanto si
  falta uno como si sobra sin declarar.
- **CI en GitHub Actions**: tests y build del frontend, y para el backend `npm ci`
  (que detecta un lockfile desincronizado) más un arranque real del servidor contra
  `/api/health`.
- Suite verificada con orden aleatorio (`--sequence.shuffle`) para descartar dependencias
  entre tests.

### Tres bugs encontrados y corregidos

La fase se planteó sin cambios de comportamiento, pero los tests destaparon tres defectos
reales. Codificarlos como "correctos" habría sido peor que no tener tests, así que se
corrigieron:

1. **Los estados personalizados de la relación no se guardaban.** `updateAppState`
   componía `relationshipStatuses: current ?? partial ?? []`, de modo que la clave
   explícita pisaba lo que llegaba en `partial`. Como `getAppState` siembra los estados
   por defecto en el primer arranque, `current` siempre tenía valor: escribir un estado
   nuevo en Configuración y pulsar guardar **no hacía nada**. Ahora manda `partial`.
2. **`getCitas` reordenaba lo almacenado.** Hacía `list.sort(...)` sobre el array que
   devuelve el repositorio, y `sort` muta. Con la caché en memoria añadida en `07bf533`,
   leer las citas reordenaba el almacén durante toda la sesión. Ahora copia antes.
3. **`getPlaylists` tenía el mismo defecto**, por el mismo motivo y con la misma
   corrección. `getActivityEvents` ya lo hacía bien (`[...events].sort(...)`), lo que
   confirma que era un descuido y no una decisión.

**Cambios de comportamiento:** los tres arreglos anteriores. Ninguno más.

---

## Fase 2 — Hacer visible el límite de almacenamiento

**Por qué va antes que Supabase:** el problema 2 rompe **hoy**, y la fase 3 son semanas
de trabajo. Esta fase son horas y evita una pérdida de datos silenciosa mientras tanto.

**Alcance:**
- Capturar `QuotaExceededError` en los repositorios y devolver un error tipado en lugar
  de dejar que la excepción suba sin control.
- Mensaje real en pantalla: qué pasó, cuánto espacio queda, qué puede borrar.
- Indicador de uso en el módulo de Fotos y vídeos ("3,2 MB de ~5 MB").
- Comprimir las imágenes antes de guardarlas (redimensionado por `canvas`, calidad
  ajustable). Reduce el consumo típico un orden de magnitud.
- Rechazar vídeos por encima de un umbral configurable, con el motivo explicado antes de
  intentar guardarlos.

**Terminada cuando:** llenar la cuota a propósito produce un mensaje claro en pantalla y
ningún error sin capturar en consola.

**Cambios de comportamiento:** las fotos nuevas se guardan comprimidas. Las ya guardadas
no se tocan.

---

## Fase 3 — Supabase: que la pareja comparta de verdad

**La fase grande.** Resuelve el problema 1 y elimina de raíz el problema 2. Aquí es
donde la Clean Architecture rinde: se sustituye la capa `infrastructure` y las capas
`domain`, `application` y `presentation` quedan intactas.

### 3.1 — Contratos de repositorio completos

Escribir en `src/domain/repositories/` las cinco interfaces que faltan (problema 3),
antes de tener dos implementaciones que puedan divergir.

### 3.2 — Autenticación y espacio compartido

- Supabase Auth con dos cuentas.
- Tabla `couples` que vincula ambos usuarios en un espacio común.
- Row Level Security: cada consulta ve solo los datos de su pareja. Esto se prueba antes
  de meter datos reales — una regla RLS mal escrita expone los datos de otras parejas.

### 3.3 — Migrar las entidades a Postgres

Un `supabase<Entidad>Repository` por cada uno de los ocho, cumpliendo los mismos
contratos. El contenedor DI elige la implementación: **un solo punto de cambio**.

### 3.4 — Media a Supabase Storage

Las fotos y vídeos dejan de ser data URLs y pasan a ser archivos con URL. Desaparece el
límite de 5 MB y las imágenes dejan de viajar dentro del JSON de estado.

### 3.5 — Migración de los datos existentes

Pantalla única que lee el `localStorage` actual y lo sube al espacio compartido. Sin
esto, activar Supabase equivale a empezar de cero: **hay recuerdos guardados en esos
navegadores.**

**Terminada cuando:** los dos entráis desde teléfonos distintos, veis las mismas citas,
fotos y eventos, y lo que uno añade le aparece al otro al recargar.

**Riesgo principal:** RLS mal configurado. Se mitiga probando las reglas con dos cuentas
de prueba antes de migrar nada real.

---

## Fase 4 — Persistir los tokens de OAuth

**Por qué va después de la 3:** los tokens necesitan una base de datos donde vivir.
Hacerlo antes significa construir un almacenamiento desechable.

**El problema actual:** los tokens de Spotify y YouTube viven en memoria del proceso
Express. Cada reinicio de Render los borra — y el plan gratuito **duerme el servicio
tras un rato de inactividad**. En la práctica hay que reconectar Spotify casi cada vez.

**Alcance:**
- Tabla de tokens en Supabase, cifrados en reposo.
- Refresco automático con el `refresh_token` antes de que caduque el de acceso.
- Estado de conexión real en la interfaz, en lugar de fallar en silencio.

**Terminada cuando:** Spotify sigue conectado después de reiniciar el backend.

---

## Fase 5 — Tiempo real y pulido

Solo tiene sentido con la 3 terminada.

- **Supabase Realtime:** el feed de actividad se actualiza en el teléfono de tu pareja
  en el momento, sin recargar. Es la fase que convierte la app en algo vivo.
- **PWA:** instalable en el móvil, con caché offline de lo ya cargado.
- **Tests end-to-end** (Playwright) de los recorridos principales.
- **Accesibilidad:** contraste, foco visible, navegación por teclado.

---

## Orden y dependencias

```
Fase 1 (tests) ─────────► habilita 2 y 3 con seguridad
     │
Fase 2 (cuota) ─────────► independiente; arregla un fallo activo
     │
Fase 3 (Supabase) ──────► requiere 1; deja obsoleta la 2
     │                    (el límite deja de existir, pero la
     │                     compresión sigue siendo útil)
     ├──► Fase 4 (tokens OAuth) — requiere la base de datos de la 3
     └──► Fase 5 (tiempo real)  — requiere la 3
```

**Recomendación:** hacer la 1 y la 2 seguidas. Juntas son poco trabajo y dejan el
proyecto en condiciones de afrontar la 3, que es la que cambia el producto de verdad.

---

## Rediseño visual (fuera de las fases numeradas)

Trabajo hecho a petición directa, no parte de las cinco fases. Dos pasadas:

**Primera** — el rango de valor. La paleta ocupaba una banda de luminosidad estrecha y
nada se separaba de nada. Escala de profundidad en tres niveles, superficies de vidrio
con más blanco y borde propio, `pato-line` para reglas que aguanten sobre todo el
degradado, `ActionButton` y `Field` compartidos, y el padding duplicado entre Layout y
páginas (~190px muertos al pie de cada pantalla) reducido a 16px.

**Segunda** — la consistencia del sistema. Seis módulos resolvían el estado vacío de seis
formas distintas; ahora hay un `EmptyState` común. El formulario de Playlists flotaba
suelto mientras el resto agrupaba sus controles en tarjetas. Y `citas` y `cartas`
compartían icono en el menú (`DuckLetters` para ambos, heredado del merge de la V2), así
que dos entradas se veían iguales: Citas tiene ahora el suyo.

**Pendiente si se retoma:** jerarquía tipográfica entre módulos, y el `NowPlayingWidget`,
que no se ha revisado.

---

## Qué NO está en este roadmap y por qué

- **Reescribir en Next.js o cambiar de framework.** No resuelve ninguno de los tres
  problemas. Vite y React 18 no son la limitación.
- **Rediseño visual.** El glassmorphism es reciente y está bien resuelto.
- **Más módulos o funcionalidades nuevas.** Añadir funciones sobre una base donde la
  pareja no comparte datos multiplica el problema en vez de resolverlo.

Cuando la fase 3 esté terminada, esta última decisión se puede revisar: con datos
compartidos de verdad, funciones nuevas sí aportan.
