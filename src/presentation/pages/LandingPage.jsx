import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '../hooks/useAppState'
import { useElapsedCounter } from '../hooks/useElapsedCounter'
import { container } from '../../infrastructure/di/container.js'
import { getQuoteOfTheDay } from '../config/romanticQuotes.js'
import { FloatingPhotos } from '../components/FloatingPhotos'
import { FloatingVideos } from '../components/FloatingVideos'

export default function LandingPage() {
  const { state, loading, update: updateAppState } = useAppState()
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
      <div className="min-h-[50dvh] flex items-center justify-center">
        <div className="animate-pulse font-body text-pato-coral">Cargando…</div>
      </div>
    )
  }

  const [p0, p1] = Array.isArray(partnerProfiles) ? partnerProfiles : [null, null]
  const hasAnyProfile = !!(p0?.nombre || p1?.nombre)

  return (
    <div className="pt-20 pb-6 px-4">
      <FloatingPhotos media={floatingMedia} />
      <FloatingVideos media={landingVideos} />

      <section className="relative z-10 max-w-3xl mx-auto space-y-10 animate-fade-in">
        <header className="text-center space-y-3">
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-pato-coral/85">Nuestra historia</p>
          <h1 className="font-display text-5xl md:text-6xl font-medium text-pato-charcoal leading-[1.05]">
            <span className="italic font-light">Nuestros</span> recuerdos
          </h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TimeCounterCard parts={counterParts} sublabel={state.metSince ? formatDate(state.metSince) : null} />
          <CounterCard value={citas.length} label="citas" />
        </div>

        {statusLabel && (
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-pato-charcoal text-sm"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 18px -8px rgba(184,117,96,0.18)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-pato-coral animate-pulse" />
              <span className="text-pato-smoke font-body">Estado:</span>
              <span className="font-medium font-body">{statusLabel}</span>
            </div>
          </div>
        )}

        <GlassCard>
          <p className="font-display text-xl md:text-2xl text-pato-charcoal leading-relaxed">
            <span className="font-display italic font-light text-pato-coral text-3xl leading-none mr-1 align-text-top">“</span>
            <span className="italic">{quote.text}</span>
            <span className="font-display italic font-light text-pato-coral text-3xl leading-none ml-1 align-text-bottom">”</span>
          </p>
          <footer className="text-sm text-pato-smoke mt-3 font-body tracking-wide">— {quote.author}</footer>
        </GlassCard>

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
            <h2 className="font-display text-2xl font-medium text-pato-charcoal tracking-tight">Citas</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          </div>
          <p className="text-sm text-pato-smoke font-body text-center mb-5">Las últimas citas registradas.</p>
          {citas.length === 0 ? (
            <p className="text-sm text-pato-smoke font-body text-center italic mb-5">Aún no hay citas registradas.</p>
          ) : (
            <ul className="space-y-3 mb-5">
              {citas.map((c) => (
                <li key={c.id} className="rounded-2xl px-5 py-4 text-pato-charcoal text-sm" style={glassStyle}>
                  <div className="font-medium font-body">{formatDate(c.date)}</div>
                  {(c.lugar || c.horaEncuentro) && (
                    <div className="text-pato-smoke text-xs mt-1 font-body">
                      {[c.lugar, c.horaEncuentro].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {c.note && <p className="text-pato-smoke mt-2 text-xs font-body italic">{c.note}</p>}
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

const glassStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 8px 32px -8px rgba(184, 117, 96, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
}

function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-3xl px-7 py-6 ${className}`} style={glassStyle}>
      {children}
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
      <GlassCard className="h-full">
        <p className="font-body text-[10px] uppercase tracking-[0.25em] text-pato-smoke mb-4">Tiempo juntos</p>
        <div className="grid grid-cols-4 gap-2">
          {units.map(({ key, label, value }) => (
            <div key={key} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-medium text-pato-charcoal tabular-nums leading-none">
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-pato-smoke mt-2 font-body">{label}</div>
            </div>
          ))}
        </div>
        {sublabel && (
          <p className="text-xs text-pato-smoke mt-4 font-display italic">desde {sublabel}</p>
        )}
      </GlassCard>
    </div>
  )
}

function CounterCard({ value, label }) {
  return (
    <GlassCard className="flex flex-col justify-center items-center text-center">
      <div className="font-display text-5xl md:text-6xl font-light text-pato-charcoal leading-none">
        {value != null ? value.toLocaleString('es') : '—'}
      </div>
      <div className="text-pato-smoke font-body text-xs mt-3 uppercase tracking-[0.25em]">{label}</div>
    </GlassCard>
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
    <section className="relative rounded-3xl px-7 py-6" style={glassStyle}>
      <button
        type="button"
        onClick={onHide}
        title="Ocultar resumen de la pareja"
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/60 hover:bg-white/85 text-pato-smoke hover:text-pato-charcoal transition-all focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        aria-label="Ocultar resumen"
      >
        <span className="text-base leading-none select-none" aria-hidden>×</span>
      </button>
      <h2 className="font-display text-2xl font-medium text-pato-charcoal mb-5 pr-8 tracking-tight">Quiénes somos</h2>
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
          <h3 className="font-display text-lg font-medium text-pato-charcoal">{title}</h3>
          <p className="text-sm text-pato-smoke font-body italic">Sin datos aún.</p>
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
        <p className="text-[10px] uppercase tracking-widest text-pato-smoke font-body mb-1">{title}</p>
        <h3 className="text-pato-charcoal font-medium font-body">{fullName}</h3>
        {profile.fechaNacimiento && (
          <p className="text-xs text-pato-smoke mt-0.5 font-body">{profile.fechaNacimiento}</p>
        )}
        {highlights.length > 0 && (
          <p className="text-sm text-pato-smoke mt-2 line-clamp-2 font-body">{highlights.join(' · ')}</p>
        )}
        {profile.queLosHaceUnicos && (
          <p className="text-sm text-pato-charcoal mt-2 font-display italic">“{profile.queLosHaceUnicos}”</p>
        )}
      </div>
    </div>
  )
}
