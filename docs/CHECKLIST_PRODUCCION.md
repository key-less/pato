# Producción completa — Todos los servicios para los usuarios

Para que los usuarios puedan usar **Gmail (cartas)**, **Spotify (Ahora suena / playlists)** y **YouTube (playlists / vincular cuenta)** en la app publicada, sigue esta lista.

---

## 1. Variables en Railway (todas)

**Si al abrir la URL del backend ves "Application failed to respond":**  
En Railway → tu proyecto → **servicio del backend** → **Settings** → **Root Directory** (o "Source" / "Monorepo"). Pon **`server`** o **`/server`** (según lo que acepte tu versión de Railway; si uno da error, usa el otro) y guarda. Así Railway ejecuta `node index.js` desde la carpeta correcta. Luego **Redeploy** (Deployments → tres puntos del último deploy → Redeploy). Revisa también los **Deploy logs** para ver el error concreto (ej. "Cannot find module" o "npm ERR missing script: start").

En Railway → tu proyecto → **servicio del backend** → **Variables**. Añade o revisa **todas** estas variables:

### URLs (valores exactos)

| Variable | Valor |
|---------|--------|
| `FRONTEND_URL` | URL de tu frontend en producción (ej. `https://pato.xxx.pages.dev` en Cloudflare Pages o `https://pa-to.netlify.app` en Netlify) |
| `SPOTIFY_REDIRECT_URI` | `https://pato-production.up.railway.app/api/spotify/callback` |
| `YOUTUBE_REDIRECT_URI` | `https://pato-production.up.railway.app/api/youtube/callback` |

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

**No** hace falta definir `PORT` ni `HOST`; Railway los asigna (por ejemplo PORT=8080 en Networking). El servidor usa `process.env.PORT` y escucha en ese puerto; la URL pública no lleva puerto en el navegador.

---

## 2. Redirect URIs en Spotify y Google

Sin esto, al hacer clic en “Conectar Spotify” o “Conectar YouTube” en producción la redirección falla.

### Spotify

