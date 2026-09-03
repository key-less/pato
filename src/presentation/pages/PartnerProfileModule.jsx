import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { API_BASE } from '../../infrastructure/api/playlistApi.js'
import { DuckProfile } from '../components/icons/Ducks.jsx'
import Panel from '../components/Panel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

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
    const label = index === 0 ? 'Yo' : 'Pareja'
    await container.addActivityEvent({
      type: 'profile_updated',
      description: `Actualizó el perfil de ${label}`,
    })
    window.dispatchEvent(new Event('pato:profile-updated'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async (index) => {
    await container.clearPartnerProfile(index)
    setProfiles(await container.getPartnerProfiles())
  }

  return (
    <div className="max-w-4xl mx-auto pt-14 pb-16 px-4">
      <ModuleHeader
        icon={DuckProfile}
        eyebrow="Quiénes somos"
        italic="Perfil"
        title="de la pareja"
        description="Completa los datos de cada uno. Al final verás un resumen tipo perfil."
      />

      {saved && (
        <Panel className="mb-6 px-4 py-2 text-center">
          <p className="font-body text-sm text-pato-charcoal">✓ Guardado correctamente.</p>
        </Panel>
      )}

      <div className="grid md:grid-cols-2 gap-6">
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

      <section className="mt-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          <h2 className="font-display text-2xl text-pato-charcoal tracking-tight"><span className="italic font-light">Resumen</span> de perfiles</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <ProfileSummary title="Yo" profile={profiles[0]} onClear={() => handleReset(0)} />
          <ProfileSummary title="Pareja" profile={profiles[1]} onClear={() => handleReset(1)} />
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
    <Panel className="p-6">
      <h3 className="font-display text-2xl text-pato-charcoal mb-5 text-center"><span className="italic font-light">{title}</span></h3>

      <div className="mb-5 flex flex-col items-center gap-2">
        {(form.profilePhotoUrl || profile?.profilePhotoUrl) ? (
          <div className="relative">
            <img
              src={form.profilePhotoUrl || profile?.profilePhotoUrl}
              alt={`Foto de ${title}`}
              className="w-24 h-24 rounded-full object-cover border-2 border-white/70 shadow-soft"
            />
            <label className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-pato-coral text-white text-xs cursor-pointer shadow-soft hover:bg-pato-terra transition-colors">
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
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <span className="w-20 h-20 rounded-full border-2 border-dashed border-white/70 bg-white/40 flex items-center justify-center text-pato-smoke text-2xl">+</span>
            <span className="font-body text-xs text-pato-smoke">Añadir foto</span>
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
            <label className="block font-body text-xs font-medium text-pato-smoke mb-1">{LABELS[key]}</label>
            {key === 'loQueMasLeEncantaDelOtro' || key === 'queLosHaceUnicos' ? (
              <textarea
                value={form[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal placeholder-pato-smoke resize-y focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
                placeholder={LABELS[key]}
              />
            ) : (
              <input
                type={key === 'fechaNacimiento' ? 'date' : 'text'}
                value={form[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
                className="w-full rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-sm font-body text-pato-charcoal placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
                placeholder={LABELS[key]}
              />
            )}
          </div>
        ))}
      </div>

      {apiBase && (
        <div className="mt-5 pt-4 border-t border-white/40">
          <p className="font-body text-xs font-medium text-pato-smoke mb-2">Vincular música (Ahora suena)</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${apiBase}/api/spotify/auth?profile=${index}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1DB954]/15 text-[#1DB954] font-body font-medium text-sm hover:bg-[#1DB954]/25 transition-colors"
            >
              <span aria-hidden>♫</span> Spotify
            </a>
            <a
              href={`${apiBase}/api/youtube/auth`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF0000]/15 text-[#FF0000] font-body font-medium text-sm hover:bg-[#FF0000]/25 transition-colors"
            >
              <span aria-hidden>▶</span> YouTube Music
            </a>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          className="w-full py-2 rounded-xl bg-pato-coral text-white font-body font-medium text-sm hover:bg-pato-terra transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => onReset?.()}
          className="w-full py-2 rounded-xl bg-white/60 text-pato-smoke font-body text-sm hover:bg-white hover:text-pato-charcoal transition-colors"
        >
          Restablecer datos
        </button>
      </div>
    </Panel>
  )
}

function ProfileSummary({ title, profile, onClear }) {
  if (!profile || !profile.nombre) {
    return (
      <Panel className="p-5">
        <h4 className="font-display text-lg text-pato-charcoal mb-2"><span className="italic font-light">{title}</span></h4>
        <p className="font-body italic text-sm text-pato-smoke">Sin datos aún.</p>
      </Panel>
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
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-display text-lg text-pato-charcoal"><span className="italic font-light">{title}</span></h4>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white/60 text-pato-smoke font-body text-xs font-medium hover:bg-white hover:text-pato-coral transition-colors"
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
            className="w-14 h-14 rounded-full object-cover border border-white/70 shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <dl className="space-y-2 text-sm">
            {items.map(([label, value]) => (
              <div key={label}>
                <dt className="font-body text-xs text-pato-smoke">{label}</dt>
                <dd className="font-body text-pato-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Panel>
  )
}
