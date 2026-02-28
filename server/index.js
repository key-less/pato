import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// En Railway/Render el tráfico llega por HTTPS mediante proxy; sin esto req.protocol sería 'http'
// y Spotify rechazaría el redirect_uri (debe coincidir con https en el Dashboard).
app.set('trust proxy', 1)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

// Rate limiting: evita abuso (correos masivos, peticiones excesivas al API)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { ok: false, error: 'Demasiadas peticiones. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', apiLimiter)

// Límite más estricto para envío de correo
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Límite de envíos por minuto. Espera un poco.' },
})
app.use('/api/send-email', emailLimiter)

// Health check para plataformas de despliegue (Railway, Render, etc.)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pato-api' })
})

const gmailUser = (process.env.GMAIL_USER || '').trim()
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s/g, '')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
})

// ytmusicapi (Python): obtener playlist por browser.json. Devuelve null si no hay credenciales o falla.
async function fetchPlaylistViaYtmusicapi(url) {
  const ytmusicDir = path.join(__dirname, 'ytmusicapi')
  const browserJson = process.env.YTMUSIC_BROWSER_JSON || path.join(ytmusicDir, 'browser.json')
  const fs = await import('fs')
  try {
    if (!fs.existsSync(browserJson)) return null
  } catch {
    return null
  }
  const scriptPath = path.join(ytmusicDir, 'fetch_playlist.py')
  if (!fs.existsSync(scriptPath)) return null

  return new Promise((resolve) => {
    const py = spawn('python', [scriptPath, url], {
      cwd: ytmusicDir,
      env: { ...process.env, YTMUSIC_BROWSER_JSON: browserJson },
    })
    let stdout = ''
    let stderr = ''
    py.stdout.on('data', (d) => { stdout += d })
    py.stderr.on('data', (d) => { stderr += d })
    py.on('close', (code) => {
      if (code !== 0) {
        resolve(null)
        return
      }
      try {
        const data = JSON.parse(stdout.trim())
        if (data.ok && data.name) resolve(data)
        else resolve(null)
      } catch {
        resolve(null)
      }
    })
    py.on('error', () => resolve(null))
  })
}

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text } = req.body || {}

  if (!gmailUser || !gmailAppPassword) {
    return res.status(503).json({
      ok: false,
      error: 'Servidor sin configurar: faltan GMAIL_USER y GMAIL_APP_PASSWORD en .env',
    })
  }

  if (!to || typeof to !== 'string' || !to.trim()) {
    return res.status(400).json({ ok: false, error: 'Falta el correo del destinatario (to).' })
  }

  const mailOptions = {
    from: gmailUser,
    to: to.trim(),
    subject: typeof subject === 'string' ? subject : '(Sin asunto)',
    text: typeof text === 'string' ? text : '',
  }

  try {
    await transporter.sendMail(mailOptions)
    return res.json({ ok: true })
  } catch (err) {
    console.error('Send email error:', err.message)
    return res.status(500).json({
      ok: false,
      error: err.message || 'No se pudo enviar el correo.',
    })
  }
})

// --- Spotify: token con Client Credentials ---
let spotifyToken = null
async function getSpotifyToken() {
  const id = (process.env.SPOTIFY_CLIENT_ID || '').trim()
  const secret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim()
  if (!id || !secret) return null
  if (spotifyToken && spotifyToken.expires_at > Date.now()) return spotifyToken.access_token
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  }).catch((e) => {
    console.warn('Spotify token request failed:', e.message)
    return null
  })
  if (!res?.ok) {
    const errBody = await res?.text().catch(() => '')
    console.warn('Spotify token error:', res?.status, errBody)
    return null
  }
  const data = await res.json()
  spotifyToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in - 60) * 1000 }
  return spotifyToken.access_token
}

