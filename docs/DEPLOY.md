# Fase 5 — Subir la página (despliegue)

Guía para desplegar Pato en un dominio estable (pruebas y producción) sin depender de tu IP local.

---

## 1. Antes de subir: verificación del código

### Checklist previo al despliegue

- [ ] **Build del frontend:** en la raíz, `npm run build`. Debe terminar sin errores y generar la carpeta `dist/`.
- [ ] **Variables de entorno:** el frontend en producción **debe** construirse con `VITE_API_URL` apuntando a la URL pública del backend (ej. `https://pato-api.railway.app`). Sin esto, la app intentará usar `tudominio.com:3001`, que no existe.
- [ ] **Backend:** el servidor arranca aunque falten Gmail o Spotify; solo esas funciones devolverán error. Comprueba que `node server/index.js` (o `npm start` en `server/`) inicia y responde en `GET /api/health` con `{ "ok": true }`.
- [ ] **Secretos:** nunca subas `.env`, `server/.env`, ni archivos de credenciales (`server/*.json` de Google/Spotify). El `.gitignore` ya los excluye; verifica con `git status` antes de hacer push.

### Errores e intermitencias ya cubiertos

- **API en producción:** la URL del API prioriza `VITE_API_URL` (definida en el build). Así, en producción usas siempre la URL del backend; en local o desde IP sigues pudiendo usar la IP sin tocar código.
- **Health check:** el backend expone `GET /api/health` para que las plataformas (Railway, Render, etc.) comprueben que el servicio está vivo y no lo marquen como caído.
- **SPA (React Router):** en Netlify se usa `netlify.toml` (redirects); en Cloudflare Pages, `wrangler.jsonc` con `not_found_handling: "single-page-application"`. Así todas las rutas sirven `index.html` y no hay 404 al recargar.

---

## 2. Dónde subir la página: hosting recomendado

La app tiene **dos partes**:

| Parte      | Qué es              | Dónde desplegarla                    |
|-----------|----------------------|--------------------------------------|
| **Frontend** | React (Vite), estático | Vercel, Netlify o Cloudflare Pages   |
| **Backend**  | Node (Express), API   | Railway, Render o Fly.io             |

### Opción A — Recomendada para empezar (gratis)

- **Frontend:** **Vercel** o **Netlify**  
  - Dominio gratis: `pato.vercel.app` o `pato.netlify.app`.  
  - Conectar el repo de GitHub y desplegar en cada push (rama `main` = producción; otra rama, ej. `develop`, = pruebas).
- **Backend:** **Railway** o **Render**  
  - Railway: dominio tipo `pato-api-production.up.railway.app`.  
  - Render: dominio tipo `pato-api.onrender.com`.  
  - En ambos defines las variables de entorno (Gmail, Spotify, YouTube, etc.) en el panel.

Ventaja: ambiente de **pruebas** (otra rama o otro proyecto) y **producción** separados; no se afectan.

### Opción B — Todo en un solo lugar

- **Render:** un “Static Site” para el frontend y un “Web Service” para el backend en el mismo equipo/ cuenta.  
- O **Fly.io:** frontend como sitio estático y backend como app; más configuración.

### Dominio propio (opcional)

- Puedes comprar un dominio (ej. en Namecheap, Google Domains, Cloudflare) y enlazarlo:
  - En Vercel/Netlify: dominio tipo `pato.tudominio.com` para el frontend.
  - En Railway/Render: subdominio tipo `api.tudominio.com` para el backend.
- Luego en el build del frontend usas `VITE_API_URL=https://api.tudominio.com` y en Spotify/Google pones esas URLs en los redirect URIs.

---

## 3. Crear lo necesario para que no se caiga

### Frontend (Vercel o Netlify)

1. **Build command:** `npm run build`
2. **Output / publish directory:** `dist`
3. **Variables de entorno (en el panel):**
   - `VITE_API_URL` = URL pública del backend (ej. `https://pato-api.railway.app`), **sin** barra final.  
   Importante: en Vite las variables se inyectan en **build time**; si cambias la URL del API, hay que volver a desplegar (nuevo build).

### Backend (Railway o Render)

1. **Start command:** `npm start` (o `node index.js`) desde la carpeta `server/`.
2. **Root:** indicar que el “proyecto” o “servicio” está en la carpeta `server/` (en Railway/Render se elige la raíz del repo y luego el directorio `server` si hace falta).
3. **Variables de entorno** (las mismas que en `server/.env.example`):
   - Gmail: `GMAIL_USER`, `GMAIL_APP_PASSWORD`
   - Spotify: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` (ej. `https://pato-api.railway.app/api/spotify/callback`)
   - YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `YOUTUBE_API_KEY`
   - **FRONTEND_URL:** URL del frontend en producción (ej. `https://pato.vercel.app`). El backend la usa para redirigir tras OAuth.
