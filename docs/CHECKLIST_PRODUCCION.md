# Producción completa — Todos los servicios para los usuarios

Para que los usuarios puedan usar **Gmail (cartas)**, **Spotify (Ahora suena / playlists)** y **YouTube (playlists / vincular cuenta)** en la app publicada, sigue esta lista.

---

## 1. Variables en Railway (todas)

En Railway → tu proyecto → **servicio del backend** → **Variables**. Añade o revisa **todas** estas variables:

### URLs (valores exactos)

| Variable | Valor |
|---------|--------|
| `FRONTEND_URL` | `https://voluble-buttercream-643073.netlify.app` |
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

**No** hace falta definir `PORT` ni `HOST`; Railway los asigna.

---

## 2. Redirect URIs en Spotify y Google

Sin esto, al hacer clic en “Conectar Spotify” o “Conectar YouTube” en producción la redirección falla.

### Spotify

1. [Spotify for Developers](https://developer.spotify.com/dashboard) → tu app.
2. **Settings** → **Redirect URIs**.
3. Añade (y mantén las de local si sigues probando en local):
   ```text
   https://pato-production.up.railway.app/api/spotify/callback
   ```
   Debe ser **exactamente** esta URL (con `https`, sin barra final, sin puerto en el dominio). Si en producción "Conectar Spotify" o agregar playlist falla, comprueba que esta URI esté en la lista y que en Railway tengas `SPOTIFY_REDIRECT_URI` con el mismo valor.
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

## 3. Netlify

- **`VITE_API_URL`** = `https://pato-production.up.railway.app` (sin barra final).
- Después de añadirla o cambiarla: **Deploys** → **Trigger deploy** → **Deploy site**.

---

## Si agregar playlist o conectar Spotify falla

1. **Revisa los logs de Railway** (tu servicio → **Deployments** → último deploy → **View Logs**). Verás mensajes como:
   - `Playlist fetch: Spotify token no obtenido...` → Faltan o están mal `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` en Railway.
   - `Spotify token error: 401` → Spotify rechaza las credenciales; revisa que Client ID y Secret sean los de la misma app y estén bien copiados.
   - `Playlist fetch Spotify: 404` → La playlist no existe o no es pública.
2. **En la app**: si ves "No se pudo conectar con el servidor" y un aviso de configurar `VITE_API_URL`, en Netlify define `VITE_API_URL` = `https://pato-production.up.railway.app` y haz un nuevo deploy.

---

## Resumen rápido

| Dónde | Qué hacer |
|-------|-----------|
| **Railway Variables** | Poner las 10 variables: `FRONTEND_URL`, `SPOTIFY_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_API_KEY`. |
| **Spotify Dashboard** | Añadir redirect URI de producción. |
| **Google Cloud** | Añadir URI de redirección de producción en el cliente OAuth. |
| **Netlify** | Tener `VITE_API_URL` y redeploy si la cambiaste. |

Cuando todo esté configurado, los usuarios podrán usar en producción: envío de cartas por Gmail, Conectar Spotify, Ahora suena, Conectar YouTube y playlists por URL (Spotify y YouTube).