// --- Playlist: obtener datos por URL (Spotify o YouTube) ---
app.get('/api/playlist/fetch', async (req, res) => {
  const url = (req.query.url || '').trim()
  if (!url) return res.status(400).json({ ok: false, error: 'Falta el parámetro url.' })

  try {
    if (url.includes('spotify.com') && url.includes('playlist')) {
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/)
      const id = match ? match[1] : null
      if (!id) return res.status(400).json({ ok: false, error: 'URL de Spotify no válida.' })
      const token = await getSpotifyToken()
      if (!token) {
        console.warn('Playlist fetch: Spotify token no obtenido. Revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en Railway.')
        return res.status(503).json({ ok: false, error: 'Spotify no configurado en el servidor. Revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en Railway.' })
      }
      const spRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!spRes.ok) {
        const err = await spRes.json().catch(() => ({}))
        const msg = err.error?.message || ''
        console.warn('Playlist fetch Spotify:', spRes.status, msg || spRes.statusText)
        const friendlyMsg = spRes.status === 404 || /not found|resource not found/i.test(msg)
          ? 'Playlist no encontrada. Comprueba que el enlace sea correcto y que la playlist sea pública en Spotify.'
          : (msg || 'Playlist no encontrada.')
        return res.status(spRes.status).json({ ok: false, error: friendlyMsg })
      }
      const playlist = await spRes.json()
      const image = playlist.images?.[0]?.url ?? null
      return res.json({
        ok: true,
        platform: 'spotify',
        name: playlist.name,
        createdBy: playlist.owner?.display_name ?? '',
        imageUrl: image,
      })
    }

    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com')) {
      const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/)
      const id = listMatch ? listMatch[1] : null
      if (!id) return res.status(400).json({ ok: false, error: 'URL de YouTube/YouTube Music no contiene list=...' })

      // Intentar ytmusicapi (browser.json) para YouTube Music; si falla, usar YouTube Data API
      const ytmusicResult = await fetchPlaylistViaYtmusicapi(url)
      if (ytmusicResult) {
        return res.json(ytmusicResult)
      }

      const apiKey = (process.env.YOUTUBE_API_KEY || '').trim()
      if (!apiKey) return res.status(503).json({ ok: false, error: 'Configura YOUTUBE_API_KEY en .env o añade server/ytmusicapi/browser.json para YouTube Music (ytmusicapi).' })
      // YouTube Data API v3: GET playlists con key (doc: https://developers.google.com/youtube/v3/docs/playlists/list)
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(id)}&key=${encodeURIComponent(apiKey)}`
      )
      const data = await ytRes.json().catch(() => ({}))
      if (!ytRes.ok) {
        const msg = data.error?.message || data.error?.errors?.[0]?.reason || 'Error al consultar YouTube.'
        const friendly = ytRes.status === 401
          ? 'Clave de API inválida o YouTube Data API v3 no habilitada. En Cloud Console: Credenciales → Clave de API (tipo AIzaSy...) y Biblioteca → habilitar "YouTube Data API v3".'
          : msg
        return res.status(ytRes.status).json({ ok: false, error: friendly })
      }
      const item = data.items?.[0]
      if (!item) return res.status(404).json({ ok: false, error: 'Playlist no encontrada.' })
      const thumb = item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url
      return res.json({
        ok: true,
        platform: 'youtube',
        name: item.snippet?.title ?? 'Playlist',
        createdBy: item.snippet?.channelTitle ?? '',
        imageUrl: thumb ?? null,
      })
    }

    return res.status(400).json({ ok: false, error: 'URL debe ser de Spotify (playlist) o YouTube/YouTube Music (list=...).' })
  } catch (err) {
    console.error('Playlist fetch error:', err.message)
    return res.status(500).json({ ok: false, error: err.message || 'Error al obtener la playlist.' })
  }
})

// --- Spotify OAuth 2.0: tokens por perfil (0 = Yo, 1 = Pareja) ---
let spotifyAuthState = null
const spotifyUserTokensByProfile = { 0: null, 1: null }

function getSpotifyOAuthConfig(req) {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim()
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim()
  const explicitRedirect = (process.env.SPOTIFY_REDIRECT_URI || '').trim()
  const explicitFrontend = (process.env.FRONTEND_URL || '').trim()
  let redirectUri
  let frontendUrl
  const hostHeader = req && req.get && req.get('Host')
  const isLocalHost = hostHeader && (/^localhost(:\d+)?$/i.test(hostHeader) || hostHeader.indexOf('127.0.0.1') === 0)
  if (hostHeader && !isLocalHost) {
    const protocol = (req.protocol || 'http') + '://'
    redirectUri = explicitRedirect || (protocol + hostHeader + '/api/spotify/callback').replace(/localhost/i, '127.0.0.1')
    frontendUrl = explicitFrontend || (protocol + hostHeader.split(':')[0] + ':5173')
  } else {
    redirectUri = explicitRedirect || `http://127.0.0.1:${PORT}/api/spotify/callback`
    redirectUri = redirectUri.replace(/(https?:\/\/)localhost(\/|:|\?|$)/i, '$1127.0.0.1$2')
    frontendUrl = explicitFrontend || 'http://localhost:5173'
  }
  return { clientId, clientSecret, redirectUri, frontendUrl }
}

