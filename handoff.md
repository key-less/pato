# Project Handoff — Pato

Última actualización: 2026-09-02

## Current State

**Fase 0 completada y verificada.** La app dejó de perder datos.

- Toda escritura pasa por `localStorageDriver`, que distingue cupo agotado de otros
  fallos, lanza, y avisa por `storageAlerts`
- `StorageAlert` (en `Layout`) muestra el fallo aunque la pantalla no lo capture.
  Ya no aparece «✓ Guardado» sobre una escritura que no ocurrió
- Álbum en IndexedDB con metadatos y binarios en stores separados; migración
  automática e idempotente desde el `pato-media` antiguo
- Copia de seguridad exportable e importable desde Configuración

**Fase 1 escrita, sin ejecutar contra una base real.** Ver la advertencia de abajo.

- `supabase/migrations/` — esquema, RLS y emparejamiento
- `supabase/tests/rls_aislamiento.sql` — la prueba que decide si esto puede tocar
  datos reales
- `src/infrastructure/supabase/` — los ocho puertos implementados contra Supabase,
  con la misma interfaz que los locales
- Sesión (Apple / magic link), creación de pareja, invitación y borrado de cuenta
- El contenedor elige backend según haya o no `VITE_SUPABASE_URL`

**Rediseño «Aguas tranquilas»: aplicado.**

- Tipografía de cuatro familias a dos: Fraunces (lo que emociona) y Karla (lo que se usa)
- `GlassPanel` eliminado; `Panel` (papel mate) es la superficie de toda la app
- Vidrio esmerilado solo en `NowPlayingWidget`, que es lo único que flota de verdad
  sobre el contenido. El scrim del sidebar conserva su desenfoque: es un solo
  elemento y ahí el desenfoque hace su trabajo
