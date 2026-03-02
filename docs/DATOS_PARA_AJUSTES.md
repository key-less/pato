# Ajustes Railway + Netlify — Pato en producción

URLs actuales:

- **Frontend (Netlify):** https://pa-to.netlify.app
- **Backend (Railway):** https://pato-production.up.railway.app

---

## Netlify — Lo que hay que hacer

### 1. Añadir variable de entorno (obligatorio)

En la captura de **Environment variables** no aparece **`VITE_API_URL`**. Sin ella, el frontend en producción no sabe a qué API llamar.

**Pasos:**

1. En Netlify → tu sitio → **Site configuration** (o **Build & deploy**) → **Environment variables**.
2. Pulsa **Add a variable** (o **Add single variable**).
3. **Key:** `VITE_API_URL`  
   **Value:** `https://pato-production.up.railway.app`  
   (Sin barra final. No la marques como Secret si no es necesario.)
4. Guarda.
5. **Importante:** Vite inyecta las variables en el **build**. Ve a **Deploys** → **Trigger deploy** → **Deploy site** para que el próximo build lleve esta variable. Si no redepliegas, la app seguirá sin la URL del API.

### 2. Build settings (ya están bien)

- Base directory: `/`
- Build command: `npm run build`
- Publish directory: `dist`

No hace falta cambiar nada ahí.

---

## Railway — Lo que hay que hacer

### 1. Root Directory (carpeta `server`)

En Railway el **Root Directory** no suele estar en la pestaña **Deploy** (donde está el toggle Serverless). Suele estar en:

- **Settings** del **servicio** (el backend) → sección **Source** (o **Repository** / **Build**).
- Ahí busca **Root Directory** o **Service root**.
- Valor: **`server`** o **`/server`** (dependiendo de la versión de Railway; si uno da error, usa el otro).

Si no ves "Source" ni "Root Directory", puede que tu versión de Railway lo tenga en otro nombre; revisa todas las secciones de **Settings** del servicio.

**Comprobar si ya está bien:** abre en el navegador:

- https://pato-production.up.railway.app/api/health

Si ves `{"ok":true,"service":"pato-api"}`, el backend está arrancando desde la carpeta correcta (aunque no veas el campo Root Directory, puede que esté bien). Si ves 404 o error de Express, entonces el servicio está usando la raíz del repo y hay que poner Root Directory = `server`.

### 2. Variables de entorno en Railway

En el **servicio** del backend → **Variables**, asegúrate de tener:

| Variable | Valor |
|----------|--------|
| **FRONTEND_URL** | `https://pa-to.netlify.app` |
| **SPOTIFY_REDIRECT_URI** | `https://pato-production.up.railway.app/api/spotify/callback` |
| **YOUTUBE_REDIRECT_URI** | `https://pato-production.up.railway.app/api/youtube/callback` |

El resto (Gmail, Spotify client id/secret, YouTube client id/secret, `YOUTUBE_API_KEY`, etc.) como en `server/.env.example`.

### 3. OAuth en Spotify y Google

En el **Dashboard de Spotify** → tu app → **Redirect URIs**, añade:

- `https://pato-production.up.railway.app/api/spotify/callback`

En **Google Cloud Console** → credenciales OAuth → **URIs de redirección**, añade:

- `https://pato-production.up.railway.app/api/youtube/callback`

Así el login desde la página en producción redirige bien al backend en Railway.

---

## Resumen de variables por servicio (sin valores secretos)

Para cambios de dominio o migración, referencia rápida de qué variable se configura dónde:

| Variable | Dónde se configura | Uso |
|----------|--------------------|-----|
| **VITE_API_URL** | Netlify (Environment variables) | URL del backend; el frontend la usa en el build para todas las llamadas API. |
| **FRONTEND_URL** | Railway (Variables) | URL del frontend; el backend la usa para redirigir tras OAuth (Spotify/YouTube). |
| **SPOTIFY_REDIRECT_URI** | Railway | Debe coincidir con la URI registrada en Spotify (callback del backend). |
| **YOUTUBE_REDIRECT_URI** | Railway | Debe coincidir con la URI en Google Cloud (callback del backend). |
| **GMAIL_USER**, **GMAIL_APP_PASSWORD** | Railway | Envío de cartas por correo. |
| **SPOTIFY_CLIENT_ID**, **SPOTIFY_CLIENT_SECRET** | Railway | Ahora suena y playlists por URL. |
| **YOUTUBE_CLIENT_ID**, **YOUTUBE_CLIENT_SECRET**, **YOUTUBE_API_KEY** | Railway | Vincular YouTube y playlists por URL. |
| Redirect URIs | Spotify Dashboard / Google Cloud Console | Añadir la URL de callback del backend (ej. `https://.../api/spotify/callback`). |

Nunca subas contraseñas ni secrets al repo; en producción todo se define en los paneles de Netlify y Railway.

---

## Resumen

| Dónde | Acción |
|--------|--------|
| **Netlify** | Añadir `VITE_API_URL` = `https://pato-production.up.railway.app` y hacer **Trigger deploy**. |
| **Railway** | En Settings del servicio, buscar **Root Directory** (Source/Build) y poner `server` si no está. Definir **FRONTEND_URL** y los redirect URIs de Spotify/YouTube con la URL de Railway. |
| **Spotify / Google** | Añadir los redirect URIs de producción con `https://pato-production.up.railway.app`. |