// 1. Iniciar flujo OAuth: ?profile=0 (Yo) o profile=1 (Pareja)
app.get('/api/spotify/auth', (req, res) => {
  const profileIndex = Math.max(0, parseInt(req.query.profile, 10) || 0)
  if (profileIndex !== 0 && profileIndex !== 1) {
    return res.status(400).json({ ok: false, error: 'profile debe ser 0 o 1' })
  }
  const { clientId, redirectUri } = getSpotifyOAuthConfig(req)
  if (!clientId) {
    return res.status(503).json({ ok: false, error: 'Configura SPOTIFY_CLIENT_ID y SPOTIFY_REDIRECT_URI en .env' })
  }
  const nonce = Buffer.from(Date.now().toString(36) + Math.random().toString(36)).toString('base64url')
  const state = Buffer.from(JSON.stringify({ nonce, profileIndex })).toString('base64url')
  spotifyAuthState = { state, profileIndex }
  const scope = 'user-read-currently-playing user-read-playback-state'
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  res.redirect(url.toString())
})

// 2. Callback: guarda tokens en el perfil correspondiente
app.get('/api/spotify/callback', async (req, res) => {
  const { code, state, error } = req.query
  const { clientId, clientSecret, redirectUri, frontendUrl } = getSpotifyOAuthConfig(req)

  if (error) {
    return res.redirect(frontendUrl + '?spotify_error=' + encodeURIComponent(error))
  }
  let profileIndex = 0
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
      if (decoded.profileIndex === 0 || decoded.profileIndex === 1) profileIndex = decoded.profileIndex
    } catch {}
    if (spotifyAuthState && state !== spotifyAuthState.state) {
      spotifyAuthState = null
      return res.redirect(frontendUrl + '?spotify_error=invalid_callback')
    }
  }
  spotifyAuthState = null

  if (!code) {
    return res.redirect(frontendUrl + '?spotify_error=invalid_callback')
  }
  if (!clientId || !clientSecret) {
    return res.redirect(frontendUrl + '?spotify_error=server_not_configured')
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}))
      return res.redirect(frontendUrl + '?spotify_error=' + encodeURIComponent(err.error_description || tokenRes.statusText))
    }

    const data = await tokenRes.json()
    spotifyUserTokensByProfile[profileIndex] = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in - 60) * 1000,
    }
    res.redirect(frontendUrl + '?spotify=connected&profile=' + profileIndex)
  } catch (err) {
    console.error('Spotify callback error:', err.message)
    res.redirect(frontendUrl + '?spotify_error=' + encodeURIComponent(err.message))
  }
})

