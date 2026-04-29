# Pato V2 — Diseño

**Fecha:** 2026-04-29  
**Estado:** Aprobado

---

## Cambio 1: Módulo de Citas (nuevo)

### Objetivo
Separar la gestión de citas del Historial en su propio módulo dedicado para que la sección tenga más protagonismo y sea fácil de encontrar.

### Ruta y navegación
- Ruta: `/citas`
- Entrada en Sidebar: "Citas" (mismo patrón visual que el resto de entradas)
- Sidebar actualizado: quita "Historial" donde estaba, añade "Citas" e "Historial" como entradas independientes

### Componentes
- `src/presentation/pages/CitasModule.jsx` — nueva página que contiene:
  - `CitaForm` (formulario: fecha, hora, lugar, nota)
  - Lista de citas con `CitaCard` (fecha, lugar, nota, botón Quitar)
  - Título y encabezado estilo módulo

### Cambios en LandingPage
- La sección inferior cambia de "Historial" a "Citas"
- El enlace apunta a `/citas` en lugar de `/historial`
- El contador `citas.length` no cambia — ya funciona

### Cambios en HistorialModule
- Se elimina la sección de citas (CitaForm + lista)
- Se reescribe completamente (ver Cambio 2)

---

## Cambio 2: Historial rediseñado como feed de actividad

### Objetivo
Convertir el Historial en un registro cronológico de todo lo que sucede en la app, con la foto de perfil de quien realizó la acción.

### Entidad nueva: ActivityEvent

```js
{
  id: string,           // 'evt-<timestamp>-<random>'
  type: string,         // ver tipos abajo
  description: string,  // texto legible, ej. "Agregó una cita: 15 may 2026 en Restaurante XYZ"
  profileIndex: 0 | 1,  // quién hizo la acción; default 0 ("Yo")
  createdAt: string,    // ISO timestamp
}
```

**Tipos de evento:**

| type | Generado desde |
|---|---|
| `cita_added` | CitasModule al agregar cita |
| `cita_removed` | CitasModule al quitar cita |
| `letter_sent` | LettersModule al enviar carta |
| `status_changed` | SettingsModule al cambiar estado de relación |
| `date_changed` | SettingsModule al cambiar fecha de inicio |
| `media_added` | MediaModule al agregar foto/video |
| `media_removed` | MediaModule al eliminar foto/video |
| `profile_updated` | PartnerProfileModule al guardar perfil |
| `playlist_added` | PlaylistsModule al agregar playlist |
| `playlist_removed` | PlaylistsModule al eliminar playlist |

### Infraestructura

Archivos nuevos siguiendo el patrón Clean Architecture existente:

- `src/domain/entities/ActivityEvent.js` — `createActivityEvent(props)`
- `src/application/useCases/addActivityEvent.js`
- `src/application/useCases/getActivityEvents.js`
- `src/application/useCases/removeActivityEvent.js`
- `src/infrastructure/storage/localStorageActivityEventRepository.js`
- Entradas nuevas en `src/infrastructure/di/container.js`

### Autoría de eventos

No existe sistema de login. Todos los eventos se atribuyen a `profileIndex: 0` ("Yo"). Se muestra la foto de `profiles[profileIndex].profilePhotoUrl`. Si no hay foto, placeholder con inicial del nombre o ícono genérico.

### HistorialModule reescrito

- Feed ordenado más reciente arriba
- Cada tarjeta: `[foto circular 36px] | descripción del evento | timestamp relativo + fecha`
- Botón "Quitar" en cada evento (soft delete)
- Estado vacío: mensaje amigable

### Sent Letters

Las cartas enviadas dejan de tener sección propia en Historial. Pasan a ser eventos de tipo `letter_sent` en el feed. El `localStorageSentLetterLogRepository` y sus use cases se mantienen sin tocar (otros módulos podrían usar los logs).

---

## Cambio 3: Foto de perfil junto al botón de menú

### Objetivo
Mostrar en la landing (y en todas las páginas) un pequeño indicador visual de quién está "activo" en la app.

### Implementación en Layout.jsx

- Carga `partnerProfiles` desde `container.getPartnerProfiles()` al montar
- Si `profiles[0]?.profilePhotoUrl` existe, renderiza un círculo de 32 px `position: fixed` pegado a la derecha del botón hamburguesa
- El grupo botón + foto ocupa la misma fila fija arriba a la izquierda
- Sin foto: el círculo no aparece (no hay placeholder vacío flotando)

---

## Cambio 4: Limpiar plataforma, eliminar Netlify

### Archivos a eliminar
- `netlify.toml`
- `server/railway.toml`
- `server/nixpacks.toml`

### Archivos a crear
- `vercel.json` — rewrite SPA:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

### Docs a actualizar
- `docs/DEPLOY.md` — reemplazar Netlify → Vercel, Railway → Render
- `docs/CHECKLIST_PRODUCCION.md` — misma sustitución
- `docs/DATOS_PARA_AJUSTES.md` — actualizar URLs y plataformas
- `CLAUDE.md` (raíz del proyecto pato) — stack de producción: Vercel + Render (Supabase como futuro)

### Stack de producción resultante
- **Frontend:** Vercel (build `npm run build`, publish `dist`, `VITE_API_URL` como env var)
- **Backend:** Render (start `npm start` desde `server/`, env vars en el panel)
- **Supabase:** reservado para futura integración de base de datos

---

## Dependencias entre cambios

```
Cambio 1 (CitasModule) → debe existir antes de que Cambio 2 lo instrumente
Cambio 2 (ActivityEvent infra) → debe existir antes de tocar los módulos
Cambio 3 (Layout) → independiente
Cambio 4 (plataforma) → independiente
```

## Orden de implementación

1. Infraestructura ActivityEvent (entidad + use cases + repo + container)
2. CitasModule + rutas/sidebar
3. Instrumentar módulos con addActivityEvent
4. HistorialModule reescrito
5. Layout foto de perfil
6. Limpieza Netlify/Railway + vercel.json + docs
