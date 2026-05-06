# Producción completa — Todos los servicios para los usuarios

Para que los usuarios puedan usar **Gmail (cartas)**, **Spotify (Ahora suena / playlists)** y **YouTube (playlists / vincular cuenta)** en la app publicada, sigue esta lista.

---

## 1. Variables en Render (todas)

**Si al abrir la URL del backend ves "Application failed to respond":**  
En Render → tu proyecto → **servicio del backend** → **Settings** → **Root Directory** (o "Source" / "Monorepo"). Pon **`server`** o **`/server`** (según lo que acepte tu versión de Render; si uno da error, usa el otro) y guarda. Así Render ejecuta `node index.js` desde la carpeta correcta. Luego **Redeploy** (Deployments → tres puntos del último deploy → Redeploy). Revisa también los **Deploy logs** para ver el error concreto (ej. "Cannot find module" o "npm ERR missing script: start").

En Render → tu proyecto → **servicio del backend** → **Variables**. Añade o revisa **todas** estas variables:

### URLs (valores exactos)

| Variable | Valor |
|---------|--------|
| `FRONTEND_URL` | URL de tu frontend en producción (ej. `https://pato.vercel.app` en Vercel) |
| `SPOTIFY_REDIRECT_URI` | `https://tu-api.onrender.com/api/spotify/callback` |
| `YOUTUBE_REDIRECT_URI` | `https://tu-api.onrender.com/api/youtube/callback` |

### Gmail (cartas por correo)