async function getSpotifyUserAccessToken(profileIndex) {
  const tokens = spotifyUserTokensByProfile[profileIndex]
  if (!tokens?.refresh_token) return null
  const { clientId, clientSecret } = getSpotifyOAuthConfig()
  if (!clientId || !clientSecret) return null

  if (tokens.expires_at > Date.now()) {
    return tokens.access_token
  }

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    spotifyUserTokensByProfile[profileIndex] = {
      ...tokens,
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in - 60) * 1000,
    }
    return spotifyUserTokensByProfile[profileIndex].access_token
  } catch {
    return null
  }
}

// 3. Now playing por perfil: devuelve { profiles: [ { profileIndex, track } ] }
app.get('/api/now-playing/spotify', async (req, res) => {
  const profiles = []
  for (const profileIndex of [0, 1]) {
    const token = await getSpotifyUserAccessToken(profileIndex)
    if (!token) {
      profiles.push({ profileIndex, track: null, error: 'not_connected' })
      continue
    }
    try {
      const spRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (spRes.status === 204 || !spRes.ok) {
        profiles.push({ profileIndex, track: null, connected: true })
        continue
      }
      const data = await spRes.json()
      const item = data.item
      if (!item) {
        profiles.push({ profileIndex, track: null, connected: true })
        continue
      }
      const artist = item.artists?.map((a) => a.name).join(', ') || ''
      const imageUrl = item.album?.images?.[0]?.url ?? null
      profiles.push({
        profileIndex,
        track: { name: item.name, artist, imageUrl },
        connected: true,
      })
    } catch (err) {
      console.error('Now playing error (profile ' + profileIndex + '):', err.message)
      profiles.push({ profileIndex, track: null, error: err.message, connected: true })
    }
  }
  return res.json({ ok: true, profiles })
})

app.get('/api/now-playing/youtube', async (req, res) => {
  const msg = 'YouTube Music no tiene API pública para «ahora suena».'
  const hasToken = !!(await getYoutubeUserAccessToken())
  res.json({
    ok: true,
    profiles: [
      { profileIndex: 0, track: null, error: hasToken ? null : msg, connected: hasToken },
      { profileIndex: 1, track: null, error: hasToken ? null : msg, connected: hasToken },
    ],
  })
})

// --- YouTube OAuth 2.0 (redirect URI + flujo igual que Spotify) ---
let youtubeAuthState = null
let youtubeUserTokens = null

function getYoutubeOAuthConfig(req) {
  const clientId = (process.env.YOUTUBE_CLIENT_ID || '').trim()
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET || '').trim()
  let redirectUri
  let frontendUrl
  const hostHeader = req && req.get && req.get('Host')
  const isLocalHost = hostHeader && (/^localhost(:\d+)?$/i.test(hostHeader) || hostHeader.indexOf('127.0.0.1') === 0)
  if (hostHeader && !isLocalHost) {
    const protocol = (req.protocol || 'http') + '://'
    redirectUri = (protocol + hostHeader + '/api/youtube/callback').replace(/localhost/i, '127.0.0.1')
    frontendUrl = process.env.FRONTEND_URL || (protocol + hostHeader.split(':')[0] + ':5173')
  } else {
    redirectUri = (process.env.YOUTUBE_REDIRECT_URI || '').trim() || `http://127.0.0.1:${PORT}/api/youtube/callback`
    redirectUri = redirectUri.replace(/(https?:\/\/)localhost(\/|:|\?|$)/i, '$1127.0.0.1$2')
    frontendUrl = (process.env.FRONTEND_URL || '').trim() || 'http://localhost:5173'
  }
  return { clientId, clientSecret, redirectUri, frontendUrl }
}

// Scopes para YouTube Data API v3 (lectura de playlists, canal, etc.)
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

// 1. Iniciar OAuth: redirigir a Google
app.get('/api/youtube/auth', (req, res) => {
  const { clientId, redirectUri } = getYoutubeOAuthConfig(req)
  if (!clientId) {
    return res.status(503).json({ ok: false, error: 'Configura YOUTUBE_CLIENT_ID y YOUTUBE_REDIRECT_URI en .env' })
  }
  const state = Buffer.from(Date.now().toString(36) + Math.random().toString(36)).toString('base64url')
  youtubeAuthState = state
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', YOUTUBE_SCOPES)
  url.searchParams.set('state', state)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  res.redirect(url.toString())
})

