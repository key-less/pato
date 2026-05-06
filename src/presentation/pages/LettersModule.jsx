import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { sendEmailViaApi, isEmailApiConfigured } from '../../infrastructure/api/sendEmailApi.js'
import { DuckLetters } from '../components/icons/Ducks.jsx'
import GlassPanel from '../components/GlassPanel.jsx'
import ModuleHeader from '../components/ModuleHeader.jsx'

export default function LettersModule() {
  const [letters, setLetters] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [sendingViaGmail, setSendingViaGmail] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const apiConfigured = isEmailApiConfigured()

  useEffect(() => {
    container.getLetters().then(setLetters)
  }, [])

  const saveDraft = async () => {
    if (!subject.trim() && !body.trim()) return
    if (editingId) {
      await container.saveLetter({ id: editingId, subject, body })
      setEditingId(null)
    } else {
      await container.saveLetter({ subject, body })
    }
    setSubject('')
    setBody('')
    container.getLetters().then(setLetters)
  }

  const editLetter = (letter) => {
    setEditingId(letter.id)
    setSubject(letter.subject)
    setBody(letter.body)
  }

  const deleteDraft = async (letter) => {
    if (!window.confirm('¿Eliminar esta carta? No se puede deshacer.')) return
    await container.deleteLetter(letter.id)
    if (editingId === letter.id) {
      setEditingId(null)
      setSubject('')
      setBody('')
    }
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
        <GlassPanel
          role="alert"
          className="mb-4 px-5 py-4"
          style={sendResult.ok
            ? { borderColor: 'rgba(196, 212, 196, 0.7)' }
            : { borderColor: 'rgba(212, 137, 122, 0.5)' }}
        >
          <p className="font-body font-medium text-pato-charcoal">
            {sendResult.ok ? '✓ Correo enviado correctamente' : '✗ No se pudo enviar el correo'}
          </p>
          <p className="font-body text-sm text-pato-smoke mt-1">
            {sendResult.ok
              ? 'El mensaje llegará a la bandeja de entrada del destinatario (revisa también spam si no lo ve).'
              : sendResult.error}
          </p>
        </GlassPanel>
      )}

      <GlassPanel className="p-6 mb-8">
        <h2 className="font-display text-xl text-pato-charcoal mb-4">
          {editingId ? 'Editar carta' : 'Nueva carta'}
        </h2>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Correo del destinatario (necesario para Gmail)"
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-2 mb-3 font-body text-pato-charcoal placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-2 mb-3 font-body text-pato-charcoal placeholder-pato-smoke focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu carta aquí…"
          rows={6}
          className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 font-body text-pato-charcoal placeholder-pato-smoke resize-y focus:outline-none focus:ring-2 focus:ring-pato-coral/40"
        />
        <div className="flex gap-3 mt-3">
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
              onClick={() => { setEditingId(null); setSubject(''); setBody(''); }}
              className="px-5 py-2 rounded-2xl bg-white/70 text-pato-charcoal font-body hover:bg-white transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </GlassPanel>

      <section>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
          <h2 className="font-display text-xl text-pato-charcoal tracking-tight">Borradores guardados</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pato-rose/50 to-transparent" />
        </div>
        <ul className="space-y-4">
          {letters.map((letter) => (
            <li key={letter.id}>
              <GlassPanel className="p-5">
                <div className="font-body font-medium text-pato-charcoal mb-1">{letter.subject || '(Sin asunto)'}</div>
                <p className="font-body text-sm text-pato-smoke line-clamp-2 mb-3">{letter.body || '(Vacía)'}</p>
                <div className="flex flex-wrap gap-2">
                  {apiConfigured && (
                    <button
                      type="button"
                      disabled={sendingViaGmail}
                      onClick={() => sendByGmail(letter)}
                      className="px-4 py-2 rounded-xl bg-pato-coral text-white font-body text-sm font-medium hover:bg-pato-terra disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingViaGmail ? 'Enviando…' : 'Enviar (Gmail)'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => sendByMailto(letter)}
                    className="px-4 py-2 rounded-xl bg-white/70 text-pato-charcoal font-body text-sm font-medium hover:bg-white transition-colors"
                  >
                    Abrir en mi correo
                  </button>
                  <button
                    type="button"
                    onClick={() => editLetter(letter)}
                    className="px-4 py-2 rounded-xl bg-white/60 text-pato-charcoal font-body text-sm hover:bg-white transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDraft(letter)}
                    className="px-4 py-2 rounded-xl font-body text-sm text-pato-smoke hover:text-pato-coral transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </GlassPanel>
            </li>
          ))}
        </ul>
        {letters.length === 0 && (
          <p className="text-pato-smoke font-body italic text-center py-8">Aún no hay cartas guardadas.</p>
        )}
      </section>
    </div>
  )
}
