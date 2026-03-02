import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { API_BASE } from '../../infrastructure/api/playlistApi.js'
import { LOGO_DUCK } from '../config/assets.js'

const LABELS = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  fechaNacimiento: 'Fecha de nacimiento',
  colorFavorito: 'Color favorito',
  comidaFavorita: 'Comida favorita',
  loQueMasLeEncantaDelOtro: 'Lo que más le encanta del otro',
  lugarFavorito: 'Lugar favorito',
  deporteFavorito: 'Deporte favorito',
  queLosHaceUnicos: 'Qué es lo que los hace únicos',
  profilePhotoUrl: 'Foto de perfil',
}

const FIELDS = Object.keys(LABELS).filter((k) => k !== 'profilePhotoUrl')

export default function PartnerProfileModule() {
  const [profiles, setProfiles] = useState([null, null])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    container.getPartnerProfiles().then(setProfiles)
  }, [])

  const handleSave = async (index, data) => {
    const existing = profiles[index]
    await container.savePartnerProfile({ ...data, id: existing?.id }, index)
    setProfiles(await container.getPartnerProfiles())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async (index) => {
    await container.clearPartnerProfile(index)
    setProfiles(await container.getPartnerProfiles())
  }

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Perfil de la pareja</h1>
      </header>

      <p className="text-pato-muted mb-8">
        Completa los datos de cada uno. Al final de la página verás un resumen tipo perfil.
      </p>

      {saved && (
        <div className="mb-4 rounded-xl px-4 py-2 bg-pato-sage/50 text-pato-ink text-sm">
          Guardado correctamente.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <ProfileCard
          title="Yo"
          index={0}
          profile={profiles[0]}
          onSave={(data) => handleSave(0, data)}
          onReset={() => handleReset(0)}
          apiBase={API_BASE}
        />
        <ProfileCard
          title="Pareja"
          index={1}
          profile={profiles[1]}
          onSave={(data) => handleSave(1, data)}
          onReset={() => handleReset(1)}
          apiBase={API_BASE}
        />
      </div>

      <section className="mt-16 pt-10 border-t border-pato-honey/60">
        <h2 className="font-display text-xl font-semibold text-pato-ink mb-6 text-center">
          Resumen de perfiles
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ProfileSummary title="Yo" index={0} profile={profiles[0]} onClear={() => handleReset(0)} />
          <ProfileSummary title="Pareja" index={1} profile={profiles[1]} onClear={() => handleReset(1)} />
        </div>
      </section>
    </div>
  )
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

const EMPTY_FORM = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  colorFavorito: '',
  comidaFavorita: '',
  loQueMasLeEncantaDelOtro: '',
  lugarFavorito: '',
  deporteFavorito: '',
  queLosHaceUnicos: '',
  profilePhotoUrl: '',
}

function ProfileCard({ title, index, profile, onSave, onReset, apiBase }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM }))
  useEffect(() => {
    if (profile) setForm((prev) => ({ ...prev, ...profile }))
    else setForm({ ...EMPTY_FORM })
  }, [profile])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await readFileAsDataURL(file)
      update('profilePhotoUrl', dataUrl)
    } catch {
      // ignore
    }
    e.target.value = ''
  }

  return (
    <div className="bg-pato-butter/90 rounded-2xl p-6 border border-pato-honey/60 shadow-sm">
      <h3 className="font-display font-medium text-pato-ink mb-4">{title}</h3>

      <div className="mb-4 flex flex-col items-center gap-2">
        <label className="block text-xs font-medium text-pato-muted mb-1">{LABELS.profilePhotoUrl}</label>
        {(form.profilePhotoUrl || profile?.profilePhotoUrl) ? (
          <div className="relative">
            <img
              src={form.profilePhotoUrl || profile?.profilePhotoUrl}
              alt={`Foto de ${title}`}
              className="w-24 h-24 rounded-full object-cover border-2 border-pato-honey/60"
            />
            <label className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-pato-coral text-white text-xs cursor-pointer shadow">
              <span>✎</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="w-20 h-20 rounded-full border-2 border-dashed border-pato-honey/60 flex items-center justify-center text-pato-muted text-2xl">+</span>
            <span className="text-xs text-pato-muted">Añadir foto</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        )}
      </div>

      <div className="space-y-3">
        {FIELDS.map((key) => (
          <div key={key}>
            <label className="block text-xs font-medium text-pato-muted mb-1">{LABELS[key]}</label>
            {key === 'loQueMasLeEncantaDelOtro' || key === 'queLosHaceUnicos' ? (
              <textarea
                value={form[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm placeholder-pato-muted resize-y"
                placeholder={LABELS[key]}
              />
            ) : (
              <input
                type={key === 'fechaNacimiento' ? 'date' : 'text'}
                value={form[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
                className="w-full rounded-xl border border-pato-honey bg-white/95 px-3 py-2 text-pato-ink text-sm placeholder-pato-muted"
                placeholder={LABELS[key]}
              />
            )}
          </div>
        ))}
      </div>
      {apiBase && (
        <div className="mt-4 pt-4 border-t border-pato-honey/50">
          <p className="text-xs font-medium text-pato-muted mb-2">Vincular música (Ahora suena)</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${apiBase}/api/spotify/auth?profile=${index}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1DB954]/20 text-[#1DB954] font-medium text-sm hover:bg-[#1DB954]/30 transition-colors"
            >
              <span aria-hidden>♫</span> Spotify
            </a>
            <a
              href={`${apiBase}/api/youtube/auth`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF0000]/20 text-[#FF0000] font-medium text-sm hover:bg-[#FF0000]/30 transition-colors"
            >
              <span aria-hidden>▶</span> YouTube Music
            </a>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          className="w-full py-2 rounded-xl bg-pato-sage/70 text-pato-ink font-medium text-sm"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => onReset?.()}
          className="w-full py-2 rounded-xl border border-pato-coral/60 text-pato-coral font-medium text-sm hover:bg-pato-coral/10"
        >
          Restablecer datos
        </button>
      </div>
    </div>
  )
}

function ProfileSummary({ title, index, profile, onClear }) {
  if (!profile || !profile.nombre) {
    return (
      <div className="bg-pato-butter/60 rounded-xl p-5 border border-pato-honey/40">
        <h4 className="font-medium text-pato-ink mb-2">{title}</h4>
        <p className="text-sm text-pato-muted">Sin datos aún.</p>
      </div>
    )
  }

  const items = [
    ['Nombre', [profile.nombre, profile.apellido].filter(Boolean).join(' ')],
    ['Fecha de nacimiento', profile.fechaNacimiento],
    ['Color favorito', profile.colorFavorito],
    ['Comida favorita', profile.comidaFavorita],
    ['Lugar favorito', profile.lugarFavorito],
    ['Deporte favorito', profile.deporteFavorito],
    ['Lo que más le encanta del otro', profile.loQueMasLeEncantaDelOtro],
    ['Qué los hace únicos', profile.queLosHaceUnicos],
  ].filter(([, v]) => v)

  return (
    <div className="bg-pato-butter/80 rounded-xl p-5 border border-pato-honey/50 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-display font-medium text-pato-ink">{title}</h4>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-pato-coral text-white text-xs font-medium hover:bg-pato-coral/90 transition-colors"
            title="Quitar datos de este perfil"
          >
            Quitar
          </button>
        )}
      </div>
      <div className="flex items-start gap-4">
        {profile.profilePhotoUrl && (
          <img
            src={profile.profilePhotoUrl}
            alt={title}
            className="w-14 h-14 rounded-full object-cover border border-pato-honey/50 flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <dl className="space-y-2 text-sm mt-0">
            {items.map(([label, value]) => (
              <div key={label}>
                <dt className="text-pato-muted">{label}</dt>
                <dd className="text-pato-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