// 2. Callback: Google redirige aquí con ?code=...&state=...
app.get('/api/youtube/callback', async (req, res) => {
  const { code, state, error } = req.query
  const { clientId, clientSecret, redirectUri, frontendUrl } = getYoutubeOAuthConfig(req)

  if (error) {
    return res.redirect(frontendUrl + '?youtube_error=' + encodeURIComponent(error))
  }
  if (!code || state !== youtubeAuthState) {
    return res.redirect(frontendUrl + '?youtube_error=invalid_callback')
  }
  youtubeAuthState = null

  if (!clientId || !clientSecret) {
    return res.redirect(frontendUrl + '?youtube_error=server_not_configured')
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}))
      return res.redirect(frontendUrl + '?youtube_error=' + encodeURIComponent(err.error_description || tokenRes.statusText))
    }

    const data = await tokenRes.json()
    youtubeUserTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || youtubeUserTokens?.refresh_token,
      expires_at: data.expires_in ? Date.now() + (data.expires_in - 60) * 1000 : Date.now() + 3600 * 1000,
    }
    res.redirect(frontendUrl + '?youtube=connected')
  } catch (err) {
    console.error('YouTube callback error:', err.message)
    res.redirect(frontendUrl + '?youtube_error=' + encodeURIComponent(err.message))
  }
})

// Opcional: obtener access_token válido (refrescar si expiró)
async function getYoutubeUserAccessToken() {
  if (!youtubeUserTokens?.refresh_token) return null
  const { clientId, clientSecret } = getYoutubeOAuthConfig()
  if (!clientId || !clientSecret) return null

  if (youtubeUserTokens.expires_at > Date.now()) {
    return youtubeUserTokens.access_token
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: youtubeUserTokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    youtubeUserTokens = {
      ...youtubeUserTokens,
      access_token: data.access_token,
      expires_at: data.expires_in ? Date.now() + (data.expires_in - 60) * 1000 : Date.now() + 3600 * 1000,
    }
    return youtubeUserTokens.access_token
  } catch {
    return null
  }
}

// Ruta de ejemplo: comprobar si YouTube está conectado (para el front)
app.get('/api/youtube/me', async (req, res) => {
  const token = await getYoutubeUserAccessToken()
  if (!token) {
    return res.json({ ok: false, error: 'not_connected' })
  }
  try {
    const meRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!meRes.ok) return res.json({ ok: false, error: 'api_error' })
    const data = await meRes.json()
    const channel = data.items?.[0]
    return res.json({
      ok: true,
      channel: channel ? { id: channel.id, title: channel.snippet?.title, thumb: channel.snippet?.thumbnails?.default?.url } : null,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
})

// Validación al arrancar: qué integraciones están disponibles (útil en producción)
function logIntegrations() {
  const gmail = !!(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim())
  const spotify = !!(process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim())
  const youtube = !!(process.env.YOUTUBE_CLIENT_ID?.trim() && process.env.YOUTUBE_CLIENT_SECRET?.trim())
  const youtubeApiKey = !!process.env.YOUTUBE_API_KEY?.trim()
  console.log('Integraciones:', {
    Gmail: gmail ? 'ok' : 'no configurado',
    Spotify: spotify ? 'ok' : 'no configurado',
    YouTube_OAuth: youtube ? 'ok' : 'no configurado',
    YouTube_API_key: youtubeApiKey ? 'ok' : 'no configurado',
  })
}

const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`Pato API escuchando en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  logIntegrations()
  if (HOST === '0.0.0.0') {
    console.log('  (Accesible en la red local; en el móvil usa la IP de esta PC y el puerto', PORT + ')')
  }
})
