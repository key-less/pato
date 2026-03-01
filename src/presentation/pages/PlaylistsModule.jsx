import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { fetchPlaylistByUrl } from '../../infrastructure/api/playlistApi.js'
import { LOGO_DUCK } from '../config/assets.js'

export function PlaylistsModule() {
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
    setPlaylists(await container.getPlaylists())
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Quitar esta playlist?')) return
    await container.removePlaylist(id)
    setPlaylists(await container.getPlaylists())
  }

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Playlists</h1>
      </header>

      <p className="text-pato-muted mb-6">
        Pega el enlace de una playlist de Spotify o YouTube Music. Se creará un recuadro con nombre, autor e imagen.
      </p>

      <form onSubmit={handleAdd} className="mb-8 flex flex-wrap gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/... o YouTube Music"
          className="flex-1 min-w-[200px] rounded-xl border border-pato-honey bg-white/95 px-4 py-2 text-pato-ink placeholder-pato-muted"
        />
        <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-pato-peach text-pato-ink font-medium disabled:opacity-60">
          {loading ? 'Buscando…' : 'Agregar playlist'}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 bg-pato-rose/50 text-pato-ink text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map((p) => (
          <div key={p.id} className="bg-pato-butter/90 rounded-xl overflow-hidden border border-pato-honey/60 shadow-sm">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-pato-honey/30">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pato-muted text-4xl">
                  {p.platform === 'spotify' ? '\u266B' : '\u25B6'}
                </div>
              )}
            </a>
            <div className="p-3">
              <p className="font-medium text-pato-ink text-sm line-clamp-2">{p.name || 'Playlist'}</p>
              {p.createdBy && <p className="text-xs text-pato-muted mt-0.5">{p.createdBy}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-pato-honey/50 text-pato-muted capitalize">{p.platform}</span>
                <button type="button" onClick={() => handleRemove(p.id)} className="text-xs text-pato-muted hover:text-pato-ink">
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <p className="text-pato-muted text-center py-12">Aún no hay playlists. Agrega una con el enlace de arriba.</p>
      )}
    </div>
  )
}
