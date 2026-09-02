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

# Production build
npm run build                       # outputs dist/

# With a specific API URL
VITE_API_URL=http://localhost:3001 npm run dev
# PowerShell: $env:VITE_API_URL="http://localhost:3001"; npm run dev
```

## Architecture

Clean Architecture with four layers:

```
src/domain/         — Entities (AppState, Cita, Letter, Media, PartnerProfile, Playlist, SentLetterLog) + repository interfaces
src/application/    — Use cases (one file per operation: addMedia, saveLetter, addCita, etc.)
src/infrastructure/ — localStorage repository implementations + API clients (playlistApi.js, sendEmailApi.js) + DI container
src/presentation/   — React pages, components, hooks (App.jsx, Layout, Sidebar, pages/, hooks/)
server/index.js     — Single Express file: email, Spotify OAuth, YouTube OAuth, playlist fetch, now playing
```

**Dependency injection:** `src/infrastructure/di/container.js` wires every repository to every use case and exports a single `container` object. Pages import from `container`, never from repos or use cases directly.

**Persistence:** Everything is in `localStorage` — no database. Media is stored as data URLs (images/video). The backend is stateless (OAuth tokens are in-process memory, lost on restart).

## Backend API routes

| Route | Purpose |
|---|---|
| `GET /api/health` | Health check (Render) |
| `POST /api/send-email` | Send letter via Gmail (Nodemailer) |
| `GET /api/playlist/fetch?url=` | Fetch Spotify/YouTube playlist metadata |
| `GET /api/spotify/auth?profile=0\|1` | Start Spotify OAuth per profile |
| `GET /api/spotify/callback` | Spotify OAuth callback |
| `GET /api/now-playing/spotify` | Current track for both profiles |
| `GET /api/youtube/auth` | Start YouTube OAuth |
| `GET /api/youtube/callback` | YouTube OAuth callback |
| `GET /api/youtube/me` | Check YouTube connection |
| `GET /api/now-playing/youtube` | YouTube now playing (always null — no public API) |

Rate limits: 120 req/min general, 10 req/min on `/api/send-email` (per IP).

**Security middleware** (`server/index.js`, applied before the routes):
- `helmet()` for standard security headers.
- CORS: `FRONTEND_URL` accepts a **comma-separated list** of allowed origins (stable
  domain plus Vercel preview URLs). Requests with no `Origin` header pass through
  (Render health check, curl, OAuth callbacks). A rejected origin returns 403, not 500.
  `allowedOrigins[0]` is the `primaryFrontendUrl` used for OAuth redirects.
- `x-api-key` must match `API_SECRET` on every `/api/*` route except the four OAuth
  paths. With `API_SECRET` empty the check is skipped (local dev).
  Note: the frontend's `VITE_API_SECRET` is baked into the JS bundle and is therefore
  public — it deters scanners, it is not authentication.
- `ALLOWED_EMAIL_RECIPIENTS` restricts `/api/send-email` destinations.

## API URL resolution

`src/infrastructure/api/apiConfig.js` is the single source of truth for the backend
URL and headers — `playlistApi.js` and `sendEmailApi.js` both import from it, so they
cannot drift apart. It resolves:
1. `VITE_API_URL` env var (set at **build time** by Vite — must redeploy to change).
   A value with no protocol gets `https://` prepended.
2. Otherwise `<current hostname>:3001` — covers both localhost and a phone on the LAN.

## Environment variables

**Frontend (`.env`):** `VITE_API_URL` — backend public URL for production builds.

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
