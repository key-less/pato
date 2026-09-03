# Roadmap — Pato

> **Este documento sigue el plan de los artefactos de dirección**, no una numeración
> propia. Las fases y su alcance vienen de **«Ruta de Pato a iOS»**; la dirección visual,
> de **«Aguas tranquilas»**; las funciones de pareja, de **«Señales en el agua»**.
>
> **Corrección:** una versión anterior de este archivo afirmaba que la numeración de
> fases del repositorio «no era un plan» e inventaba cinco fases distintas. Era falso:
> el plan existía en los artefactos, y esa numeración propia creaba un segundo
> significado para «Fase 1», «Fase 2» y «Fase 3». Se retira.

**Última revisión:** 2026-09-02

---

## Las cinco fases

Cada una deja la app en un estado usable y ninguna depende de que exista la siguiente.

### Fase 0 — Frenar la pérdida · 2–3 días

No es arquitectura: es dejar de perder recuerdos mientras se construye lo demás.

- [ ] Envolver cada escritura en `try/catch` y propagar el fallo hasta la interfaz. Que un
      guardado que no ocurrió nunca vuelva a mostrar «✓ Guardado».
- [ ] Exportar e importar en Configuración: un JSON descargable con todo. Seguro barato
      mientras no haya backend, y útil también después.
- [x] **Arreglar `updateAppState`.** Hecho — los estados personalizados de la relación
      nunca llegaban a guardarse porque la clave explícita pisaba lo que venía en
      `partial`. Lo destaparon los tests (ver Fase 4).
- [ ] **Mover el media a IndexedDB como Blob**, no como data URL, y renderizar con
      `URL.createObjectURL`. Sube el techo de ~5 MB a cientos y las fotos dejan de vivir
      en memoria como cadenas base64. Se escribe `indexedDbMediaRepository.js` con la
      misma interfaz y se cambia una línea del contenedor.

### Fase 1 — Hacerlo compartido · 1–2 semanas

La fase que convierte a Pato en lo que dice ser. Hoy los ocho repositorios escriben solo
en `localStorage`: **cada persona ve datos distintos, y ni siquiera el teléfono y el
portátil de la misma persona comparten nada.**

- [ ] Modelo en Supabase: `couples`, `couple_members`, y `couple_id` en cada tabla. Una
      sola política RLS hace imposible ver los recuerdos de otra pareja desde la base de
      datos, no desde el código.
- [ ] Fotos y vídeos a Supabase Storage, bucket privado con URLs firmadas. Miniatura
      generada en el cliente antes de subir.
- [ ] Realtime en citas, fotos y cartas.
- [ ] Tokens de Spotify a `couple_members`, cifrados y por usuario. Elimina las globales
      del servidor, que hoy se pierden en cada reinicio de Render.

El cambio en el frontend es pequeño: repositorios nuevos con la misma firma y ocho líneas
del contenedor. Los 25 casos de uso y las ocho páginas no se tocan — y ahora hay
**contratos que lo verifican al construir** (ver Fase 4).

### Fase 2 — Envolver para iOS · 1 semana

- [ ] Capacitor: `npx cap init`, `npx cap add ios`.
- [ ] Plugins: Camera, Push Notifications, Haptics, Share, Preferences (token de sesión
      en el Keychain, no en `localStorage`).
- [ ] `BrowserRouter` → `HashRouter`, o esquema nativo: dentro de Capacitor no hay
      servidor que reescriba las rutas del SPA.
- [ ] Ajustes de WebView: rebote del body, momentum scroll. **El `backdrop-filter` ya
      está recortado** — ver la sección de dirección visual.

### Fase 3 — Que se sienta nativa · 1–2 semanas

- [ ] Widget de pantalla de bloqueo con el contador. Lo que más devuelve por lo que cuesta.
- [ ] Push cuando la otra persona hace algo. Sin esto la app es un archivo; con esto es
      una conversación.
- [ ] Face ID al abrir.
- [ ] Share Extension desde Fotos.
- [ ] Jubilar el envío por Gmail: el app password de Nodemailer es la pieza más frágil
      del backend.

### Fase 4 — Cerrar la deuda · continuo

En paralelo desde la Fase 0, no al final.

- [x] **Vitest sobre los casos de uso.** Hecho — 125 tests en dominio, aplicación e
      infraestructura, con CI en GitHub Actions (tests y build del frontend; `npm ci` y
      arranque real del servidor para el backend). Encontró tres bugs reales.
- [x] **Contratos de repositorio que validan.** Hecho — `defineRepository` comprueba la
      implementación al construirla y nombra los métodos que faltan. Es lo que impide que
      las implementaciones de `localStorage` y las de Supabase se desincronicen en la
      Fase 1.
- [ ] TypeScript incremental con `allowJs`, empezando por `domain/`.

---

## Dirección visual — «Aguas tranquilas»

**Aplicado** (2026-09-02):

- **Ancla fría.** `pato-agua` #1F3A3D. Toda la paleta era cálida, así que nada tenía
  contra qué leerse como cálido. Es además el color del texto: el negro puro sobre crema
  es duro.
- **Dos familias en vez de cuatro.** Fraunces para lo que emociona, Karla para lo que se
  usa. Cormorant y Playfair hacían el mismo trabajo; DM Sans y Geist también.
- **De vidrio a papel.** `GlassPanel` → `Panel`. El esmerilado queda solo en el widget de
  «ahora suena», que sí flota sobre el contenido. Cuando toda superficie flota, ninguna
  flota — y `backdrop-filter` repetido en listas largas hunde el scroll en un WKWebView.
- **Una sola acción principal por pantalla**, en coral.

**Pendiente:**

- [ ] **`EstanquePareja`** — dos patos cuya distancia dice el estado de la relación. Es la
      idea central del artefacto y resuelve de paso el emparejamiento, los spinners, los
      estados vacíos y el widget de bloqueo. Alimentado por `currentRelationshipStatusId`.
- [ ] Ondas en lugar de spinners.
- [ ] Papelera de 30 días (`deleted_at` en las tablas de la Fase 1).
- [ ] Reglas de respeto: nunca rachas ni insignias, nunca comparar, notificaciones solo
      disparadas por la otra persona.

---

## Funciones — «Señales en el agua»

Las cuatro se apoyan en la misma decisión: **qué tan lejos, nunca dónde.**

| Función | Depende de | Entra en |
|---|---|---|
| La onda compartida | Realtime. Nada nuevo que guardar. | Fase 1 |
| Cartas con fecha | `unlocks_at` en `letters` y un filtro | Fase 1 |
| Toques con foto | Tabla `nudges`, Storage y push | Fase 3 |
| Distancia | Permiso de ubicación, una fila por persona que se sobrescribe | Fase 3 |
| Widget | WidgetKit y un App Group | Fase 3 |

La regla que decide el diseño de la distancia: **estar lejos nunca hace la relación más
pequeña, hace el mundo más grande.** Los patos conservan su distancia de relación; lo que
se ensancha es el agua.

---

## Qué NO está en el plan

- Cambiar de framework. No resuelve ninguno de los problemas reales.
- Funciones nuevas antes de la Fase 1. Añadirlas sobre una base donde la pareja no
  comparte datos multiplica el problema en vez de resolverlo.

---

## Si tuvieras que elegir

**Esta semana, la Fase 0** — porque ahora mismo hay un camino en el que la app dice
«guardado» y no guardó nada.

**Este mes, la Fase 1.** Todo lo demás depende de que primero existan dos personas y un
solo lugar compartido entre ellas.