1. [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app.
2. **Settings** → **Redirect URIs**.
3. Añade **solo** la URL del **backend** (Railway), no la de Netlify:
   ```text
   https://pato-production.up.railway.app/api/spotify/callback
   ```
   Si pones la URL del frontend (ej. `https://pa-to.netlify.app/...`), tras autorizar Spotify te redirigirá a Netlify y verás "Site not found"; el callback debe ser la del API en Railway.
4. **Save**.

### Google (YouTube)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Abre la credencial **Cliente OAuth 2.0** que usas para YouTube.
3. En **URIs de redirección autorizados** añade:
   ```text
   https://pato-production.up.railway.app/api/youtube/callback
   ```
4. Guardar.

---

## 3. Frontend: Cloudflare Pages o Netlify

La variable **`VITE_API_URL`** debe estar definida en el host del frontend y ser **`https://pato-production.up.railway.app`** (sin barra final). Después de añadirla o cambiarla, hay que **volver a desplegar** (Vite la incluye en el build).

### Cloudflare Pages

- **Build:** Connect to Git → **Build command** = `npm run build`, **Deploy command** = `npx wrangler deploy`, **Root directory** vacío. El repo incluye `wrangler.jsonc` con SPA (rutas no encontradas sirven `index.html`).
- **Variables:** En el proyecto → **Build** → **Variables and secrets** → **+ Add** → **Variable** → nombre `VITE_API_URL`, valor `https://pato-production.up.railway.app`. Las variables de "Worker" (runtime) no aplican a static assets; usa solo las de **Build**.
- **Después de cambiar la variable:** **Deployments** → **Retry deployment** o **Create deployment**.
- No uses `_redirects` en `public/` (provoca error de bucle en Cloudflare); el SPA se resuelve con `wrangler.jsonc` → `not_found_handling: "single-page-application"`.

### Netlify

- **Build:** **Build command** = `npm run build`, **Publish directory** = `dist`, **Base directory** vacío. El `netlify.toml` del repo ya lo define.
- **Variables:** Site settings → **Environment variables** → `VITE_API_URL` = `https://pato-production.up.railway.app`. Después: **Deploys** → **Trigger deploy**.

### Comprobar que el backend responde

Abre en el navegador: `https://pato-production.up.railway.app/api/health`. Debe devolver algo como `{"ok":true}`. Si no carga, el problema es de Railway o de red; si sí carga, el fallo suele ser `VITE_API_URL` en el frontend o falta de redeploy.

---

## Si ves "Application failed to respond" o **502 Bad Gateway**

1. **Root Directory (obligatorio):** Settings del servicio → **Root Directory** = **`server`** o **`/server`** (usa el valor que Railway acepte sin dar error). Sin esto, Railway ejecuta desde la raíz del repo, no encuentra `index.js` y el proceso no responde → 502.
2. **Redeploy** después de cambiar Root Directory (Deployments → Redeploy).
3. **Revisar logs de ejecución** (no solo el build): en los logs debe aparecer:
   - `[Pato] Iniciando... PORT= XXXX` → el proceso arrancó.
   - `[Pato] API escuchando en http://0.0.0.0:XXXX` → ya acepta peticiones (el 502 debería desaparecer).
   Si ves `uncaughtException` o `Error al hacer listen`, ese es el motivo del fallo.
4. **"No package manager inferred, using npm default":** es solo informativo. Con Root Directory = `server`, en `server/` hay `package.json` y `package-lock.json`, y el `nixpacks.toml` fija el comando de inicio `node index.js`.
5. **"Attempt failed with service unavailable" en el healthcheck:** Railway llama a la ruta de health antes de que la app responda. Revisa los logs: si no aparece `[Pato] API escuchando`, la app no arranca. Si sí aparece, en Deploy → **Healthcheck Path** prueba con **`/`** (la raíz también devuelve `{ "ok": true }`) o desactiva el healthcheck temporalmente para comprobar si la API responde al abrir la URL en el navegador.

---

## Si agregar playlist (Spotify o YouTube) no responde

1. **Logs de Railway al intentar agregar:** Deployments → **View Logs**. Busca la línea:
   - `[Playlist] fetch: ... | Spotify env: true/false | YouTube API key: true/false`
   - Si **Spotify env: false** → En Railway → **Variables** añade o corrige `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` (desde [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app → Client ID y Settings → Client secret). Sin espacios al pegar.
   - Si **YouTube API key: false** → Añade `YOUTUBE_API_KEY` en Railway (Google Cloud Console → Credenciales → Crear clave de API; en Biblioteca habilita **YouTube Data API v3**).
2. **Otros mensajes en logs:**
   - `Playlist fetch: Spotify token no obtenido` → Las variables de Spotify están vacías o incorrectas.
   - `Spotify token error: 401` → Spotify rechaza las credenciales; comprueba que ID y Secret sean de la misma app.
   - `Playlist fetch Spotify: 404` → La playlist debe ser **pública** en Spotify (abre la playlist → ⋮ → Hacer pública).
3. **En la app:** Si ves "No se pudo conectar" o "Error del servidor (404)", en el frontend (Cloudflare Pages → Build → Variables, o Netlify → Environment variables) define `VITE_API_URL` = `https://pato-production.up.railway.app` y haz un **nuevo deploy**.

---

## Resumen rápido

| Dónde | Qué hacer |
|-------|-----------|
| **Railway Variables** | Poner las 10 variables: `FRONTEND_URL`, `SPOTIFY_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_API_KEY`. |
| **Spotify Dashboard** | Añadir redirect URI de producción. |
| **Google Cloud** | Añadir URI de redirección de producción en el cliente OAuth. |
| **Frontend (Cloudflare Pages o Netlify)** | Tener `VITE_API_URL` = URL del API y redeploy si la cambiaste. En Railway, `FRONTEND_URL` = URL del frontend (Pages o Netlify). |

Cuando todo esté configurado, los usuarios podrán usar en producción: envío de cartas por Gmail, Conectar Spotify, Ahora suena, Conectar YouTube y playlists por URL (Spotify y YouTube).
