'use client'

import { useEffect, useState, useCallback } from 'react'
import { CONTESTS, findContest, isOpen, type ContestId } from '@/lib/contests'

/**
 * Подача твору на конкурс.
 *
 * Форма показує стан заявки: скільки серій уже прийнято і скільки лишилося.
 * Це головне, чого бракувало старому шляху через «Написати редакції» — автор
 * надсилав текст і не мав жодного підтвердження, що він дійшов цілим.
 *
 * Перевірка обсягу відбувається на сервері, бо саме він читає .docx. Тому
 * помилку показуємо текстом, а не підсвічуванням полів: файл може бути
 * зарахований або ні, проміжного стану немає.
 */

const BRAND = {
  card: '#0f1e3a',
  deep: '#0a1628',
  amber: '#ef9f27',
  amberSoft: '#FAC775',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = "'Lora', Georgia, serif"

interface Episode { ord: number; words: number; filename: string }
interface Entry {
  id: string
  contest: string
  title: string
  annotation: string
  genre: string
  status: string
  episodes: Episode[]
}

export default function ContestSubmitForm() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])

  const open = CONTESTS.filter(c => isOpen(c))
  const [contestId, setContestId] = useState(open[0]?.id ?? CONTESTS[0].id)
  const [title, setTitle] = useState('')
  const [annotation, setAnnotation] = useState('')
  const [genre, setGenre] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')

  const contest = findContest(contestId)!
  const entry = entries.find(e => e.contest === contestId)
  const accepted = entry?.episodes.length ?? 0
  const left = contest.episodes - accepted

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/contest/submit')
      const d = await res.json() as { authorized?: boolean; entries?: Entry[] }
      setAuthorized(Boolean(d.authorized))
      setEntries(d.entries ?? [])
    } catch {
      setNote('Не вдалося звʼязатися з сайтом.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const send = async () => {
    if (files.length === 0) { setNote('Прикріпіть файли з текстом.'); return }
    if (!entry && !title.trim()) { setNote('Вкажіть назву твору.'); return }

    setBusy(true); setNote(''); setDone('')
    try {
      const fd = new FormData()
      fd.append('contest', contestId)
      fd.append('title', title.trim())
      fd.append('annotation', annotation.trim())
      fd.append('genre', genre.trim())
      files.forEach(f => fd.append('files', f))

      const res = await fetch('/api/contest/submit', { method: 'POST', body: fd })
      const d = await res.json() as { ok?: boolean; error?: string; totalNow?: number; totalNeed?: number }

      if (!d.ok) { setNote(d.error ?? 'Не вдалося надіслати'); return }

      setFiles([])
      setDone(
        (d.totalNow ?? 0) >= (d.totalNeed ?? 0)
          ? `Заявка повна: ${d.totalNow} із ${d.totalNeed}. Підтвердження надіслано на вашу пошту.`
          : `Прийнято ${d.totalNow} із ${d.totalNeed}. Решту надішлете, коли будуть готові.`,
      )
      await load()
    } catch {
      setNote('Не вдалося звʼязатися з сайтом. Перевірте інтернет.')
    } finally {
      setBusy(false)
    }
  }

  const box: React.CSSProperties = {
    background: BRAND.card, borderRadius: 14, padding: '1.5rem',
    border: `1px solid ${BRAND.line}`, marginBottom: '1.25rem',
  }
  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 9, marginBottom: 14,
    border: `1px solid ${BRAND.line}`, background: BRAND.deep, color: BRAND.ink,
    fontSize: 16, fontFamily: 'inherit', outline: 'none',
  }
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.82rem', color: BRAND.muted, marginBottom: 6,
  }

  if (loading) {
    return <div style={box}><p style={{ color: BRAND.muted, margin: 0 }}>Завантажуємо…</p></div>
  }

  if (!authorized) {
    return (
      <div style={box}>
        <h2 style={{ fontFamily: SERIF, fontSize: '1.3rem', color: BRAND.amber, marginTop: 0 }}>
          Спершу увійдіть
        </h2>
        <p style={{ color: BRAND.text, lineHeight: 1.7 }}>
          Заявку приймаємо від автора, який увійшов у кабінет — так ми точно знаємо, хто подав,
          і надішлемо підтвердження на вашу пошту. Вхід без пароля, за посиланням із листа.
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-block', padding: '10px 18px', borderRadius: 9,
            background: BRAND.amber, color: '#0a1628', fontWeight: 700, textDecoration: 'none',
          }}
        >
          Увійти
        </a>
      </div>
    )
  }

  if (open.length === 0) {
    return (
      <div style={box}>
        <p style={{ color: BRAND.text, margin: 0, lineHeight: 1.7 }}>
          Зараз прийом заявок закрито. Дати наступних конкурсів — на сторінці «Конкурси».
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={box}>
        <label style={label}>Конкурс</label>
        <select
          value={contestId}
          onChange={e => { setContestId(e.target.value as ContestId); setFiles([]); setNote(''); setDone('') }}
          style={field}
        >
          {open.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <p style={{ color: BRAND.muted, fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 4px' }}>
          {contest.hint} Прийом до {contest.closesAt.split('-').reverse().join('.')}.
        </p>
      </div>

      {entry && (
        <div style={{ ...box, borderColor: 'rgba(239,159,39,0.45)' }}>
          <h3 style={{ fontFamily: SERIF, fontSize: '1.15rem', color: BRAND.amber, margin: '0 0 10px' }}>
            Ваша заявка: {entry.title}
          </h3>
          <p style={{ color: BRAND.text, margin: '0 0 10px' }}>
            Прийнято <strong>{accepted}</strong> із {contest.episodes}
            {left > 0 ? `, лишилося ${left}` : ' — заявка повна'}.
          </p>
          <ul style={{ color: BRAND.muted, fontSize: '0.88rem', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            {entry.episodes.map(ep => (
              <li key={ep.ord}>Серія {ep.ord} — {ep.words} слів ({ep.filename})</li>
            ))}
          </ul>
        </div>
      )}

      {left > 0 && (
        <div style={box}>
          {!entry && (
            <>
              <label style={label}>Назва твору</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={field} maxLength={200} />

              <label style={label}>Анотація — 2–4 речення, це побачить читач у списку</label>
              <textarea
                value={annotation}
                onChange={e => setAnnotation(e.target.value)}
                rows={4}
                style={{ ...field, resize: 'vertical' }}
                maxLength={1500}
              />

              <label style={label}>Жанр</label>
              <input
                value={genre}
                onChange={e => setGenre(e.target.value)}
                style={field}
                maxLength={100}
                placeholder="наприклад: сімейна драма, гумор, фантастика"
              />
            </>
          )}

          <label style={label}>
            {contest.atOnce
              ? `Файли — усі ${contest.episodes} одразу, .docx або .txt`
              : `Файли серій — можна одну, можна кілька, .docx або .txt`}
          </label>
          <input
            type="file"
            multiple={contest.episodes > 1}
            accept=".docx,.txt"
            // Сортуємо ТУТ ЖЕ, тим самим правилом, що на сервері: автор має
            // бачити той порядок, у якому серії справді ляжуть у заявку.
            // Порядок, у якому файли віддає браузер, не гарантований —
            // тест 09.09.2026 дав три файли задом наперед.
            onChange={e =>
              setFiles(
                (Array.from(e.target.files ?? []) as File[]).sort((a, b) =>
                  new Intl.Collator('uk', { numeric: true, sensitivity: 'base' }).compare(a.name, b.name),
                ),
              )
            }
            style={{ ...field, padding: '9px 10px' }}
          />

          {files.length > 0 && (
            <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 12px' }}>
              Серії ляжуть у такому порядку:{' '}
              {files.map((f, i) => `${i + 1}. ${f.name}`).join('; ')}.
            </p>
          )}

          <p style={{ color: BRAND.muted, fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 14px' }}>
            Обсяг кожної серії — {contest.minWords}–{contest.maxWords} слів. Якщо файл не
            вкладається, заявка не зберігається зовсім: ми покажемо, який саме файл і скільки
            в ньому слів.
          </p>

          <p style={{ color: BRAND.muted, fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 14px' }}>
            <strong style={{ color: '#f5f0e8' }}>Пронумеруйте файли</strong> — серії шикуються
            за назвою файлу: «01 Хвіртка.docx», «02 Суха земля.docx». Так порядок буде саме
            той, який ви задумали, а не той, у якому файли підхопить браузер.
          </p>

          <button
            type="button"
            onClick={() => void send()}
            disabled={busy}
            style={{
              padding: '11px 22px', borderRadius: 9, border: 'none',
              background: busy ? 'rgba(239,159,39,0.4)' : BRAND.amber,
              color: '#0a1628', fontWeight: 700, fontSize: 15,
              cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {busy ? 'Надсилаємо…' : entry ? 'Додати серії' : 'Надіслати заявку'}
          </button>
        </div>
      )}

      {note && (
        <p style={{ color: BRAND.amberSoft, lineHeight: 1.7, background: 'rgba(239,159,39,0.08)', padding: '12px 14px', borderRadius: 10 }}>
          {note}
        </p>
      )}
      {done && (
        <p style={{ color: BRAND.ink, lineHeight: 1.7, background: 'rgba(120,200,140,0.12)', padding: '12px 14px', borderRadius: 10 }}>
          {done}
        </p>
      )}
    </div>
  )
}
