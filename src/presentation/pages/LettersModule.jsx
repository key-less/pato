import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { estaSellada } from '../../domain/entities/Letter.js'
import { sendEmailViaApi, isEmailApiConfigured } from '../../infrastructure/api/sendEmailApi.js'
import { DuckLetters } from '../components/icons/Ducks.jsx'
import Panel from '../components/Panel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

export default function LettersModule() {
  const [letters, setLetters] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [unlocksAt, setUnlocksAt] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [sendingViaGmail, setSendingViaGmail] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const apiConfigured = isEmailApiConfigured()

  useEffect(() => {
    container.getLetters().then(setLetters)
  }, [])

  const limpiarFormulario = () => {
    setEditingId(null)
    setSubject('')
    setBody('')
    setUnlocksAt('')
  }

  const saveDraft = async () => {
    if (!subject.trim() && !body.trim()) return
    await container.saveLetter({ id: editingId ?? undefined, subject, body, unlocksAt })
    limpiarFormulario()
    container.getLetters().then(setLetters)
  }

  const editLetter = (letter) => {
    setEditingId(letter.id)
    setSubject(letter.subject)
    setBody(letter.body)
    setUnlocksAt(letter.unlocksAt ?? '')
  }

  const deleteDraft = async (letter) => {
    if (!window.confirm('¿Eliminar esta carta? No se puede deshacer.')) return
    await container.deleteLetter(letter.id)
    if (editingId === letter.id) limpiarFormulario()
    container.getLetters().then(setLetters)
  }

  const sendByMailto = async (letter) => {
    await container.logSentLetter(letter)
    await container.addActivityEvent({
      type: 'letter_sent',
      description: `Envió una carta: "${letter.subject || '(Sin asunto)'}"`,
    })
    const email = recipientEmail.trim() || undefined
    const url = container.buildMailtoUrl(email ?? '', letter.subject, letter.body)
    window.open(url, '_blank')
  }

  const sendByGmail = async (letter) => {
    const to = recipientEmail.trim()
    if (!to) {
      setSendResult({ ok: false, error: 'Escribe el correo del destinatario arriba.' })
      return
    }
    setSendingViaGmail(true)
    setSendResult(null)
    const result = await sendEmailViaApi({
      to,
      subject: letter.subject,
      text: letter.body,
    })
    setSendingViaGmail(false)
    setSendResult(result)
    if (result.ok) {
      await container.logSentLetter(letter)
      await container.addActivityEvent({
        type: 'letter_sent',
        description: `Envió una carta por Gmail: "${letter.subject || '(Sin asunto)'}"`,
      })
      setTimeout(() => setSendResult(null), 8000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-14 pb-28 px-4">
      <ModuleHeader
        icon={DuckLetters}
        eyebrow="Palabras escritas con cariño"
        italic="Nuestras"
        title="cartas"
        description="Escribe cartas y envíalas por correo. Por mailto o, si tienes el servidor configurado, directamente por Gmail."
      />

      {sendResult && (
        <Panel
          role="alert"
          className="mb-4 px-5 py-4"
          style={sendResult.ok
            ? { borderColor: 'rgba(196, 212, 196, 0.7)' }
            : { borderColor: 'rgba(212, 137, 122, 0.5)' }}
        >
          <p className="font-body font-medium text-pato-agua">
            {sendResult.ok ? '✓ Correo enviado correctamente' : '✗ No se pudo enviar el correo'}
          </p>
          <p className="font-body text-sm text-pato-junco mt-1">
            {sendResult.ok
              ? 'El mensaje llegará a la bandeja de entrada del destinatario (revisa también spam si no lo ve).'
              : sendResult.error}
          </p>
        </Panel>
      )}

      <Panel className="p-6 mb-8">
        <h2 className="font-display text-xl text-pato-agua mb-4">
          {editingId ? 'Editar carta' : 'Nueva carta'}
        </h2>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Correo del destinatario (necesario para Gmail)"
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-2 mb-3 font-body text-pato-agua placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-2 mb-3 font-body text-pato-agua placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu carta aquí…"
          rows={6}
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-body text-pato-agua placeholder-pato-smoke resize-y focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <label htmlFor="se-abre" className="block font-body text-xs font-medium text-pato-junco mt-4 mb-2">
          Se abre el… <span className="font-normal">(opcional)</span>
        </label>
        <input
          id="se-abre"
          type="date"
          value={unlocksAt}
          min={hoy()}
          onChange={(e) => setUnlocksAt(e.target.value)}
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-2 font-body text-pato-agua focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <p className="font-body text-xs text-pato-junco mt-2 leading-relaxed">
          Con fecha, la carta queda sellada: tu pareja verá que le espera una, pero no podrá leerla hasta ese día.
        </p>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={saveDraft}
            className="px-5 py-2 rounded-2xl bg-pato-coral text-white font-body font-medium hover:bg-pato-terra transition-colors"
          >
            {editingId ? 'Actualizar borrador' : 'Guardar borrador'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="px-5 py-2 rounded-2xl bg-white/70 text-pato-agua font-body hover:bg-white transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </Panel>

      <section>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          <h2 className="font-display text-xl text-pato-agua tracking-tight">Borradores guardados</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
        </div>
        <ul className="space-y-4">
          {letters.map((letter) => (
            <li key={letter.id}>
              {letter.selladaPorLaPareja ? (
                <CartaQueEspera unlocksAt={letter.unlocksAt} />
              ) : (
                <CartaGuardada
                  letter={letter}
                  apiConfigured={apiConfigured}
                  sendingViaGmail={sendingViaGmail}
                  onGmail={sendByGmail}
                  onMailto={sendByMailto}
                  onEdit={editLetter}
                  onDelete={deleteDraft}
                />
              )}
            </li>
          ))}
        </ul>
        {letters.length === 0 && (
          <p className="text-pato-junco font-body italic text-center py-8">Aún no hay cartas guardadas.</p>
        )}
      </section>
    </div>
  )
}

/** Fecha de hoy en el calendario de quien mira, para el `min` del selector. */
function hoy() {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

function enLetras(iso) {
  // Sin la hora, 'YYYY-MM-DD' se parsea como UTC y la fecha se corre un dia.
  try {
    return new Date(`${iso}T00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

/**
 * Una carta que la otra persona selló. No llega su contenido — la politica de
 * lectura la excluye — solo que existe y para cuando.
 */
function CartaQueEspera({ unlocksAt }) {
  return (
    <Panel className="p-5 text-center" style={{ borderColor: 'rgba(212, 102, 79, 0.35)' }}>
      <svg viewBox="0 0 120 54" className="w-24 h-auto mx-auto mb-3" role="img" aria-hidden>
        <ellipse cx="60" cy="44" rx="34" ry="6" fill="none" stroke="#dcc8ba" strokeWidth="1.5" />
        <ellipse cx="60" cy="44" rx="20" ry="3.6" fill="none" stroke="#d4664f" strokeWidth="1.5" opacity="0.7" />
        <path d="M38 22 h44 v20 h-44 z" fill="#fffbf4" stroke="#b87560" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M38 22 l22 14 22 -14" fill="none" stroke="#b87560" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="60" cy="32" r="4.5" fill="#d4664f" />
      </svg>
      <p className="font-display italic text-lg text-pato-agua">Una carta te espera</p>
      <p className="font-body text-sm text-pato-junco mt-1">Se abre el {enLetras(unlocksAt)}</p>
    </Panel>
  )
}

function CartaGuardada({ letter, apiConfigured, sendingViaGmail, onGmail, onMailto, onEdit, onDelete }) {
  const sellada = estaSellada(letter)

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="font-body font-medium text-pato-agua">{letter.subject || '(Sin asunto)'}</span>
        {sellada && (
          <span className="flex-shrink-0 font-body text-[10px] uppercase tracking-[0.14em] text-pato-coral border border-pato-coral/40 rounded-full px-2.5 py-1">
            Sellada
          </span>
        )}
      </div>
      {sellada && (
        <p className="font-body text-xs text-pato-junco mb-2">
          Tu pareja la podrá leer el {enLetras(letter.unlocksAt)}.
        </p>
      )}
      <p className="font-body text-sm text-pato-junco line-clamp-2 mb-3">{letter.body || '(Vacía)'}</p>
      <div className="flex flex-wrap gap-2">
        {!sellada && apiConfigured && (
          <button
            type="button"
            disabled={sendingViaGmail}
            onClick={() => onGmail(letter)}
            className="px-4 py-2 rounded-xl bg-pato-coral text-white font-body text-sm font-medium hover:bg-pato-terra disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {sendingViaGmail ? 'Enviando…' : 'Enviar (Gmail)'}
          </button>
        )}
        {!sellada && (
          <button
            type="button"
            onClick={() => onMailto(letter)}
            className="px-4 py-2 rounded-xl bg-white/70 text-pato-agua font-body text-sm font-medium hover:bg-white transition-colors"
          >
            Abrir en mi correo
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(letter)}
          className="px-4 py-2 rounded-xl bg-white/60 text-pato-agua font-body text-sm hover:bg-white transition-colors"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(letter)}
          className="px-4 py-2 rounded-xl font-body text-sm text-pato-junco hover:text-pato-coral transition-colors"
        >
          Eliminar
        </button>
      </div>
    </Panel>
  )
}
