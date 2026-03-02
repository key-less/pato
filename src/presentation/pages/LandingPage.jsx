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

  useEffect(() => {
    container.getMediaList().then(setMedia)
  }, [])
  useEffect(() => {
    container.getCitas().then(setCitas)
  }, [])
  useEffect(() => {
    container.getPartnerProfiles().then(setPartnerProfiles)
  }, [])

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
        <div className="animate-pulse text-pato-coral font-body">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <FloatingPhotos media={floatingMedia} />
      <FloatingVideos media={landingVideos} />

      <section className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-pato-ink">
          Nuestros recuerdos
        </h1>

        <div className="flex flex-wrap justify-center gap-8 items-stretch">
          <TimeCounterCard parts={counterParts} sublabel={state.metSince ? `desde el ${formatDate(state.metSince)}` : null} />
          <CounterCard value={citas.length} label="citas" />
        </div>

        {statusLabel && (
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-pato-peach/70 text-pato-ink font-medium border border-pato-honey/50">
            <span className="text-pato-muted">Estado:</span> {statusLabel}
          </div>
        )}

        <blockquote className="text-left bg-pato-butter/90 rounded-2xl px-6 py-5 border border-pato-honey/60 shadow-sm">
          <p className="font-display text-lg text-pato-ink italic">&ldquo;{quote.text}&rdquo;</p>
          <footer className="text-sm text-pato-muted mt-2">— {quote.author}</footer>
        </blockquote>

        {(() => {
          const [p0, p1] = Array.isArray(partnerProfiles) ? partnerProfiles : [null, null]
          const hasAnyProfile = (p0?.nombre || p1?.nombre)
          if (!hasAnyProfile) return null
          return showCoupleSummary ? (
            <CoupleSummary
              profiles={partnerProfiles}
              onHide={() => updateAppState({ showCoupleSummary: false })}
            />
          ) : (
            <button
              type="button"
              onClick={() => updateAppState({ showCoupleSummary: true })}
              className="text-sm text-pato-coral font-medium hover:underline"
            >
              Mostrar resumen de la pareja
            </button>
          )
        })()}

        <section className="mt-10 pt-8 border-t border-pato-honey/40">
          <h2 className="font-display text-lg font-semibold text-pato-ink mb-3">Historial</h2>
          <p className="text-sm text-pato-muted mb-3">Citas ya registradas.</p>
          {citas.length === 0 ? (
            <p className="text-sm text-pato-muted mb-3">Aún no hay citas registradas.</p>
          ) : (
            <ul className="space-y-3 mb-4">
              {citas.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl px-4 py-3 bg-pato-butter/80 border border-pato-honey/50 text-pato-ink text-sm"
                >
                  <div className="font-medium">{formatDate(c.date)}</div>
                  {(c.lugar || c.horaEncuentro) && (
                    <div className="text-pato-muted text-xs mt-0.5">
                      {[c.lugar, c.horaEncuentro].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {c.note && <p className="text-pato-muted mt-1 text-xs">{c.note}</p>}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/historial"
            className="inline-block text-sm text-pato-coral font-medium hover:underline"
          >
            Ir al historial completo →
          </Link>
        </section>
      </section>
    </div>
  )
}

function TimeCounterCard({ parts, sublabel }) {
  const units = [
    { key: 'days', label: 'Días', value: parts?.days ?? 0 },
    { key: 'hours', label: 'Horas', value: parts?.hours ?? 0 },
    { key: 'min', label: 'Minutos', value: parts?.min ?? 0 },
    { key: 'sec', label: 'Segundos', value: parts?.sec ?? 0 },
  ]

  return (
    <div className="bg-pato-butter/90 backdrop-blur rounded-2xl px-6 py-6 shadow-md border border-pato-honey/60">
      <div className="flex justify-center items-start gap-2 md:gap-4">
        {units.map(({ key, label, value }, i) => (
          <div key={key} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center min-w-[3.5rem] md:min-w-[4rem]">
              <span className="text-pato-muted font-medium text-xs md:text-sm uppercase tracking-wide">{label}</span>
              <span className="font-mono text-xl md:text-3xl font-semibold text-pato-ink mt-1 tabular-nums">
                {String(value).padStart(2, '0')}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="font-mono text-pato-muted text-lg md:text-2xl self-center mt-5">:</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-pato-ink font-medium mt-4 text-center text-sm">Tiempo juntos</p>
      {sublabel && (
        <p className="text-xs text-pato-muted mt-1 text-center">{sublabel}</p>
      )}
    </div>
  )
}

function CounterCard({ value, label }) {
  return (
    <div className="bg-pato-butter/90 backdrop-blur rounded-2xl px-8 py-6 shadow-md border border-pato-honey/60 min-w-[140px] flex flex-col justify-center items-center">
      <div className="font-display text-4xl md:text-5xl font-semibold text-pato-ink">
        {value != null ? value.toLocaleString('es') : '—'}
      </div>
      <div className="text-pato-muted font-medium mt-1">{label}</div>
    </div>
  )
}

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function CoupleSummary({ profiles, onHide }) {
  const [p0, p1] = Array.isArray(profiles) ? profiles : [null, null]
  const hasAny = (p0 && p0.nombre) || (p1 && p1.nombre)
  if (!hasAny) return null

  return (
    <section className="relative text-left bg-pato-butter/90 rounded-2xl px-6 py-5 border border-pato-honey/60 shadow-sm">
      <button
        type="button"
        onClick={onHide}
        title="Ocultar resumen de la pareja"
        className="absolute -top-1 -right-1 w-11 h-10 flex items-center justify-center rounded-[2rem] rounded-br-[0.6rem] bg-pato-rose/85 text-white shadow-md hover:bg-pato-rose transition-colors focus:outline-none focus:ring-2 focus:ring-pato-coral/50"
        aria-label="Ocultar resumen"
      >
        <span className="text-xl leading-none select-none font-medium" aria-hidden>×</span>
      </button>
      <h2 className="font-display text-lg font-semibold text-pato-ink mb-4 pr-8">Quiénes somos</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <SummaryCard title="Yo" profile={p0} />
        <SummaryCard title="Pareja" profile={p1} />
      </div>
    </section>
  )
}

function SummaryCard({ title, profile }) {
  if (!profile || !profile.nombre) {
    return (
      <div className="flex items-center gap-3 rounded-xl p-4 bg-white/50 border border-pato-honey/40">
        {profile?.profilePhotoUrl && (
          <img
            src={profile.profilePhotoUrl}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-pato-honey/40"
          />
        )}
        <div>
          <h3 className="font-medium text-pato-ink">{title}</h3>
          <p className="text-sm text-pato-muted">Sin datos aún.</p>
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
    <div className="flex gap-4 rounded-xl p-4 bg-white/50 border border-pato-honey/40">
      {profile.profilePhotoUrl && (
        <img
          src={profile.profilePhotoUrl}
          alt={fullName}
          className="w-16 h-16 rounded-full object-cover border border-pato-honey/50 flex-shrink-0"
        />
      )}
      <div className="min-w-0">
        <h3 className="font-medium text-pato-ink">{title}</h3>
        <p className="text-pato-ink font-medium">{fullName}</p>
        {profile.fechaNacimiento && (
          <p className="text-xs text-pato-muted mt-0.5">{profile.fechaNacimiento}</p>
        )}
        {highlights.length > 0 && (
          <p className="text-sm text-pato-muted mt-2 line-clamp-2">{highlights.join(' · ')}</p>
        )}
        {profile.queLosHaceUnicos && (
          <p className="text-sm text-pato-ink mt-2 italic">&ldquo;{profile.queLosHaceUnicos}&rdquo;</p>
        )}
      </div>
    </div>
  )
}