- El ancla de texto pasa a `pato-agua` (#1f3a3d): la única nota fría de la paleta,
  y lo que hace que los cálidos se lean cálidos
- Ondas en vez de spinners; el estado de la relación como dos patos en el agua

**«Señales en el agua»: dos de las cuatro construidas.**

- **Cartas con fecha.** Una carta puede quedar sellada hasta un día. El sellado se
  impone en la base (`0004_cartas_con_fecha.sql`), no en la interfaz: la política de
  lectura excluye la carta sellada que escribió la otra persona, así que no se puede
  adelantar abriendo las herramientas del navegador. Lo que sí llega es que existe y
  para cuándo, por `cartas_selladas()`, para no perder la espera.
- **La onda compartida.** Cuando los dos tienen la app abierta a la vez, en las dos
  pantallas nace la misma onda. Usa Presence de Realtime, que es efímero: no se
  guarda una fila ni queda registro de cuándo estuvo conectado cada uno.

Pendientes de la misma dirección: los toques con foto y animación firmada (necesitan
push, Fase 2) y la distancia con su widget (Fase 3).

77 tests con Vitest; `npm test`.

## ⚠️ Lo que NO está verificado

**El SQL nunca se ejecutó.** En esta máquina no hay Docker, ni CLI de Supabase, ni
psql. El esquema, las políticas RLS y las funciones de emparejamiento están escritos
y revisados, pero no probados contra un Postgres real.

Antes de mover un solo dato:

```bash
supabase start
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
  -f supabase/tests/rls_aislamiento.sql
```

Ese script comprueba lo que de verdad importa: que una tercera persona no pueda leer
ni escribir en el espacio de otra pareja, que el token de invitación sea de un solo
uso, que no entre un tercer miembro, y que borrar tu cuenta no borre los recuerdos de
quien se queda. Si algo ahí falla, la Fase 1 no está lista.

Tampoco están probados contra un proyecto real los adaptadores de
`src/infrastructure/supabase/`: sus tests cubren el mapeo entre Postgres y el
dominio, no las llamadas de red.

De lo nuevo, queda sin verificar: las políticas de `0004_cartas_con_fecha.sql` (mismo
motivo — no hay Postgres aquí) y la suscripción de Presence, que necesita el proyecto
de Supabase y dos sesiones a la vez. Lo que sí está verificado es la parte visual de
la onda y los tres estados de las cartas en el navegador.

## Failures & Root Causes

**El álbum reventaba en la segunda foto.** `readAsDataURL` metía cada archivo en
`localStorage` como base64, contra un cupo de ~5 MB en Safari. Causa raíz: se eligió
el almacenamiento más simple sin contar el peso de los binarios.

**Un guardado fallido no avisaba a nadie.** Ningún `setItem` estaba en `try`, y los
repositorios con caché la actualizaban *antes* de escribir. Causa raíz: el orden
memoria-antes-que-disco es cómodo de escribir y falla en silencio.

**Los estados personalizados nunca se guardaban.** En `updateAppState`, una guarda
defensiva pisaba el valor que llegaba en el parcial. Causa raíz: se puso sin
comprobar que el valor por defecto ya estaba garantizado aguas arriba.

**Las fechas del álbum se mostraban un día antes.** `new Date('2023-11-14')` se
parsea como UTC. Causa raíz: la misma función copiada en dos sitios y arreglada en
uno solo.

**Los patos se atravesaban al mirarse.** La primera escala de separaciones bajaba a
20 unidades, y un pato ocupa de x−26 a x+27: los picos se cruzaban. Causa raíz:
elegir las distancias por sensación sin medir el ancho del dibujo. Hay dos tests que
ahora fijan la restricción.

**Las ondas se enredaban en «Estamos casados».** Las dos propias y la común se
dibujaban a la vez y se superponían en un nudo. El propio plan decía «una sola onda
para los dos» y el código no lo cumplía: ahora las propias se apagan conforme crece
la común. Causa raíz: implementar la geometría sin releer lo que la dirección
prometía.

**Editar una carta le cambiaba la fecha de creación.** `saveLetter` pasaba
`createdAt: undefined` al editar, y `createLetter` lo rellenaba con la de ahora: así
que corregir una falta movía la carta al principio de la lista y perdía el día en que
se escribió. Ahora el caso de uso conserva la original. Causa raíz: un `undefined`
usado como «no lo cambies» contra una entidad que lo interpreta como «ponle uno».

**La copia de seguridad iba a exportar cartas vacías.** Una carta sellada por la
pareja llega como marcador sin contenido, y `exportBackup` lo habría guardado como
una carta de verdad; al restaurar habrían aparecido cartas vacías. Se excluyen.
Causa raíz: añadir un tipo de fila nueva sin repasar quién más lee esa colección.

**Un reemplazo masivo dejó un nombre mintiendo.** Al renombrar `glassStyle` a
`estiloPapel` en bloque, la definición local de `LandingPage` quedó llamándose papel
con valores de vidrio. Causa raíz: renombrar sin revisar dónde estaba *definido* lo
que se renombraba, no solo dónde se usaba.

## Improvements Identified

- **Tokens de Spotify globales del servidor** (`server/index.js:314`, `:508`): se
  pierden al reiniciar y son comunes a todos los visitantes
- **`VITE_API_SECRET` no es un secreto**: Vite lo inlinea en el bundle. Se retira
  cuando el JWT de Supabase sea la autenticación real
- **Cero TypeScript** pese a que el estándar del workspace pide strict mode
- **Sin ESLint ni Prettier**
- El sidebar no bloquea el scroll de fondo, no atrapa el foco ni cierra con Escape
- `datesCount` en `AppState` está muerto; la portada usa `citas.length`
- `fechaNacimiento` del perfil se guarda y no alimenta ningún recordatorio
- La papelera de 30 días del plan de rediseño no está: hace falta `deleted_at` en las
  tablas y filtro en los repositorios

## Resolutions Applied

| Problema | Solución | Verificación |
|---|---|---|
| Escrituras que fallan en silencio | `localStorageDriver` lanza y emite por `storageAlerts` | 8 tests + navegador con `setItem` forzado a fallar |
| Caché desincronizada del disco | Los repositorios construyen un array nuevo, escriben, y solo entonces actualizan la caché | Los repos ya no mutan el array cacheado |
| Fotos en `localStorage` | IndexedDB con `ArrayBuffer` + `mimeType`, metadatos y binarios en stores separados | 17 tests + migración verificada en navegador |
| Cuadrícula cargando originales | `getAll()` devuelve solo metadatos y miniatura; el original se pide por id | Confirmado en navegador |
| Sin copia de seguridad | `exportBackup` / `importBackup` + `BackupPanel` | 12 tests + export real capturado (1 451 B, 8 secciones) |
| Estados personalizados perdidos | Orden invertido en `updateAppState.js:11` | Test de regresión, rojo antes y verde después |
| Fechas corridas un día | `new Date(\`${iso}T00:00\`)` en `MediaModule` | Verificado en navegador |
| Nada compartido entre los dos | Esquema con `couple_id`, RLS con `using` **y** `with check`, Storage privado | **Sin verificar** — ver la advertencia de arriba |
| El estado era una píldora de texto | `Estanque`: dos patos y la distancia entre ellos | 9 tests + geometría medida en navegador (8 px de holgura en el estado más cercano) |
| Las cartas no podían esperar a una fecha | `unlocksAt` + políticas por comando + `cartas_selladas()` | 16 tests + los tres estados vistos en navegador; las políticas **sin verificar** |
| No se notaba si el otro estaba ahí | Presence de Realtime, sin guardar nada | Onda verificada en navegador; la suscripción **sin verificar** |

### Decisiones de diseño que conviene recordar

**Por qué `ArrayBuffer` y no `Blob` en IndexedDB.** El clon estructurado lo mueve sin
sorpresas en cualquier entorno; con `Blob` hay diferencias entre implementaciones. El
`Blob` se reconstruye al leer.

**Por qué dos object stores.** Con todo junto, `getAll()` traería cada video entero a
memoria en cada recarga del álbum.

**Invariante del álbum local:** el binario de un id nunca se reemplaza — editar solo
toca metadatos — así que cada object URL se crea una vez y se revoca únicamente al
borrar. `save()` fusiona con el registro existente dentro de la misma transacción;
sin eso, editar la fecha de una foto borraba su miniatura.

**Por qué crear pareja y unirse son funciones y no inserts.** En ese instante el
usuario todavía no es miembro, así que su propia política RLS lo rechazaría. Van por
`security definer` con `set search_path = ''`.

**Por qué el couple_id se resuelve perezosamente.** No se conoce hasta después del
login, pero las páginas importan el contenedor al arrancar. `coupleContext` lo cachea
y lo invalida al cambiar de sesión. RLS no depende de ese valor: aunque llegara uno
equivocado, la base seguiría negando las filas.

## Siguiente paso

1. Crear el proyecto de Supabase y correr las migraciones
2. **Correr `supabase/tests/rls_aislamiento.sql` y no seguir hasta que pase entero**
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Migrar los datos locales con la copia de seguridad de la Fase 0 como red
5. Retirar `VITE_API_SECRET` y los tokens globales del servidor
6. Terminar el rediseño: tipografías y superficies restantes
