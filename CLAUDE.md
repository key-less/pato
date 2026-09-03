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
src/domain/         — Entities (AppState, ActivityEvent, Cita, Letter, Media, PartnerProfile, Playlist, SentLetterLog) + repository interfaces
src/application/    — Use cases (one file per operation: addMedia, saveLetter, addCita, etc.)
src/infrastructure/ — localStorage repository implementations + API clients (playlistApi.js, sendEmailApi.js) + DI container + pwa/ (service worker registration)
src/presentation/   — React pages, components, hooks (App.jsx, Layout, Sidebar, TabBar, pages/, hooks/)
server/index.js     — Single Express file: email, Spotify OAuth, YouTube OAuth, playlist fetch, now playing
public/sw.js        — Service worker (offline app shell); public/manifest.webmanifest + public/icons/ (PWA/iOS)
```

**Dependency injection:** `src/infrastructure/di/container.js` wires every repository to every use case and exports a single `container` object. Pages import from `container`, never from repos or use cases directly.

**Persistence:** Everything is in `localStorage` — no database. Media is stored as data URLs (images/video). The backend is stateless (OAuth tokens are in-process memory, lost on restart).

## iOS / PWA layer

Pato installs to the iPhone home screen and runs standalone. There is no native
wrapper (no Capacitor, no Xcode project) — the native feel is built from web
primitives.

| Piece | Where | Notes |
|---|---|---|
| Install manifest | `public/manifest.webmanifest` | `display: standalone`, shortcuts, maskable icon |
| Icons + splash | `public/icons/` | 180/192/512 icons, 9 iPhone splash screens; regenerate with `python3 scripts/generate-icons.py` (no dependencies, takes a few minutes) |
| iOS meta tags | `index.html` | standalone, app title, status bar style, `format-detection` |
| Offline | `public/sw.js` + `src/infrastructure/pwa/` | network-first shell, cache-first hashed assets, API never cached |
| Bottom tab bar | `src/presentation/components/TabBar.jsx` | mobile only; 5th tab opens the sidebar for the remaining sections |
| Touch behavior | `src/presentation/styles/index.css` | no rubber-band, no tap highlight, no double-tap zoom, 16px inputs on coarse pointers |
| Standalone + haptics | `src/presentation/hooks/` | `useStandalone`, `useHaptics` |

Deliberate constraints:

- **Status bar is `default`, not `black-translucent`.** Translucent forces white
  status-bar text, unreadable over the cream palette. Revisit if a dark theme lands.
- **Pinch-zoom stays enabled** for accessibility; only double-tap zoom and
  focus-zoom are suppressed.
- **Haptics are best-effort.** `navigator.vibrate` covers Android; iOS uses the
  `<input switch>` trick (iOS 17.4+) and silently no-ops otherwise.
- **Splash screens are portrait-only** and cover iPhone X through 16 Pro Max.

## Design system

One system, defined once in `src/presentation/styles/index.css` as CSS custom
properties on `:root` (surfaces, glass levels, shadows, safe areas, iOS easing).

- Surfaces use `.glass` / `.glass-2` / `.glass-3` or the `GlassPanel` component.
- Module screens use `ModuleHeader` (duck icon + eyebrow + display title).
- Primary action: `bg-pato-coral text-white`, hover `bg-pato-terra`.
- Text: `pato-charcoal` primary, `pato-smoke` secondary.
- The tokens `cream`, `butter`, `honey`, `peach`, `blush`, `sage`, `ink`, `muted`
  in `tailwind.config.js` are **deprecated** — they belong to the pre-redesign
  opaque palette. Do not use them in new code; the file lists the equivalences.
- The Layout owns bottom spacing (tab bar + safe area). Pages should not add
  their own tab-bar clearance.
- Never use `100vh` / `min-h-screen`: iOS measures it with the toolbar hidden.
  Use `dvh`, or nothing when the Layout already reserves the height.

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
