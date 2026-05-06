# Ajustes Vercel + Render — Pato en producción

Stack de producción:
- **Frontend (Vercel):** conectar repo → Build command `npm run build`, Output `dist`, variable `VITE_API_URL`
- **Backend (Render):** Web Service → Root `server/`, Start `npm start`, variables de entorno en el panel

---

## Vercel — Frontend

### Configuración de build
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

### Variable de entorno obligatoria
En Vercel → tu proyecto → **Settings → Environment Variables**:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | URL pública del backend en Render (ej. `https://pato-api.onrender.com`) sin barra final |

Después de añadir o cambiar la variable → **Deployments → Redeploy** para que el build la incluya.

### SPA (React Router)
El `vercel.json` en la raíz del repo ya configura el rewrite necesario para que todas las rutas sirvan `index.html`.

---

## Render — Backend

### Configuración del servicio
- **Type:** Web Service
- **Root directory:** `server`
- **Build command:** `npm install`
- **Start command:** `npm start`

### Variables de entorno en Render
En el servicio → **Environment**:

| Variable | Uso |
|----------|-----|
| `FRONTEND_URL` | URL del frontend en Vercel (ej. `https://pato.vercel.app`) |
| `SPOTIFY_REDIRECT_URI` | `https://tu-api.onrender.com/api/spotify/callback` |
| `YOUTUBE_REDIRECT_URI` | `https://tu-api.onrender.com/api/youtube/callback` |
| `GMAIL_USER` | Correo Gmail |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación Gmail |
| `SPOTIFY_CLIENT_ID` | Desde Spotify for Developers |
| `SPOTIFY_CLIENT_SECRET` | Desde Spotify for Developers |
| `YOUTUBE_CLIENT_ID` | Desde Google Cloud Console |
| `YOUTUBE_CLIENT_SECRET` | Desde Google Cloud Console |
| `YOUTUBE_API_KEY` | Desde Google Cloud Console |

### Health check
En Render → servicio → **Settings → Health Check Path**: `/api/health`

---

## OAuth (Spotify y Google) en producción

### Spotify Dashboard
Añadir en Redirect URIs: `https://tu-api.onrender.com/api/spotify/callback`

### Google Cloud Console
En credenciales OAuth → URIs de redirección: `https://tu-api.onrender.com/api/youtube/callback`

---

## Resumen de variables por servicio

| Variable | Dónde se configura | Uso |
|----------|--------------------|-----|
| `VITE_API_URL` | Vercel (Environment Variables) | URL del backend; se inyecta en build time |
| `FRONTEND_URL` | Render (Environment) | URL del frontend; usada por backend en redirects OAuth |
| `SPOTIFY_REDIRECT_URI` | Render | Callback OAuth Spotify |
| `YOUTUBE_REDIRECT_URI` | Render | Callback OAuth YouTube |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Render | Envío de cartas |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Render | Ahora suena y playlists |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_API_KEY` | Render | YouTube playlists y OAuth |
