import { useState, useEffect, useMemo } from 'react'
import { fetchNowPlayingByProfiles, API_BASE } from '../../infrastructure/api/playlistApi.js'
import { container } from '../../infrastructure/di/container.js'

const PROFILE_LABELS = ['Yo', 'Pareja']

const APPS = {
  spotify: {
    title: 'Spotify',
    color: '#1DB954',
    borderColor: 'rgba(29, 185, 84, 0.5)',
    bgColor: 'rgba(29, 185, 84, 0.12)',
    connectLabel: 'Conectar Spotify',
    authPath: 'spotify',
    notAvailableMessage: null,
  },
  youtube: {
    title: 'YouTube Music',
    color: '#FF0000',
    borderColor: 'rgba(255, 0, 0, 0.45)',
    bgColor: 'rgba(255, 0, 0, 0.08)',
    connectLabel: 'Conectar YouTube',
    authPath: 'youtube',
    notAvailableMessage: 'YouTube Music no tiene API pública para «ahora suena». Conecta tu cuenta para usar la API.',
  },
}

function SpotifyIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function YoutubeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function ChevronLeftIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function isServiceRelevant(profiles) {
  if (!Array.isArray(profiles) || profiles.length === 0) return false
  return profiles.some((p) => p.connected || (p.track && p.track.name))
}

export function NowPlayingWidget() {
  const [spotifyProfiles, setSpotifyProfiles] = useState([])
  const [youtubeProfiles, setYoutubeProfiles] = useState([])
  const [partnerProfiles, setPartnerProfiles] = useState([null, null])
  const [loading, setLoading] = useState({ spotify: false, youtube: false })
  const [expanded, setExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState('spotify')

  useEffect(() => {
    if (!API_BASE) return
    container.getPartnerProfiles().then(setPartnerProfiles)
  }, [])

  const loadSpotify = () => {
    if (!API_BASE) return
    setLoading((p) => ({ ...p, spotify: true }))
    fetchNowPlayingByProfiles('spotify')
      .then((data) => setSpotifyProfiles(data.ok && Array.isArray(data.profiles) ? data.profiles : []))
      .finally(() => setLoading((p) => ({ ...p, spotify: false })))
  }

  const loadYoutube = () => {
    if (!API_BASE) return
    setLoading((p) => ({ ...p, youtube: true }))
    fetchNowPlayingByProfiles('youtube')
      .then((data) => setYoutubeProfiles(data.ok && Array.isArray(data.profiles) ? data.profiles : []))
      .finally(() => setLoading((p) => ({ ...p, youtube: false })))
  }

  useEffect(() => {
    if (!API_BASE) return
    loadSpotify()
    loadYoutube()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('spotify') === 'connected') {
      setActiveSection('spotify')
      setExpanded(true)
      loadSpotify()
      params.delete('spotify')
      if (params.has('profile')) params.delete('profile')
      const newSearch = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : ''))
    }
    if (params.get('spotify_error')) {
      params.delete('spotify_error')
      const newSearch = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : ''))
    }
    if (params.get('youtube') === 'connected') {
      setActiveSection('youtube')
      setExpanded(true)
      loadYoutube()
      params.delete('youtube')
      const newSearch = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : ''))
    }
    if (params.get('youtube_error')) {
      params.delete('youtube_error')
      const newSearch = params.toString()
      window.history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : ''))
    }
  }, [])

  const visibleSections = useMemo(() => {
    const list = []
    if (loading.spotify || isServiceRelevant(spotifyProfiles)) list.push('spotify')
    if (loading.youtube || isServiceRelevant(youtubeProfiles)) list.push('youtube')
    return list
  }, [loading.spotify, loading.youtube, spotifyProfiles, youtubeProfiles])

  const effectiveActive = visibleSections.includes(activeSection) ? activeSection : visibleSections[0] || 'spotify'

  if (!API_BASE) return null

  const hasAnySection = visibleSections.length > 0

  if (!hasAnySection) return null

  const openPanel = (service) => {
    setActiveSection(service)
    setExpanded(true)
  }

  if (!expanded) {
    return (
      <div
        className="fixed z-20 flex flex-col gap-1 rounded-l-lg overflow-hidden border border-pato-honey/60 border-r-0 bg-pato-butter/95 p-1.5 shadow-md"
        style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))', right: 0 }}
      >
        {visibleSections.includes('spotify') && (
          <button
            type="button"
            onClick={() => openPanel('spotify')}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-pato-honey/40 transition-colors"
            style={{ color: APPS.spotify.color }}
            title="Ver qué suena en Spotify"
            aria-label="Abrir Spotify — Ahora suena"
          >
            <SpotifyIcon className="w-6 h-6" />
          </button>
        )}
        {visibleSections.includes('youtube') && (
          <button
            type="button"
            onClick={() => openPanel('youtube')}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-pato-honey/40 transition-colors"
            style={{ color: APPS.youtube.color }}
            title="Ver qué suena en YouTube Music"
            aria-label="Abrir YouTube Music — Ahora suena"
          >
            <YoutubeIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed z-20 flex flex-col w-52 sm:w-56 max-w-[calc(100vw-6rem)] rounded-l-xl overflow-hidden border border-pato-honey/60 border-r-0 shadow-lg bg-pato-butter/95"
      style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))', right: 0 }}
    >
      <div className="flex items-center gap-0 border-b border-pato-honey/40 p-1 bg-white/30">
        {visibleSections.includes('spotify') && (
          <button
            type="button"
            onClick={() => setActiveSection('spotify')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${effectiveActive === 'spotify' ? 'bg-pato-sage/40 text-pato-ink' : 'text-pato-muted hover:bg-pato-honey/30'}`}
            style={effectiveActive === 'spotify' ? { color: APPS.spotify.color } : {}}
            title="Spotify"
          >
            <SpotifyIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Spotify</span>
          </button>
        )}
        {visibleSections.includes('youtube') && (
          <button
            type="button"
            onClick={() => setActiveSection('youtube')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${effectiveActive === 'youtube' ? 'bg-pato-sage/40 text-pato-ink' : 'text-pato-muted hover:bg-pato-honey/30'}`}
            style={effectiveActive === 'youtube' ? { color: APPS.youtube.color } : {}}
            title="YouTube Music"
          >
            <YoutubeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">YouTube</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 text-pato-ink hover:bg-pato-peach transition-colors"
          aria-label="Cerrar panel"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 p-3">
        {effectiveActive === 'spotify' && (
          <NowPlayingSection
            appKey="spotify"
            app={APPS.spotify}
            loading={loading.spotify}
            profiles={spotifyProfiles}
            partnerProfiles={partnerProfiles}
            authUrlBase={`${API_BASE}/api/spotify/auth`}
            Icon={SpotifyIcon}
          />
        )}
        {effectiveActive === 'youtube' && (
          <NowPlayingSection
            appKey="youtube"
            app={APPS.youtube}
            loading={loading.youtube}
            profiles={youtubeProfiles}
            partnerProfiles={partnerProfiles}
            authUrlBase={`${API_BASE}/api/youtube/auth`}
            Icon={YoutubeIcon}
          />
        )}
      </div>
    </div>
  )
}

