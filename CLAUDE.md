# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Pato** — a couples web app with shared memories, a relationship counter, dates log, photo/video gallery, letters, partner profiles, playlists, and a "now playing" widget (Spotify + YouTube Music). Pastel design (cream, honey, peach, coral), optimized for mobile.

## Commands

```bash
# Frontend only (no Gmail or playlists)
npm run dev                         # http://localhost:5173

# Backend only
cd server && npm run dev            # http://localhost:3001

# Both together (concurrently)
npm run dev:all

# Tests
npm test                            # vitest run
npm run test:watch

# Production build
npm run build                       # outputs dist/

# With a specific API URL
VITE_API_URL=http://localhost:3001 npm run dev
# PowerShell: $env:VITE_API_URL="http://localhost:3001"; npm run dev
```

## Architecture

Clean Architecture with four layers:

```
src/domain/         — Entities (AppState, Cita, Letter, Media, PartnerProfile, Playlist, SentLetterLog) + repository interfaces + errors
src/application/    — Use cases (one file per operation: addMedia, saveLetter, addCita, exportBackup, etc.)
src/infrastructure/ — Two interchangeable persistence backends + API clients + DI container
                      storage/   local: localStorage + IndexedDB (álbum)
                      supabase/  remoto: Postgres con RLS + Storage
src/presentation/   — React pages, components, hooks (App.jsx, AuthGate, Layout, Sidebar, pages/, hooks/)
server/index.js     — Single Express file: email, Spotify OAuth, YouTube OAuth, playlist fetch, now playing
supabase/           — migrations/ (esquema, RLS, emparejamiento) + tests/ (aislamiento entre parejas)
tests/              — Vitest (npm test)
```

**Dependency injection:** `src/infrastructure/di/container.js` wires every repository to every use case and exports a single `container` object. Pages import from `container`, never from repos or use cases directly.

**Persistence:** el contenedor elige backend según haya o no `VITE_SUPABASE_URL`.

- **Local (por defecto):** `localStorage` para todo menos el álbum; el álbum vive en IndexedDB con los binarios como `ArrayBuffer` en un store aparte de los metadatos. Migra solo desde el formato antiguo de data URLs.
- **Supabase:** Postgres con RLS por `couple_id` y los archivos en un bucket privado con signed URLs.

Las ocho interfaces de repositorio son idénticas en ambos modos: cambiar de uno a otro toca `container.js` y nada más.

**Escrituras:** toda escritura puede fallar y ninguna falla en silencio. `localStorageDriver` distingue cupo agotado de otros errores, lanza, y emite por `storageAlerts`; `StorageAlert` (montado en `Layout`) lo muestra aunque la pantalla que lo disparó no lo capture.

**Seguridad:** el modelo de amenaza, las políticas RLS y los requisitos de App Store están en [docs/SEGURIDAD.md](docs/SEGURIDAD.md). Leerlo antes de tocar el esquema.

## Backend API routes

| Route | Purpose |
|---|---|
| `GET /api/health` | Health check (Railway/Render) |
| `POST /api/send-email` | Send letter via Gmail (Nodemailer) |
| `GET /api/playlist/fetch?url=` | Fetch Spotify/YouTube playlist metadata |
| `GET /api/spotify/auth?profile=0\|1` | Start Spotify OAuth per profile |
| `GET /api/spotify/callback` | Spotify OAuth callback |
| `GET /api/now-playing/spotify` | Current track for both profiles |
| `GET /api/youtube/auth` | Start YouTube OAuth |
| `GET /api/youtube/callback` | YouTube OAuth callback |
| `GET /api/youtube/me` | Check YouTube connection |
| `GET /api/now-playing/youtube` | YouTube now playing (always null — no public API) |

Rate limits: 120 req/min general, 10 req/min on `/api/send-email`.

## API URL resolution

`src/infrastructure/api/playlistApi.js` auto-resolves the backend URL:
1. `VITE_API_URL` env var (set at **build time** by Vite — must redeploy to change)
2. If opened from a non-localhost IP (e.g. phone on LAN), uses `<that IP>:3001`
3. Otherwise `http://localhost:3001`

## Environment variables

**Frontend (`.env`):**
- `VITE_API_URL` — backend public URL for production builds
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — sin ellas la app corre en modo local. La anon key es pública por diseño; la `service_role` key **nunca** va en el frontend.

**Backend (`server/.env`):**
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` — Gmail App Password (not the account password)
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `YOUTUBE_API_KEY`
- `FRONTEND_URL` — used by backend to redirect after OAuth
- `PORT` (default 3001), `HOST` (default `0.0.0.0`)
- `YTMUSIC_BROWSER_JSON` — path to ytmusicapi credentials (optional)

Copy `server/.env.example` to `server/.env` to get started. Never commit `.env` files.

## Deployment

| Part | Platform | Notes |
|---|---|---|
| Frontend | Vercel | `npm run build`, publish `dist/`, set `VITE_API_URL` env var |
| Backend | Render | root `server/`, start `npm start`, set all env vars |
| Database | Supabase | reserved for future integration |

- SPA routing: `vercel.json` rewrites `/*` → `/index.html`.
- `app.set('trust proxy', 1)` is set so HTTPS redirect URIs work behind Render's proxy.
- OAuth redirect URIs must be registered in Spotify Dashboard and Google Cloud Console for every URL (localhost, IP, and production).

## ytmusicapi (optional)

Python backend for YouTube Music playlist metadata. Place `server/ytmusicapi/browser.json` (generated by ytmusicapi) and set `YTMUSIC_BROWSER_JSON` if needed. Falls back to YouTube Data API v3 if unavailable.