4. **Health check:** en Render/Railway puedes configurar un health check a `GET /api/health` para que no marquen el servicio como caído por error.

### OAuth (Spotify y Google) en producción

- En el **Dashboard de Spotify** → tu app → Redirect URIs: añade la URL del callback de producción, ej. `https://pato-api.railway.app/api/spotify/callback`.
- En **Google Cloud Console** → credenciales OAuth → URIs de redirección: añade ej. `https://pato-api.railway.app/api/youtube/callback`.
- No quites las URIs de localhost/IP si sigues probando en local; puedes tener varias.

### Ambiente de pruebas vs producción

- **Producción:** rama `main`, despliegue automático; `VITE_API_URL` y `FRONTEND_URL` apuntan a las URLs de producción.
- **Pruebas:** otra rama (ej. `develop`) o otro proyecto en Vercel/Netlify y otro en Railway/Render, con sus propias URLs y variables. Así puedes probar sin afectar a producción.

---

## 6. Pasos a corto plazo (estabilidad y visibilidad)

### Monitoreo básico

- **Health check en Railway:** En el servicio del backend → **Settings** → **Health Check** (o **Deploy**), configura:
  - **Healthcheck Path:** `GET /api/health` (o `/`; ambas rutas devuelven `{ "ok": true }`).
  Así Railway no marcará el servicio como caído por error cuando el API esté respondiendo.
- **Opcional — UptimeRobot (o similar):** Crea un monitor que haga ping cada X minutos a:
  - URL del frontend (Netlify): `https://pa-to.netlify.app`
  - URL del health del backend: `https://pato-production.up.railway.app/api/health`
  Así recibes aviso si el sitio o el API dejan de responder.

### Rama de pruebas (develop)

- **Netlify:** Conecta el mismo repo y en **Build & deploy** → **Branch deploys** activa "Deploy previews" para ramas que no sean `main`. Cada push a `develop` (o cualquier otra rama) generará una URL de preview (ej. `deploy-preview-123--pa-to.netlify.app`). No afecta a producción.
- **Railway (opcional):** Si quieres probar el backend sin tocar producción, crea un **segundo servicio** en el mismo proyecto conectado a la rama `develop`, con su propia URL y variables (por ejemplo `FRONTEND_URL` apuntando a la URL de preview de Netlify). Así pruebas cambios de API en paralelo.

### Documentar URLs y secretos

- Deja en [docs/DATOS_PARA_AJUSTES.md](docs/DATOS_PARA_AJUSTES.md) las URLs finales de producción y la tabla "Resumen de variables por servicio" (solo nombres de variables y dónde se configuran, sin escribir contraseñas). Así cualquier cambio futuro (dominio, migración) está claro.

---

## 4. Resumen de pasos

1. Verificar build y health check (sección 1).
2. Crear cuenta en Vercel (o Netlify) y en Railway (o Render).
3. Conectar el repo de GitHub al frontend (Vercel/Netlify) y al backend (Railway/Render).
4. En el **backend**, configurar todas las variables de entorno y la **FRONTEND_URL**.
5. En el **frontend**, configurar **VITE_API_URL** con la URL del backend y desplegar (build).
6. En Spotify y Google, añadir los redirect URIs de producción.
7. Probar: abrir la URL del frontend desde el móvil y comprobar login, cartas, playlists, etc.

Si algo falla, revisa la consola del navegador (errores de CORS o 404 al llamar al API) y los logs del backend en la plataforma.

---

## 5. Verificación de conexiones

Para comprobar que las APIs están bien gestionadas:

- **Backend → Frontend:** El backend usa `FRONTEND_URL` para redirigir tras OAuth (Spotify/YouTube). En producción debe ser la URL de Netlify (o tu dominio). Si no está definida en Railway, en entornos no localhost se infiere desde el `Host` de la petición (menos fiable).
- **Backend → Spotify/Google:** Los redirect URIs (`SPOTIFY_REDIRECT_URI`, `YOUTUBE_REDIRECT_URI`) deben coincidir exactamente con los que tienes en el Dashboard de Spotify y en Google Cloud (incluido `https://` y la ruta `/api/.../callback`).
- **Frontend → Backend:** El frontend usa `VITE_API_URL` en el build de producción. Si no está definida en Netlify, la app intentará llamar a `tudominio.netlify.app:3001`, que no existe. Comprueba en Netlify → Environment variables que `VITE_API_URL` apunta a la URL pública del backend (Railway).
- **Health y estado al arrancar:** Al iniciar, el servidor escribe en logs qué integraciones están configuradas (Gmail, Spotify, YouTube OAuth, YouTube API key). En Railway → Deployments → View logs puedes ver si alguna queda "no configurado".
- **Prueba rápida:** Abre en el navegador `https://TU_BACKEND_RAILWAY/api/health`. Debe responder `{"ok":true,"service":"pato-api"}`. Si no, el backend no está accesible o la ruta es incorrecta.
