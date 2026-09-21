'use client'

import { useCallback, useEffect, useState } from 'react'
import { AUTHOR_QUESTIONS, AI_POLICY_SHORT } from '@/lib/author-questions'

/**
 * Форма заявки автора на /become-author.
 *
 * Стани: завантаження → «спершу увійдіть» → вже автор → заявка на розгляді /
 * відхилена → сама форма. Людина завжди бачить, де вона зараз, а не гадає,
 * чи дійшов її лист.
 */

const C = {
  card: '#0f1e3a', deep: '#0a1628', gold: '#ef9f27', ink: '#f5f0e8',
  text: 'rgba(255,255,255,0.85)', muted: '#b9c6db', line: 'rgba(143,163,196,0.28)', err: '#ff9b8a',
}
const SERIF = "'Lora', Georgia, serif"
const FONT = "'Montserrat', Arial, sans-serif"

type App = { id: string; title: string; words: number; status: 'new' | 'accepted' | 'rejected'; admin_note: string | null; created_at: string }
type State = { authorized: boolean; email?: string; isAuthor?: boolean; application?: App | null }

export default function AuthorApplyForm() {
  const [loading, setLoading] = useState(true)
  const [st, setSt] = useState<State>({ authorized: false })
  const [again, setAgain] = useState(false)

  const [fullName, setFullName] = useState('')
  const [penName, setPenName] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [cAuthor, setCAuthor] = useState(false)
  const [cPublish, setCPublish] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/author-application', { cache: 'no-store' })
      const d = await r.json() as State & { ok?: boolean }
      setSt({ authorized: Boolean(d.authorized), email: d.email, isAuthor: d.isAuthor, application: d.application ?? null })
    } catch {
      setErr('Не вдалося звʼязатися з сайтом. Оновіть сторінку.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const send = async () => {
    setErr('')
    if (!file && !text.trim()) { setErr('Прикріпіть файл з історією або вставте текст у поле.'); return }
    const missing = AUTHOR_QUESTIONS.filter((q) => q.required && !(answers[q.id] ?? '').trim())
    if (missing.length) { setErr(`Дайте відповідь на обовʼязкові запитання: ${missing.map((q) => q.id.slice(1)).join(', ')}.`); return }
    if (!cAuthor || !cPublish) { setErr('Поставте обидві позначки згоди.'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('fullName', fullName.trim())
      fd.append('penName', penName.trim())
      fd.append('phone', phone.trim())
      fd.append('title', title.trim())
      fd.append('genre', genre.trim())
      if (file) fd.append('file', file); else fd.append('text', text)
      AUTHOR_QUESTIONS.forEach((q) => fd.append(q.id, (answers[q.id] ?? '').trim()))
      fd.append('consentAuthor', cAuthor ? 'yes' : 'no')
      fd.append('consentPublish', cPublish ? 'yes' : 'no')
      const r = await fetch('/api/author-application', { method: 'POST', body: fd })
      const d = await r.json() as { ok?: boolean; error?: string }
      if (!d.ok) { setErr(d.error ?? 'Не вдалося надіслати'); return }
      setAgain(false)
      await load()
    } catch {
      setErr('Не вдалося звʼязатися з сайтом. Перевірте інтернет.')
    } finally {
      setBusy(false)
    }
  }

  const box: React.CSSProperties = { background: C.card, border: `1.5px solid ${C.gold}`, borderRadius: 16, padding: '28px 28px' }
  const h: React.CSSProperties = { fontFamily: SERIF, fontSize: 22, color: C.gold, margin: '0 0 12px' }
  const p: React.CSSProperties = { fontSize: 15, color: C.text, lineHeight: 1.7, margin: '0 0 14px' }
  const field: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10, marginBottom: 14, boxSizing: 'border-box',
    border: `1px solid ${C.line}`, background: C.deep, color: C.ink, fontSize: 16, fontFamily: 'inherit', outline: 'none',
  }
  const label: React.CSSProperties = { display: 'block', fontSize: 13, color: C.muted, marginBottom: 6, fontWeight: 600, fontFamily: FONT }
  const btn: React.CSSProperties = {
    display: 'inline-block', padding: '13px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: C.gold, color: '#0a1628', fontWeight: 700, fontSize: 16, fontFamily: FONT, textDecoration: 'none',
  }

  if (loading) return <div id="zayavka" style={box}><p style={{ ...p, margin: 0 }}>Завантажуємо…</p></div>

  if (!st.authorized) {
    return (
      <div id="zayavka" style={box}>
        <h2 style={h}>Подати пробну історію</h2>
        <p style={p}>
          Спершу увійдіть на сайт — через Google або за адресою пошти, без пароля.
          Так ми знатимемо, що пошта справжня, і саме на цьому акаунті відкриємо ваш кабінет автора.
          Після входу ви повернетеся просто сюди.
        </p>
        <a href="/login?next=/become-author" style={btn}>Увійти й подати історію</a>
      </div>
    )
  }

  if (st.isAuthor) {
    return (
      <div id="zayavka" style={box}>
        <h2 style={h}>Ви вже автор Балабонів</h2>
        <p style={p}>Нові історії додавайте в кабінеті автора.</p>
        <a href="/author/dashboard" style={btn}>Перейти в кабінет</a>
      </div>
    )
  }

  const a = st.application
  if (a && a.status === 'new') {
    return (
      <div id="zayavka" style={box}>
        <h2 style={h}>Заявку отримано</h2>
        <p style={p}>
          Ваша історія <strong style={{ color: C.ink }}>«{a.title}»</strong> ({a.words} слів) на розгляді.
          Редакція відповість протягом 5 робочих днів на {st.email}.
        </p>
        <p style={{ ...p, color: C.muted, fontSize: 14, margin: 0 }}>
          Підтвердження вже надіслано на пошту. Якщо його немає — перевірте теку «Спам».
        </p>
      </div>
    )
  }

  if (a && a.status === 'rejected' && !again) {
    return (
      <div id="zayavka" style={box}>
        <h2 style={h}>Відповідь на вашу заявку</h2>
        <p style={p}>Цього разу редакція не готова опублікувати історію «{a.title}».</p>
        {a.admin_note && <p style={{ ...p, fontStyle: 'italic' }}>Коментар редакції: {a.admin_note}</p>}
        <button type="button" style={btn} onClick={() => setAgain(true)}>Надіслати іншу історію</button>
      </div>
    )
  }

  return (
    <div id="zayavka" style={box}>
      <h2 style={h}>Подати пробну історію</h2>
      <p style={{ ...p, color: C.muted, fontSize: 14 }}>Ви увійшли як {st.email}. На цю адресу прийде відповідь.</p>

      <label style={label} htmlFor="aa-name">Прізвище та імʼя *</label>
      <input id="aa-name" style={field} value={fullName} onChange={e => setFullName(e.target.value)} maxLength={120} autoComplete="name" />

      <label style={label} htmlFor="aa-pen">Псевдонім (якщо публікуєтеся під ним)</label>
      <input id="aa-pen" style={field} value={penName} onChange={e => setPenName(e.target.value)} maxLength={120} />

      <label style={label} htmlFor="aa-phone">Телефон *</label>
      <input id="aa-phone" style={field} value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} inputMode="tel" autoComplete="tel" />

      <label style={label} htmlFor="aa-title">Назва історії *</label>
      <input id="aa-title" style={field} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />

      <label style={label} htmlFor="aa-genre">Жанр</label>
      <input id="aa-genre" style={field} value={genre} onChange={e => setGenre(e.target.value)} maxLength={100} placeholder="наприклад: сімейна драма, гумор, історична проза" />

      <label style={label} htmlFor="aa-file">Файл з історією (.docx або .txt, до 2 МБ)</label>
      <input id="aa-file" type="file" accept=".docx,.txt" style={{ ...field, padding: '9px 10px' }}
        onChange={e => setFile(e.target.files?.[0] ?? null)} />

      {!file && (
        <>
          <label style={label} htmlFor="aa-text">…або вставте текст сюди</label>
          <textarea id="aa-text" style={{ ...field, minHeight: 160, resize: 'vertical' }} value={text} onChange={e => setText(e.target.value)} />
        </>
      )}

      <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C.gold, margin: '10px 0 6px' }}>Кілька запитань про історію</h3>
      <p style={{ ...p, color: C.muted, fontSize: 14 }}>
        Відповідайте коротко й своїми словами — це допомагає редакції краще зрозуміти ваш твір. Запитання із зірочкою обовʼязкові.
        {' '}{AI_POLICY_SHORT}
      </p>
      {AUTHOR_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <label style={label} htmlFor={`aa-${q.id}`}>{i + 1}. {q.label}{q.required ? ' *' : ''}</label>
          {q.hint && <p style={{ fontSize: 12.5, color: C.muted, margin: '-2px 0 6px' }}>{q.hint}</p>}
          <textarea id={`aa-${q.id}`} maxLength={q.max} value={answers[q.id] ?? ''}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            style={{ ...field, minHeight: q.max > 1000 ? 120 : 70, resize: 'vertical' }} />
        </div>
      ))}

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
        <input type="checkbox" checked={cAuthor} onChange={e => setCAuthor(e.target.checked)} style={{ marginTop: 4 }} />
        <span>Я автор(ка) цієї історії. Текст оригінальний, написаний без штучного інтелекту.</span>
      </label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 18 }}>
        <input type="checkbox" checked={cPublish} onChange={e => setCPublish(e.target.checked)} style={{ marginTop: 4 }} />
        <span>Погоджуюся, щоб редакція прочитала історію і, якщо її схвалять, опублікувала на Балабонах. Контактні дані використовуються лише для розгляду заявки.</span>
      </label>

      {err && <p role="alert" style={{ ...p, color: C.err }}>{err}</p>}

      <button type="button" style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={send}>
        {busy ? 'Надсилаємо…' : 'Надіслати заявку'}
      </button>
      <p style={{ ...p, color: C.muted, fontSize: 13, margin: '14px 0 0' }}>
        Обсяг — від 150 до 5000 слів. Відповідь — протягом 5 робочих днів.
      </p>
    </div>
  )
}
