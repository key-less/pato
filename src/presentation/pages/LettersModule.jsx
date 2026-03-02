import { useState, useEffect } from 'react'
import { container } from '../../infrastructure/di/container.js'
import { sendEmailViaApi, isEmailApiConfigured } from '../../infrastructure/api/sendEmailApi.js'
import { LOGO_DUCK } from '../config/assets.js'

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
      setTimeout(() => setSendResult(null), 8000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-14 pb-28 px-4">
      <header className="flex items-center gap-3 mb-8">
        <img src={LOGO_DUCK} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-pato-coral/40" />
        <h1 className="font-display text-2xl font-semibold text-pato-ink">Cartas</h1>
      </header>

      <p className="text-pato-muted mb-6">
        Escribe cartas y envíalas por correo. Puedes abrir tu cliente de correo (mailto) o, si tienes el servidor configurado, enviar directamente con Gmail.
      </p>
      {sendResult && (
        <div
          role="alert"
          className={`mb-4 rounded-xl px-4 py-4 border ${
            sendResult.ok
              ? 'bg-pato-sage/50 border-pato-sage text-pato-ink'
              : 'bg-pato-rose/50 border-pato-rose text-pato-ink'
          }`}
        >
          <p className="font-medium">
            {sendResult.ok ? '✓ Correo enviado correctamente' : '✗ No se pudo enviar el correo'}
          </p>
          <p className="text-sm mt-1 opacity-90">
            {sendResult.ok
              ? 'El mensaje llegará a la bandeja de entrada del destinatario (revisa también spam si no lo ve).'
              : sendResult.error}
          </p>
          {!sendResult.ok && (
            <p className="text-xs mt-2 opacity-80">
              Comprueba que el servidor esté en marcha (puerto 3001), que el correo del destinatario sea correcto y que Gmail esté bien configurado en el servidor.
            </p>
          )}
        </div>
      )}

      <section className="bg-pato-butter/80 rounded-2xl p-6 border border-pato-honey/50 mb-8">
        <h2 className="font-display font-medium text-pato-ink mb-4">
          {editingId ? 'Editar carta' : 'Nueva carta'}
        </h2>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Correo del destinatario (necesario para Enviar con Gmail)"
          className="w-full rounded-xl border border-pato-honey bg-white/95 px-4 py-2 mb-3 text-pato-ink placeholder-pato-muted"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto"
          className="w-full rounded-xl border border-pato-honey bg-white/95 px-4 py-2 mb-3 text-pato-ink placeholder-pato-muted"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribe tu carta aquí..."
          rows={6}
          className="w-full rounded-xl border border-pato-honey bg-white/95 px-4 py-3 text-pato-ink placeholder-pato-muted resize-y"
        />
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={saveDraft}
            className="px-4 py-2 rounded-xl bg-pato-sage/70 text-pato-ink font-medium"
          >
            {editingId ? 'Actualizar borrador' : 'Guardar borrador'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setSubject(''); setBody(''); }}
              className="px-4 py-2 rounded-xl bg-pato-honey/60 text-pato-ink"
            >
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display font-medium text-pato-ink mb-4">Borradores guardados</h2>
        <ul className="space-y-4">
          {letters.map((letter) => (
            <li
              key={letter.id}
              className="bg-pato-butter/90 rounded-xl p-4 border border-pato-honey/60 shadow-sm"
            >
              <div className="font-medium text-pato-ink mb-1">{letter.subject || '(Sin asunto)'}</div>
              <p className="text-sm text-pato-muted line-clamp-2 mb-3">{letter.body || '(Vacía)'}</p>
              <div className="flex flex-wrap gap-2">
                {apiConfigured && (
                  <button
                    type="button"
                    disabled={sendingViaGmail}
                    onClick={() => sendByGmail(letter)}
                    className="px-4 py-2 rounded-xl bg-pato-peach text-pato-ink text-sm font-semibold hover:bg-pato-rose disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingViaGmail ? 'Enviando…' : 'Enviar correo (Gmail)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => sendByMailto(letter)}
                  className="px-3 py-1.5 rounded-lg bg-pato-honey/60 text-pato-ink text-sm font-medium"
                >
                  Abrir en mi correo
                </button>
                <button
                  type="button"
                  onClick={() => editLetter(letter)}
                  className="px-3 py-1.5 rounded-lg bg-pato-honey/50 text-pato-ink text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => deleteDraft(letter)}
                  className="px-3 py-1.5 rounded-lg text-pato-muted text-sm hover:text-pato-ink hover:bg-pato-rose/30"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
        {letters.length === 0 && (
          <p className="text-pato-muted text-center py-8">Aún no hay cartas guardadas.</p>
        )}
      </section>
    </div>
  )
}
