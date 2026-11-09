'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CONTESTS, findContest, isOpen, acceptsEpisodes, SYNOPSIS_MAX, type ContestId } from '@/lib/contests'
import { trackConversion } from '@/lib/conversion'

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
/** Помилка заповнення: id поля, куди веде посилання зі зведення, і текст. */
interface FieldErr { id: string; msg: string }
interface Entry {
  id: string
  contest: string
  title: string
  annotation: string
  synopsis?: string | null
  genre: string
  status: string
  episodes: Episode[]
}

export default function ContestSubmitForm() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])

  // Конкурси, доступні авторові прямо зараз. Це НЕ просто «прийом відкрито»:
  // після 31 жовтня серіальний конкурс зникає з переліку відкритих, але автор,
  // який уже подав заявку, мусить бачити його — щоб дослати серії 2–10.
  // Список добудовується після завантаження заявок, тому лічимо його нижче.
  const [contestId, setContestId] = useState(
    CONTESTS.find(c => isOpen(c))?.id ?? CONTESTS[0].id,
  )
  // 09.11.2026: конкурс НЕ вибрано заздалегідь. Юлія Кузьмяк подала гумор «Гусак» в «Один день»,
  // бо список стояв на першому відкритому конкурсі, і вона його не помітила. Тепер автор спершу
  // сам обирає конкурс великою карткою — лише тоді з'являються поля твору.
  const [chosen, setChosen] = useState(false)
  // Посилання з картки конкурсу: /konkursy/podaty?konkurs=z-viterczem — конкурс уже обрано.
  useEffect(() => {
    try {
      const k = new URLSearchParams(window.location.search).get('konkurs')
      const c = k ? findContest(k) : undefined
      if (c && isOpen(c)) { setContestId(c.id as ContestId); setChosen(true) }
    } catch { /* без параметра — просто показуємо вибір */ }
  }, [])
  const [title, setTitle] = useState('')
  const [annotation, setAnnotation] = useState('')
  // 31.10.2026: синопсис на сторінку — окреме поле (анотацію бачать читачі, синопсис — редакція).
  const [synopsis, setSynopsis] = useState('')
  const [synBusy, setSynBusy] = useState(false)
  const [synNote, setSynNote] = useState('')
  const [genre, setGenre] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')
  const [aiOk, setAiOk] = useState(false)
  const [newOk, setNewOk] = useState(false)
  // 21.10.2026: у профілі немає імені — просимо вписати, як підписати твір
  const [needName, setNeedName] = useState(false)
  const [authorName, setAuthorName] = useState('')

  const open = CONTESTS.filter(
    c => isOpen(c) || (acceptsEpisodes(c) && entries.some(e => e.contest === c.id)),
  )
  // 15.10.2026: конкурси, прийом яких ще не почався. Авторка двічі не знайшла у формі
  // «Одного разу перед Різдвом» (прийом з 20.10) — форма мовчки показувала лише відкриті.
  // Тепер майбутні конкурси названо прямо, з датою старту.
  const todayIso = new Date().toISOString().slice(0, 10)
  const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
  const dayMonth = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
  const upcoming = CONTESTS.filter(c => c.opensAt > todayIso)
  const upcomingNote = upcoming.length > 0 && (
    <p style={{ color: BRAND.text, fontSize: '0.92rem', lineHeight: 1.6, margin: '12px 0 0', padding: '10px 12px', border: '1px dashed rgba(239,159,39,0.55)', borderRadius: 8 }}>
      <strong style={{ color: BRAND.amber }}>Скоро:</strong>{' '}
      {upcoming.map((c, i) => (
        <span key={c.id}>{i > 0 ? '; ' : ''}{c.name} — прийом з {dayMonth(c.opensAt)}</span>
      ))}. {upcoming.length > 1 ? 'Кожен конкурс з’явиться' : 'Конкурс з’явиться'} в переліку вище в день старту.
    </p>
  )
  const contest = findContest(contestId)!
  const entry = entries.find(e => e.contest === contestId)
  /** Прийом заявок позаду, але свої серії дослати ще можна. */
  const onlyEpisodes = !isOpen(contest) && Boolean(entry)
  const accepted = entry?.episodes.length ?? 0
  const left = contest.episodes - accepted

  // Синопсис уже поданої заявки підставляємо в поле, щоб автор бачив і міг виправити.
  useEffect(() => {
    setSynopsis(entry?.synopsis ?? '')
    setSynNote('')
  }, [entry?.id, entry?.synopsis])

  const saveSynopsis = async () => {
    setSynBusy(true); setSynNote('')
    try {
      const res = await fetch('/api/contest/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: contestId, synopsis: synopsis.trim() }),
      })
      const d = await res.json() as { ok?: boolean; error?: string }
      if (!d.ok) { setSynNote(d.error ?? 'Не вдалося зберегти синопсис.'); return }
      setEntries(prev => prev.map(e => (e.id === entry?.id ? { ...e, synopsis: synopsis.trim() } : e)))
      setSynNote('Синопсис збережено. Редакція побачить його разом із серіями.')
    } catch {
      setSynNote('Не вдалося звʼязатися з сайтом.')
    } finally {
      setSynBusy(false)
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/contest/submit')
      const d = await res.json() as { authorized?: boolean; entries?: Entry[]; needName?: boolean }
      setAuthorized(Boolean(d.authorized))
      setNeedName(Boolean(d.needName))
      setEntries(d.entries ?? [])
    } catch {
      setNote('Не вдалося звʼязатися з сайтом.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // 02.11.2026: автори не знаходили поле «Синопсис»: форма відкривалася на ІНШОМУ (відкритому)
  // конкурсі, а поле є лише в картці серіалу. Якщо в автора є заявка без синопсиса — відкриваємо її.
  const missingSyn = entries.find(e => {
    const c = findContest(e.contest as ContestId)
    return Boolean(c?.synopsis) && c != null && acceptsEpisodes(c) && !(e.synopsis ?? '').trim()
  })
  const autoPicked = useRef(false)
  useEffect(() => {
    if (autoPicked.current || !missingSyn) return
    autoPicked.current = true
    setContestId(missingSyn.contest as ContestId)
    setChosen(true)
  }, [missingSyn])

  const goSynopsis = () => {
    if (missingSyn) setContestId(missingSyn.contest as ContestId)
    setChosen(true)
    setTimeout(() => {
      const el = document.getElementById('f-synopsis-edit')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ;(el as HTMLTextAreaElement | null)?.focus()
    }, 50)
  }

  const noteRef = useRef<HTMLParagraphElement | null>(null)
  useEffect(() => {
    if (note) noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [note])

  // WCAG 3.3.1 / A-04 з аудиту: усі помилки заповнення — одним списком угорі
  // форми, кожна веде до свого поля. Раніше форма показувала їх по одній,
  // і автор дізнавався про наступну лише після виправлення попередньої.
  const [errors, setErrors] = useState<FieldErr[]>([])
  const summaryRef = useRef<HTMLDivElement | null>(null)

  const validate = (): FieldErr[] => {
    const e: FieldErr[] = []
    if (needName && authorName.trim().length < 3) e.push({ id: 'f-author', msg: 'Вкажіть ваше ім’я та прізвище (або псевдонім).' })
    if (!entry && !title.trim()) e.push({ id: 'f-title', msg: 'Вкажіть назву твору.' })
    if (!entry && contest.synopsis && synopsis.trim().length < 300) e.push({ id: 'f-synopsis', msg: 'Додайте синопсис: сюжет усього серіалу від початку до розв’язки, орієнтовно одна сторінка.' })
    if (files.length === 0) e.push({ id: 'f-files', msg: 'Не вибрано жодного файлу. Прикріпіть файл із текстом твору.' })
    // 07.11.2026 (Л. Лазаренко): великий .docx з картинками сервер (Vercel, межа 4,5 МБ на запит) відкидав
    // не JSON-ом — автор бачив «Перевірте інтернет». Тепер кажемо прямо, що файл завеликий.
    const big = files.find(f => f.size > 2 * 1024 * 1024)
    if (big) e.push({ id: 'f-files', msg: `Файл «${big.name}» завеликий: ${(big.size / 1048576).toFixed(1)} МБ, а можна до 2 МБ. Найчастіше розмір дають картинки: видаліть їх із документа (ілюстрації можна надіслати окремо на nazar@balabony.com) або збережіть текст як .txt.` })
    if (files.reduce((n, f) => n + f.size, 0) > 4 * 1024 * 1024) e.push({ id: 'f-files', msg: 'Разом файли важать понад 4 МБ. Надішліть їх двома частинами.' })
    if (!aiOk) e.push({ id: 'f-ai', msg: 'Поставте позначку про використання штучного інтелекту.' })
    if (!newOk) e.push({ id: 'f-new', msg: 'Поставте позначку, що твір не опублікований на інших платформах.' })
    return e
  }
  const bad = (id: string) => errors.some(e => e.id === id)

  // Виправлене поле зникає зі зведення одразу, без повторного натискання.
  useEffect(() => {
    setErrors(prev => (prev.length ? validate() : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, files, aiOk, newOk, authorName, synopsis])

  const goTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  const send = async () => {
    const errs = validate()
    setErrors(errs)
    if (errs.length > 0) {
      setNote(''); setDone('')
      // Фокус на зведення: читач екрана одразу озвучить увесь список.
      setTimeout(() => summaryRef.current?.focus(), 50)
      return
    }

    setBusy(true); setNote(''); setDone('')
    try {
      const fd = new FormData()
      fd.append('contest', contestId)
      if (needName) fd.append('authorName', authorName.trim())
      fd.append('title', title.trim())
      fd.append('annotation', annotation.trim())
      if (!entry && contest.synopsis) fd.append('synopsis', synopsis.trim())
      fd.append('genre', genre.trim())
      fd.append('aiConsent', aiOk ? 'yes' : 'no')
      fd.append('newConsent', newOk ? 'yes' : 'no')
      files.forEach(f => fd.append('files', f))

      const res = await fetch('/api/contest/submit', { method: 'POST', body: fd })
      if (!(res.headers.get('content-type') ?? '').includes('json')) {
        setNote(res.status === 413
          ? 'Файл завеликий для завантаження. Видаліть із документа картинки або збережіть текст як .txt і спробуйте ще раз.'
          : `Сайт не зміг прийняти файл (помилка ${res.status}). Спробуйте ще раз за кілька хвилин; якщо не вийде — надішліть файл на nazar@balabony.com.`)
        return
      }
      const d = await res.json() as { ok?: boolean; error?: string; totalNow?: number; totalNeed?: number; needName?: boolean }

      // 30.10.2026: сервер не знайшов імені (поле було сховане) — показуємо поле, щоб автор міг дописати й надіслати знову.
      if (d.needName) setNeedName(true)
      if (!d.ok) { setNote(d.error ?? 'Не вдалося надіслати'); return }
      if (needName) setNeedName(false)

      // Подія GA4 для конверсії Google Ad Grants «заявка на конкурс» (09.10.2026).
      // gtag є лише після згоди на аналітику — без згоди подія не йде.
      trackConversion('zaiavka_konkurs', contestId)

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
    fontSize: 16, fontFamily: 'inherit',
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
          Заявку приймаємо від автора, який увійшов — так ми точно знаємо, хто подав,
          і надішлемо підтвердження на вашу пошту. Вхід без пароля: через Google або за
          посиланням із листа. Після входу ви повернетеся просто сюди, до форми.
        </p>
        <a
          href="/login?next=/konkursy/podaty"
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
        {upcomingNote}
      </div>
    )
  }

  return (
    <div>
      {missingSyn && (
        <div role="status" style={{ ...box, borderColor: BRAND.amber, borderWidth: 2 }}>
          <p style={{ color: BRAND.text, margin: '0 0 10px', lineHeight: 1.6 }}>
            <strong style={{ color: BRAND.amber }}>Додайте синопсис.</strong> До заявки «{missingSyn.title}» ще немає синопсиса —
            без нього редакції важко оцінити серіал цілком.
          </p>
          <button
            type="button"
            onClick={goSynopsis}
            style={{
              padding: '9px 18px', borderRadius: 9, border: 'none', background: BRAND.amber,
              color: '#1a1206', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Перейти до поля «Синопсис»
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="f-errors-title"
          style={{ ...box, borderColor: BRAND.amber, borderWidth: 2 }}
        >
          <h2 id="f-errors-title" style={{ fontFamily: SERIF, fontSize: '1.15rem', color: BRAND.amber, margin: '0 0 10px' }}>
            Заявку не надіслано. Виправте {errors.length === 1 ? 'один пункт' : `${errors.length} пункти`}:
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {errors.map(e => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  onClick={ev => { ev.preventDefault(); goTo(e.id) }}
                  style={{ color: BRAND.amberSoft }}
                >
                  {e.msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset style={{ ...box, border: 'none', margin: '0 0 1.25rem' }}>
        <legend style={{ fontFamily: SERIF, fontSize: '1.25rem', color: BRAND.amber, padding: 0, marginBottom: 6 }}>
          Крок 1. Оберіть конкурс
        </legend>
        <p style={{ color: BRAND.muted, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 14px' }}>
          Натисніть на картку конкурсу, у який подаєте твір. Перевірте обсяг — він різний у кожному конкурсі.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {open.map(c => {
            const mine = entries.find(e => e.contest === c.id)
            const full = mine ? mine.episodes.length >= c.episodes : false
            const on = chosen && c.id === contestId
            const volume = c.volumeLabel ?? `${c.minWords}–${c.maxWords} слів`
            return (
              <label
                key={c.id}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                  padding: '14px 16px', borderRadius: 12,
                  border: on ? `2px solid ${BRAND.amber}` : '1px solid rgba(239,159,39,0.35)',
                  background: on ? 'rgba(239,159,39,0.12)' : 'transparent',
                }}
              >
                <input
                  type="radio" name="f-contest" value={c.id} checked={on}
                  onChange={() => { setContestId(c.id as ContestId); setChosen(true); setFiles([]); setNote(''); setDone('') }}
                  style={{ marginTop: 5, width: 20, height: 20, accentColor: BRAND.amber, flexShrink: 0 }}
                />
                <span style={{ display: 'block' }}>
                  <strong style={{ display: 'block', color: BRAND.text, fontSize: '1.05rem' }}>{c.name}</strong>
                  <span style={{ display: 'block', color: BRAND.muted, fontSize: '0.9rem', lineHeight: 1.55, marginTop: 2 }}>{c.tagline}</span>
                  <span style={{ display: 'block', color: BRAND.text, fontSize: '0.88rem', marginTop: 6 }}>
                    Обсяг: {volume} · {isOpen(c) ? `прийом до ${c.closesAt.split('-').reverse().join('.')}` : 'досилання серій до вашої заявки'}
                  </span>
                  {mine && (
                    <span style={{ display: 'block', color: BRAND.amber, fontSize: '0.88rem', fontWeight: 700, marginTop: 6 }}>
                      Ви вже подали: «{mine.title}»{full ? ' — заявка повна' : ''}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
        {upcomingNote}
      </fieldset>

      {chosen && (
        <p style={{ color: BRAND.muted, fontSize: '0.88rem', lineHeight: 1.6, margin: '-6px 0 16px' }}>
          {contest.hint}{' '}
          {onlyEpisodes ? 'Прийом нових заявок закрито — можна досилати серії до вашої.' : ''}
        </p>
      )}

      {chosen && (<>
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

          {contest.synopsis && (
            <div style={{ marginTop: 16 }}>
              <label htmlFor="f-synopsis-edit" style={label}>
                {entry.synopsis ? 'Синопсис (можна виправити)' : 'Синопсис ще не додано — вставте сюжет усього серіалу, орієнтовно одна сторінка. Бачить лише редакція.'}
              </label>
              <div style={{ color: BRAND.muted, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 10px', padding: '10px 12px', border: '1px dashed rgba(239,159,39,0.45)', borderRadius: 8 }}>
                <strong style={{ color: BRAND.text }}>Як заповнити:</strong> перекажіть сюжет усього серіалу від першої до десятої серії —
                хто головні герої, що між ними відбувається, які ключові повороти і <strong>чим усе закінчується</strong> (фінал не приховуйте:
                синопсис бачить лише редакція, читачі — ні). Обсяг — від 300 до {SYNOPSIS_MAX} знаків, орієнтовно одна сторінка.
                Можна вставити готовий текст із Word, а потім натиснути «Зберегти синопсис».
              </div>
              <textarea
                id="f-synopsis-edit" value={synopsis}
                onChange={e => setSynopsis(e.target.value)}
                rows={8}
                style={{ ...field, resize: 'vertical' }}
                maxLength={SYNOPSIS_MAX}
                aria-describedby="f-synopsis-edit-count"
              />
              <p id="f-synopsis-edit-count" style={{ color: BRAND.muted, fontSize: '0.8rem', margin: '-8px 0 10px' }}>
                {synopsis.trim().length} із {SYNOPSIS_MAX} знаків.
              </p>
              <button
                type="button"
                onClick={() => void saveSynopsis()}
                disabled={synBusy || synopsis.trim() === (entry.synopsis ?? '').trim()}
                style={{
                  padding: '9px 18px', borderRadius: 9, border: `1px solid ${BRAND.amber}`,
                  background: 'transparent', color: BRAND.amber, fontWeight: 700, fontSize: 14,
                  cursor: synBusy ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {synBusy ? 'Зберігаємо…' : 'Зберегти синопсис'}
              </button>
              {synNote && <p role="status" style={{ color: BRAND.amberSoft, fontSize: '0.88rem', margin: '10px 0 0' }}>{synNote}</p>}
            </div>
          )}
        </div>
      )}

      {left > 0 && (
        <div style={box}>
          {needName && (
            <>
              <label htmlFor="f-author" style={label}>Ваше ім’я та прізвище (або псевдонім) — так підпишемо твір</label>
              <input id="f-author" value={authorName} onChange={e => setAuthorName(e.target.value)} style={field} maxLength={120} autoComplete="name" aria-invalid={bad('f-author') || undefined} />
            </>
          )}
          {!entry && (
            <>
              <label htmlFor="f-title" style={label}>Назва твору</label>
              <input id="f-title" value={title} onChange={e => setTitle(e.target.value)} style={field} maxLength={200} aria-invalid={bad('f-title') || undefined} />

              <label htmlFor="f-annotation" style={label}>Анотація — 2–4 речення, це побачить читач у списку</label>
              <textarea
                id="f-annotation" value={annotation}
                onChange={e => setAnnotation(e.target.value)}
                rows={4}
                style={{ ...field, resize: 'vertical' }}
                maxLength={1500}
              />

              {contest.synopsis && (
                <>
                  <label htmlFor="f-synopsis" style={label}>Синопсис — сюжет усього серіалу від початку до розв’язки, орієнтовно одна сторінка. Бачить лише редакція.</label>
                  <textarea
                    id="f-synopsis" value={synopsis}
                    onChange={e => setSynopsis(e.target.value)}
                    rows={10}
                    style={{ ...field, resize: 'vertical' }}
                    maxLength={SYNOPSIS_MAX}
                    aria-invalid={bad('f-synopsis') || undefined}
                    aria-describedby="f-synopsis-count"
                  />
                  <p id="f-synopsis-count" style={{ color: BRAND.muted, fontSize: '0.8rem', margin: '-8px 0 14px' }}>
                    {synopsis.trim().length} із {SYNOPSIS_MAX} знаків. Можна вставити текст із Word.
                  </p>
                </>
              )}

              <label htmlFor="f-genre" style={label}>Жанр</label>
              <input
                id="f-genre" value={genre}
                onChange={e => setGenre(e.target.value)}
                style={field}
                maxLength={100}
                placeholder="наприклад: сімейна драма, гумор, фантастика"
              />

            </>
          )}

          <label htmlFor="f-files" style={label}>
            {contest.atOnce
              ? `Файли — усі ${contest.episodes} одразу, .docx або .txt`
              : `Файли серій — можна одну, можна кілька, .docx або .txt`}
          </label>
          <input
            id="f-files" type="file"
            aria-invalid={bad('f-files') || undefined}
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

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: BRAND.text, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px' }}>
            <input id="f-ai" type="checkbox" checked={aiOk} onChange={e => setAiOk(e.target.checked)} style={{ marginTop: 4 }} aria-invalid={bad('f-ai') || undefined} />
            <span>Підтверджую: текст написаний мною; штучний інтелект я використовував(ла) лише для перевірки правопису й граматики.</span>
          </label>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: BRAND.text, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px' }}>
            <input id="f-new" type="checkbox" checked={newOk} onChange={e => setNewOk(e.target.checked)} style={{ marginTop: 4 }} aria-invalid={bad('f-new') || undefined} />
            <span>Підтверджую: твір не опублікований на інших літературних платформах, в електронних бібліотеках, інтернет-виданнях і медіа (власний блог, соцмережі й паперові видання — не рахуються).</span>
          </label>

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

      </>)}

      {note && (
        <p role="alert" ref={noteRef} style={{ color: BRAND.amberSoft, lineHeight: 1.7, background: 'rgba(239,159,39,0.08)', padding: '12px 14px', borderRadius: 10 }}>
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