function NowPlayingSection({ appKey, app, loading, profiles, partnerProfiles, authUrlBase, Icon }) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-3 border shadow-md"
        style={{ backgroundColor: app.bgColor, borderColor: app.borderColor }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: app.color }}>
            <Icon className="w-4 h-4" />
          </span>
          <p className="text-xs font-medium uppercase" style={{ color: app.color }}>
            {app.title}
          </p>
        </div>
        <p className="text-sm text-pato-muted">Cargando…</p>
      </div>
    )
  }

  const list = Array.isArray(profiles) && profiles.length >= 2 ? profiles : [
    { profileIndex: 0, track: null, error: 'not_connected' },
    { profileIndex: 1, track: null, error: 'not_connected' },
  ]

  return (
    <div
      className="rounded-xl p-3 border shadow-md"
      style={{ backgroundColor: app.bgColor, borderColor: app.borderColor }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: app.color }}>
          <Icon className="w-4 h-4" />
        </span>
        <p className="text-xs font-medium uppercase" style={{ color: app.color }}>
          {app.title}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {list.map(({ profileIndex, track, error, connected }) => {
          const label = PROFILE_LABELS[profileIndex] ?? 'Perfil ' + (profileIndex + 1)
          const partner = partnerProfiles[profileIndex]
          const displayName = partner?.nombre ? [partner.nombre, partner.apellido].filter(Boolean).join(' ') : label
          const photoUrl = partner?.profilePhotoUrl

          if (track) {
            return (
              <div key={profileIndex} className="flex gap-2 items-start rounded-lg bg-white/60 p-2 border border-pato-honey/40">
                {photoUrl && (
                  <img src={photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-pato-ink truncate">{displayName}</p>
                  <p className="text-xs font-medium text-pato-ink truncate">{track.name}</p>
                  <p className="text-xs text-pato-muted truncate">{track.artist}</p>
                  {track.imageUrl && (
                    <img src={track.imageUrl} alt="" className="mt-1 w-10 h-10 rounded object-cover" />
                  )}
                </div>
              </div>
            )
          }

          if (connected && !track) {
            return (
              <div key={profileIndex} className="flex gap-2 items-center rounded-lg bg-white/60 p-2 border border-pato-honey/40">
                {photoUrl && (
                  <img src={photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-pato-ink">{displayName}</p>
                  <p className="text-xs text-pato-sage">Cuenta conectada</p>
                </div>
              </div>
            )
          }

          if (error === 'not_connected' && authUrlBase) {
            const authHref = appKey === 'spotify' ? `${authUrlBase}?profile=${profileIndex}` : authUrlBase
            return (
              <div key={profileIndex} className="flex gap-2 items-center rounded-lg bg-white/50 p-2">
                {photoUrl && (
                  <img src={photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-pato-ink">{displayName}</p>
                  <a
                    href={authHref}
                    className="text-xs font-medium hover:underline"
                    style={{ color: app.color }}
                  >
                    {app.connectLabel}
                  </a>
                </div>
              </div>
            )
          }

          return (
            <div key={profileIndex} className="flex gap-2 items-center rounded-lg bg-white/50 p-2">
              {photoUrl && (
                <img src={photoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-pato-ink">{displayName}</p>
                <p className="text-xs text-pato-muted">
                  {app.notAvailableMessage ?? 'Nada reproduciendo'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
