# Pato

Aplicación web para parejas: recuerdos compartidos, contador de tiempo juntos, citas, estado de la relación, fotos y vídeos, cartas, perfiles de cada uno, playlists y widget «Ahora suena» (Spotify / YouTube). Diseño en tonos pastel (crema, miel, melocotón, coral), tipografía elegante y optimizada para móvil (safe areas, padding).

## Stack técnico

- **Frontend:** React 18, Vite 5, React Router 6, Tailwind CSS 3. ES modules.
- **Backend:** Node.js + Express (puerto 3001), CORS, dotenv, Nodemailer (Gmail).
- **Persistencia:** `localStorage` en el cliente (sin base de datos en servidor).

## Arquitectura

- **Frontend:** capas de dominio (entidades y repositorios), aplicación (casos de uso), infraestructura (repositorios en localStorage, API cliente, contenedor de dependencias) y presentación (páginas, componentes, hooks).
- **Backend:** un solo `server/index.js` con rutas para correo, playlists, OAuth Spotify/YouTube y «now playing» por perfil.

Estructura del código (Clean Architecture):

- **`src/domain`** — Entidades y contratos (repositorios).
- **`src/application`** — Casos de uso (getAppState, addMedia, saveLetter, etc.).
- **`src/infrastructure`** — Implementaciones (localStorage, API playlist/email).
- **`src/presentation`** — React: páginas, componentes, hooks y estilos.

## Funcionalidades

- **Inicio:** contador desde la fecha en que se conocieron, número de citas, estado de la relación, frase del día, fotos/vídeos flotantes (opción «mostrar en página principal»), resumen de la pareja (si hay perfiles con nombre) y enlace al historial.
- **Perfil de la pareja:** dos bloques (Yo / Pareja) con foto, nombre, apellido, fecha de nacimiento, favoritos y resumen; restablecer o quitar por bloque. Enlace a vinculación de YouTube.
- **Fotos y vídeos:** subida de imágenes y vídeos (data URL en localStorage), toggle «Mostrar en página principal», edición y eliminación. En la landing, fotos y vídeos flotantes (vídeos en pop-up, autoplay, repetir al tocar).
- **Playlists:** añadir por URL (Spotify o YouTube/YouTube Music). Backend obtiene nombre, autor e imagen (Spotify API, YouTube Data API v3 o ytmusicapi).
- **Ahora suena:** widget plegable con pestañas Spotify y YouTube Music. OAuth por perfil (Yo/Pareja) en Spotify; «now playing» real en Spotify. YouTube: OAuth para vincular; sin API pública de «now playing».
- **Cartas:** borradores guardados; envío por mailto o por Gmail vía backend. Historial de cartas enviadas.
- **Historial:** citas registradas (fecha, lugar, hora, nota) con formulario de alta; listado de cartas enviadas.
- **Configuración:** fecha en que se conocieron, estado actual de la relación y estados personalizados.

## Cómo ejecutar

**Solo la página (sin envío por Gmail ni playlists):**

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

**Para Gmail, playlists y «Ahora suena»:**

1. Entra en la carpeta del servidor e instala dependencias:
   ```bash
   cd server
   npm install
   ```
2. Copia `server/.env.example` a `server/.env` y rellena (ver sección [Variables de entorno](#variables-de-entorno-backend)).
3. Arranca el servidor:
   ```bash
   npm run dev
   ```
   (Por defecto escucha en http://localhost:3001; `HOST=0.0.0.0` para acceso en la red local.)
4. En la raíz del proyecto, arranca la app. Opcional: `VITE_API_URL` para apuntar al API:
   ```bash
   VITE_API_URL=http://localhost:3001 npm run dev
   ```
   En Windows (PowerShell): `$env:VITE_API_URL="http://localhost:3001"; npm run dev`

Si abres la app desde una **IP** (ej. desde el móvil en la misma WiFi), el frontend usa esa IP para el API automáticamente; no hace falta `VITE_API_URL`.

## Uso desde móvil (red local)

- Abre la app desde el navegador del móvil con la IP de tu PC (ej. `http://10.0.0.146:5173`).
- El frontend usa esa IP para las llamadas al API; el backend usa el header `Host` de la petición para los redirect URIs de OAuth.
- Para vincular Spotify/YouTube desde el móvil, añade en el Dashboard de Spotify y en Google Cloud (URIs de redirección) la URI de callback con tu IP, por ejemplo: `http://10.0.0.146:3001/api/spotify/callback` y `http://10.0.0.146:3001/api/youtube/callback`.

## Variables de entorno (backend)

Ver `server/.env.example`. Resumen:

- **Gmail:** `GMAIL_USER`, `GMAIL_APP_PASSWORD` (contraseña de aplicación: Cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones).
- **Spotify:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` (crear app en [Spotify for Developers](https://developer.spotify.com/dashboard)). Redirect URI: `http://127.0.0.1:3001/api/spotify/callback` (y, para móvil, `http://TU_IP:3001/api/spotify/callback`).
- **YouTube:** `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `YOUTUBE_API_KEY` (crear en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)). Para móvil, añade también la URI con tu IP.
- Opcional: `FRONTEND_URL`, `HOST` (por defecto `0.0.0.0`), `PORT` (por defecto 3001), `YTMUSIC_BROWSER_JSON` (ytmusicapi).

## Carpetas de contenido

- **`/images`** — Imágenes de patos para el menú lateral y los módulos. Para que la app las sirva, su contenido debe estar también en **`public/images`** (Vite sirve archivos desde `public`).
- **`/photos_videos`** — Opcional: fotos/vídeos locales; en la app se agregan desde el módulo «Fotos y videos» y se elige cuáles mostrar en la página principal.

## YouTube Music y ytmusicapi

Para **playlists de YouTube Music** por URL se usa la **YouTube Data API v3** (con `YOUTUBE_API_KEY`). Si quieres más capacidades (biblioteca, historial, etc.), puedes usar la API no oficial **ytmusicapi** (Python):

- Repositorio: [sigma67/ytmusicapi](https://github.com/sigma67/ytmusicapi)
- Documentación: [ytmusicapi.readthedocs.io](https://ytmusicapi.readthedocs.io/)

El backend puede ejecutar scripts Python con ytmusicapi (p. ej. `server/ytmusicapi/fetch_playlist.py`) cuando `YTMUSIC_BROWSER_JSON` está configurado; ver `server/.env.example` y la documentación del proyecto.