| Variable | Dónde obtener el valor |
|---------|------------------------|
| `GMAIL_USER` | Tu correo de Gmail (ej. `mi.correo@gmail.com`) |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación: [Cuenta Google](https://myaccount.google.com/) → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones. Crear una para “Correo” y pegarla aquí. **No** uses tu contraseña normal. |

### Spotify (Ahora suena + playlists por URL)

| Variable | Dónde obtener el valor |
|---------|------------------------|
| `SPOTIFY_CLIENT_ID` | [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app → **Client ID** |
| `SPOTIFY_CLIENT_SECRET` | Misma app → **Settings** → **Client secret** → **Show** y copiar |

### YouTube (vincular cuenta + playlists por URL)

| Variable | Dónde obtener el valor |
|---------|------------------------|
| `YOUTUBE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → credenciales **Cliente OAuth 2.0** → **ID de cliente** |
| `YOUTUBE_CLIENT_SECRET` | Misma credencial → **Secretos de cliente** → copiar |
| `YOUTUBE_API_KEY` | En la misma consola, crear o usar una **Clave de API** (tipo `AIzaSy...`). Sirve para obtener datos de playlists por URL. En “Biblioteca” hay que tener habilitada **YouTube Data API v3**. |

**No** hace falta definir `PORT` ni `HOST`; Render los asigna (por ejemplo PORT=8080 en Networking). El servidor usa `process.env.PORT` y escucha en ese puerto; la URL pública no lleva puerto en el navegador.

---

## 2. Redirect URIs en Spotify y Google

Sin esto, al hacer clic en “Conectar Spotify” o “Conectar YouTube” en producción la redirección falla.

### Spotify

1. [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app.
2. **Settings** → **Redirect URIs**.
3. Añade **solo** la URL del **backend** (Render), no la del frontend:
   ```text
   https://tu-api.onrender.com/api/spotify/callback
   ```
   Si pones la URL del frontend (ej. `https://pato.vercel.app/...`), tras autorizar Spotify te redirigirá a Vercel y verás "Page not found"; el callback debe ser la del API en Render.
4. **Save**.

### Google (YouTube)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Abre la credencial **Cliente OAuth 2.0** que usas para YouTube.
3. En **URIs de redirección autorizados** añade:
   ```text
   https://tu-api.onrender.com/api/youtube/callback
   ```
4. Guardar.

---

## 3. Frontend: Vercel

La variable **`VITE_API_URL`** debe estar definida en Vercel y ser **`https://tu-api.onrender.com`** (sin barra final). Después de añadirla o cambiarla, hay que **volver a desplegar**.

### Vercel
- **Build:** Connect to Git → **Build command** = `npm run build`, **Output directory** = `dist`.
- **Variables:** En el proyecto → **Settings → Environment variables** → añadir `VITE_API_URL` con la URL del backend en Render.
- **SPA:** El `vercel.json` en la raíz del repo ya maneja las redirecciones para React Router.
- **Después de cambiar la variable:** **Deployments → Redeploy**.

### Comprobar que el backend responde
Abrir en el navegador: `https://tu-api.onrender.com/api/health`. Debe devolver `{"ok":true}`.

---

## Si ves "Application failed to respond" o **502 Bad Gateway**

1. **Root Directory (obligatorio):** Settings del servicio → **Root Directory** = **`server`** o **`/server`** (usa el valor que Render acepte sin dar error). Sin esto, Render ejecuta desde la raíz del repo, no encuentra `index.js` y el proceso no responde → 502.
2. **Redeploy** después de cambiar Root Directory (Deployments → Redeploy).
3. **Revisar logs de ejecución** (no solo el build): en los logs debe aparecer:
   - `[Pato] Iniciando... PORT= XXXX` → el proceso arrancó.
   - `[Pato] API escuchando en http://0.0.0.0:XXXX` → ya acepta peticiones (el 502 debería desaparecer).
   Si ves `uncaughtException` o `Error al hacer listen`, ese es el motivo del fallo.
4. **"No package manager inferred, using npm default":** es solo informativo. Con Root Directory = `server`, en `server/` hay `package.json` y `package-lock.json`, y Render usa `npm start` para iniciar.
5. **"Attempt failed with service unavailable" en el healthcheck:** Render llama a la ruta de health antes de que la app responda. Revisa los logs: si no aparece `[Pato] API escuchando`, la app no arranca. Si sí aparece, en Deploy → **Healthcheck Path** (o Settings → Health Check) configura **`/api/health`** o **`/`** (ambas devuelven `{ "ok": true }`). Así Render no marcará el servicio como caído. Ver también **Pasos a corto plazo** en [docs/DEPLOY.md](DEPLOY.md) (monitoreo, rama develop).

---

## Si agregar playlist (Spotify o YouTube) no responde

1. **Logs de Render al intentar agregar:** Deployments → **View Logs**. Busca la línea:
   - `[Playlist] fetch: ... | Spotify env: true/false | YouTube API key: true/false`
   - Si **Spotify env: false** → En Render → **Variables** añade o corrige `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` (desde [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app → Client ID y Settings → Client secret). Sin espacios al pegar.
   - Si **YouTube API key: false** → Añade `YOUTUBE_API_KEY` en Render (Google Cloud Console → Credenciales → Crear clave de API; en Biblioteca habilita **YouTube Data API v3**).
2. **Otros mensajes en logs:**
   - `Playlist fetch: Spotify token no obtenido` → Las variables de Spotify están vacías o incorrectas.
   - `Spotify token error: 401` → Spotify rechaza las credenciales; comprueba que ID y Secret sean de la misma app.
   - `Playlist fetch Spotify: 404` → La playlist debe ser **pública** en Spotify (abre la playlist → ⋮ → Hacer pública).
3. **En la app:** Si ves "No se pudo conectar" o "Error del servidor (404)", en el frontend (Vercel → Settings → Environment Variables) define `VITE_API_URL` = `https://tu-api.onrender.com` y haz un **nuevo deploy**.

---

## Robustez y optimización en producción

Ajustes aplicados en el código para reducir fallos y mejorar rendimiento:

- **Backend:** Timeout de 15 s en peticiones a Spotify/YouTube; si la API externa no responde, se devuelve un mensaje claro en lugar de colgar. Rutas `/api/*` no definidas responden con JSON `{ ok: false, error: "Ruta no encontrada" }` (404).
- **Frontend:** Error Boundary global: si un componente lanza un error, se muestra un mensaje amigable y botón "Recargar" en lugar de pantalla en blanco. Rutas cargadas con lazy loading (React.lazy + Suspense) para reducir el tamaño del bundle inicial. Build de Vite con chunks separados (vendor-react) para mejor caché.

Con esto la app está preparada para producción estable y para continuar con fases posteriores (p. ej. Fase 7).

---

## Resumen rápido

| Dónde | Qué hacer |
|-------|-----------|
| **Render Variables** | Poner las 10 variables: `FRONTEND_URL`, `SPOTIFY_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_API_KEY`. |
| **Spotify Dashboard** | Añadir redirect URI de producción. |
| **Google Cloud** | Añadir URI de redirección de producción en el cliente OAuth. |
| **Frontend (Vercel)** | Tener `VITE_API_URL` = URL del API y redeploy si la cambiaste. En Render, `FRONTEND_URL` = URL del frontend en Vercel. |

Cuando todo esté configurado, los usuarios podrán usar en producción: envío de cartas por Gmail, Conectar Spotify, Ahora suena, Conectar YouTube y playlists por URL (Spotify y YouTube).
