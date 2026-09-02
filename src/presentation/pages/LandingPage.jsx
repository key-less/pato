import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../hooks/useAppState'
import { useElapsedCounter } from '../hooks/useElapsedCounter'
import { container } from '../../infrastructure/di/container.js'
import { getQuoteOfTheDay } from '../config/romanticQuotes.js'
import { FloatingPhotos } from '../components/FloatingPhotos'
import { FloatingVideos } from '../components/FloatingVideos'
import Estanque from '../components/Estanque.jsx'
import Panel, { estiloPapel } from '../components/Panel.jsx'
import { useCompania } from '../hooks/useCompania.js'

export default function LandingPage() {
  const { state, loading, update: updateAppState } = useAppState()
  const { acompanado, saludo } = useCompania()
  const { parts: counterParts } = useElapsedCounter(state?.metSince ?? null)
  const [media, setMedia] = useState([])
  const [citas, setCitas] = useState([])
  const [partnerProfiles, setPartnerProfiles] = useState([null, null])

  useEffect(() => { container.getMediaList().then(setMedia) }, [])
  useEffect(() => { container.getCitas().then(setCitas) }, [])
  useEffect(() => { container.getPartnerProfiles().then(setPartnerProfiles) }, [])

  const floatingMedia = useMemo(
    () => media.filter((m) => m.type === 'photo' && m.showOnLanding),
    [media]
  )
  const landingVideos = useMemo(
    () => media.filter((m) => m.type === 'video' && m.showOnLanding),
    [media]
  )

  const quote = useMemo(() => getQuoteOfTheDay(), [])

  const statusLabel = useMemo(() => {
    if (!state?.relationshipStatuses?.length || !state?.currentRelationshipStatusId) return null
    const s = state.relationshipStatuses.find((r) => r.id === state.currentRelationshipStatusId)
    return s?.label ?? null
  }, [state])

  const showCoupleSummary = state?.showCoupleSummary !== false

  if (loading || state === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-body text-pato-coral">Cargando…</div>
      </div>
    )
  }

  const [p0, p1] = Array.isArray(partnerProfiles) ? partnerProfiles : [null, null]
  const hasAnyProfile = !!(p0?.nombre || p1?.nombre)

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <FloatingPhotos media={floatingMedia} />
      <FloatingVideos media={landingVideos} />

      <section className="relative z-10 max-w-3xl mx-auto space-y-10 animate-fade-in">
        <header className="text-center space-y-3">
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-pato-coral/85">Nuestra historia</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-pato-agua leading-[1.05]">
            <span className="italic font-light">Nuestros</span> recuerdos
          </h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TimeCounterCard parts={counterParts} sublabel={state.metSince ? formatDate(state.metSince) : null} />
          <CounterCard value={citas.length} label="citas" />
        </div>

        {statusLabel && (
          <Panel className="px-6 py-7">
            <figure className="flex flex-col items-center gap-2 m-0">
              <p className="font-body text-[10px] uppercase tracking-[0.25em] text-pato-junco mb-1">Dónde estamos</p>
              <Estanque
                statusId={state.currentRelationshipStatusId}
                statuses={state.relationshipStatuses}
                saludo={saludo}
                className="max-w-[16rem]"
              />
              <figcaption className="font-display italic text-xl text-pato-agua">{statusLabel}</figcaption>
              {acompanado && (
                <p className="font-body text-xs uppercase tracking-[0.2em] text-pato-coral mt-1" aria-live="polite">
                  Los dos, aquí ahora
                </p>
              )}
            </figure>
          </Panel>
        )}

        <Panel className="px-7 py-6">
          <p className="font-display text-xl md:text-2xl text-pato-agua leading-relaxed">
            <span className="font-display italic font-light text-pato-coral text-3xl leading-none mr-1 align-text-top">“</span>
            <span className="italic">{quote.text}</span>
            <span className="font-display italic font-light text-pato-coral text-3xl leading-none ml-1 align-text-bottom">”</span>
          </p>
          <footer className="text-sm text-pato-junco mt-3 font-body tracking-wide">— {quote.author}</footer>
        </Panel>

        {hasAnyProfile && (showCoupleSummary ? (
          <CoupleSummary profiles={partnerProfiles} onHide={() => updateAppState({ showCoupleSummary: false })} />
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => updateAppState({ showCoupleSummary: true })}
              className="text-sm text-pato-coral font-body font-medium hover:text-pato-terra transition-colors underline underline-offset-4 decoration-pato-coral/40"
            >
              Mostrar resumen de la pareja
            </button>
          </div>
        ))}

        <section className="pt-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
            <h2 className="font-display text-2xl font-medium text-pato-agua tracking-tight">Citas</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          </div>
          <p className="text-sm text-pato-junco font-body text-center mb-5">Las últimas citas registradas.</p>
          {citas.length === 0 ? (
            <p className="text-sm text-pato-junco font-body text-center italic mb-5">Aún no hay citas registradas.</p>
          ) : (
            <ul className="space-y-3 mb-5">
              {citas.map((c) => (
                <li key={c.id} className="rounded-2xl px-5 py-4 text-pato-agua text-sm" style={estiloPapel}>
                  <div className="font-medium font-body">{formatDate(c.date)}</div>
                  {(c.lugar || c.horaEncuentro) && (
                    <div className="text-pato-junco text-xs mt-1 font-body">
                      {[c.lugar, c.horaEncuentro].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {c.note && <p className="text-pato-junco mt-2 text-xs font-body italic">{c.note}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="text-center">
            <Link
              to="/citas"
              className="inline-block text-sm text-pato-coral font-body font-medium hover:text-pato-terra transition-colors"
            >
              Ver todas las citas →
            </Link>
          </div>
        </section>
      </section>
    </div>
  )
}

function TimeCounterCard({ parts, sublabel }) {
  const units = [
    { key: 'days', label: 'Días', value: parts?.days ?? 0 },
    { key: 'hours', label: 'Horas', value: parts?.hours ?? 0 },
    { key: 'min', label: 'Min', value: parts?.min ?? 0 },
    { key: 'sec', label: 'Seg', value: parts?.sec ?? 0 },
  ]
  return (
    <div className="sm:col-span-2">
      <Panel className="px-7 py-6 h-full">
        <p className="font-body text-[10px] uppercase tracking-[0.25em] text-pato-junco mb-4">Tiempo juntos</p>
        <div className="grid grid-cols-4 gap-2">
          {units.map(({ key, label, value }) => (
            <div key={key} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-medium text-pato-agua tabular-nums leading-none">
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-pato-junco mt-2 font-body">{label}</div>
            </div>
          ))}
        </div>
        {sublabel && (
          <p className="text-xs text-pato-junco mt-4 font-display italic">desde {sublabel}</p>
        )}
      </Panel>
    </div>
  )
}

function CounterCard({ value, label }) {
  return (
    <Panel className="px-7 py-6 flex flex-col justify-center items-center text-center">
      <div className="font-display text-5xl md:text-6xl font-light text-pato-agua leading-none">
        {value != null ? value.toLocaleString('es') : '—'}
      </div>
      <div className="text-pato-junco font-body text-xs mt-3 uppercase tracking-[0.25em]">{label}</div>
    </Panel>
  )
}

function formatDate(iso) {
  try {
    return new Date(iso + 'T00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function CoupleSummary({ profiles, onHide }) {
  const [p0, p1] = Array.isArray(profiles) ? profiles : [null, null]
  const hasAny = (p0 && p0.nombre) || (p1 && p1.nombre)
  if (!hasAny) return null

  return (
    <section className="relative rounded-3xl px-7 py-6" style={estiloPapel}>
      <button
        type="button"
        onClick={onHide}
        title="Ocultar resumen de la pareja"
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/85 text-pato-junco hover:text-pato-agua transition-all focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        aria-label="Ocultar resumen"
      >
        <span className="text-base leading-none select-none" aria-hidden>×</span>
      </button>
      <h2 className="font-display text-2xl font-medium text-pato-agua mb-5 pr-8 tracking-tight">Quiénes somos</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <SummaryCard title="Yo" profile={p0} />
        <SummaryCard title="Pareja" profile={p1} />
      </div>
    </section>
  )
}

function SummaryCard({ title, profile }) {
  if (!profile || !profile.nombre) {
    return (
      <div className="flex items-center gap-3 rounded-2xl p-4 bg-white/40 border border-white/60">
        {profile?.profilePhotoUrl && (
          <img
            src={profile.profilePhotoUrl}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-white/60"
          />
        )}
        <div>
          <h3 className="font-display text-lg font-medium text-pato-agua">{title}</h3>
          <p className="text-sm text-pato-junco font-body italic">Sin datos aún.</p>
        </div>
      </div>
    )
  }

  const fullName = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
  const highlights = [
    profile.colorFavorito && `Color: ${profile.colorFavorito}`,
    profile.comidaFavorita && `Comida: ${profile.comidaFavorita}`,
    profile.lugarFavorito && `Lugar: ${profile.lugarFavorito}`,
  ].filter(Boolean)

  return (
    <div className="flex gap-4 rounded-2xl p-4 bg-white/40 border border-white/60">
      {profile.profilePhotoUrl && (
        <img
          src={profile.profilePhotoUrl}
          alt={fullName}
          className="w-16 h-16 rounded-full object-cover border border-white/70 flex-shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-pato-junco font-body mb-1">{title}</p>
        <h3 className="text-pato-agua font-medium font-body">{fullName}</h3>
        {profile.fechaNacimiento && (
          <p className="text-xs text-pato-junco mt-0.5 font-body">{profile.fechaNacimiento}</p>
        )}
        {highlights.length > 0 && (
          <p className="text-sm text-pato-junco mt-2 line-clamp-2 font-body">{highlights.join(' · ')}</p>
        )}
        {profile.queLosHaceUnicos && (
          <p className="text-sm text-pato-agua mt-2 font-display italic">“{profile.queLosHaceUnicos}”</p>
        )}
      </div>
    </div>
  )
}
