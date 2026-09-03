import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { fetchPlaylistByUrl } from '../../infrastructure/api/playlistApi.js'
import { DuckPlaylists } from '../components/icons/Ducks.jsx'
import GlassPanel, { glassStyle } from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

export default function PlaylistsModule() {
  const [playlists, setPlaylists] = useState([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    container.getPlaylists().then(setPlaylists)
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const link = url.trim()
    if (!link) return
    setLoading(true)
    setError(null)
    const result = await fetchPlaylistByUrl(link)
    setLoading(false)
    if (!result.ok) {
      const msg = (result.error && String(result.error).trim()) || `No se pudo obtener la playlist.${result.status ? ` (${result.status})` : ''}`
      setError(msg)
      return
    }
    await container.addPlaylist({
      platform: result.platform,
      url: link,
      name: result.name ?? 'Playlist',
      createdBy: result.createdBy ?? '',
      imageUrl: result.imageUrl ?? null,
    })
    setUrl('')
    await container.addActivityEvent({
      type: 'playlist_added',
      description: `Agregó la playlist "${result.name ?? 'Playlist'}" de ${result.platform === 'spotify' ? 'Spotify' : 'YouTube'}`,
    })
    setPlaylists(await container.getPlaylists())
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Quitar esta playlist?')) return
    await container.removePlaylist(id)
    await container.addActivityEvent({
      type: 'playlist_removed',
      description: 'Eliminó una playlist',
    })
    setPlaylists(await container.getPlaylists())
  }

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-6 px-4">
      <ModuleHeader
        icon={DuckPlaylists}
        eyebrow="Nuestra banda sonora"
        italic="Nuestras"
        title="playlists"
        description="Pega un enlace de Spotify o YouTube Music. Construyamos juntos la música que nos acompaña."
      />

      <form onSubmit={handleAdd} className="mb-8 flex flex-wrap gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/… o YouTube Music"
          className="flex-1 min-w-[200px] rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-pato-charcoal placeholder-pato-smoke font-body focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-pato-coral text-white font-body font-medium disabled:opacity-60 hover:bg-pato-terra transition-colors"
        >
          {loading ? 'Buscando…' : 'Agregar playlist'}
        </button>
      </form>

      {error && (
        <GlassPanel className="mb-4 px-4 py-3" style={{ borderColor: 'rgba(212,137,122,0.4)' }}>
          <p className="font-body text-sm text-pato-charcoal">{error}</p>
        </GlassPanel>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map((p) => (
          <GlassPanel key={p.id} className="overflow-hidden">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-pato-shell/40">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pato-smoke text-4xl">
                  {p.platform === 'spotify' ? '♫' : '▶'}
                </div>
              )}
            </a>
            <div className="p-3">
              <p className="font-body font-medium text-pato-charcoal text-sm line-clamp-2">{p.name || 'Playlist'}</p>
              {p.createdBy && <p className="font-body text-xs text-pato-smoke mt-0.5">{p.createdBy}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="font-body text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 text-pato-smoke">{p.platform}</span>
                <button type="button" onClick={() => handleRemove(p.id)} className="font-body text-xs text-pato-smoke hover:text-pato-coral transition-colors">
                  Quitar
                </button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>

      {playlists.length === 0 && (
        <p className="text-pato-smoke font-body italic text-center py-12">Aún no hay playlists. Agrega una con el enlace de arriba.</p>
      )}
    </div>
  )
}
