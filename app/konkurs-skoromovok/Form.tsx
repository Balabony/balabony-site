'use client'
// 01.11.2026: форма подання на дитячий конкурс «Скоромовка Балабонів». Подає дорослий після входу.
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { AGE_GROUPS, KIDS_CONTEST, MAX_LINES, MAX_CHARS, MAX_PER_CHILD, groupLabel } from '@/lib/kids-contest'

const NAVY = '#0f172a', GOLD = '#ef9f27', BORDER = '#e2e8f0', TEXT = '#1e293b', MUTED = '#64748b'

type Entry = { id: string; child_name: string; child_age: number; age_group: string; title: string | null; body: string; created_at: string }
type State = { user: { email: string } | null; state: 'soon' | 'open' | 'closed'; entries: Entry[] }

const inp: CSSProperties = { width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 19, padding: '12px 14px', borderRadius: 12, border: `2px solid ${BORDER}`, background: '#fff', color: TEXT }
const lab: CSSProperties = { display: 'block', fontWeight: 700, color: NAVY, margin: '16px 0 6px', fontSize: 18 }
const btn: CSSProperties = { display: 'inline-block', background: GOLD, color: NAVY, fontWeight: 800, padding: '14px 26px', borderRadius: 999, border: 'none', fontSize: 19, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' }

export default function Form() {
  const [s, setS] = useState<State | null>(null)
  const [role, setRole] = useState<'parent' | 'teacher'>('parent')
  const [f, setF] = useState({ adultName: '', school: '', childName: '', childAge: '', ageGroup: '', city: '', title: '', text: '' })
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)

  const load = () => fetch('/api/kids-contest', { cache: 'no-store' }).then((r) => r.json()).then(setS).catch(() => setS({ user: null, state: 'open', entries: [] }))
  useEffect(() => { void load() }, [])

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const lines = f.text.split('\n').filter((l) => l.trim()).length

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/kids-contest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, role, childAge: Number(f.childAge), consent }) })
      const j = await r.json()
      if (j.ok) {
        setMsg({ ok: true, t: `Дякуємо! Скоромовку № ${j.id} прийнято. Можна подати ще одну — для цієї ж дитини (до ${MAX_PER_CHILD}) або для іншої.` })
        setF((x) => ({ ...x, title: '', text: '' }))
        void load()
      } else setMsg({ ok: false, t: j.error || 'Не вдалося подати' })
    } catch { setMsg({ ok: false, t: 'Немає зв’язку. Спробуйте ще раз.' }) }
    setBusy(false)
  }

  if (!s) return <p style={{ color: MUTED }}>Завантаження форми…</p>

  if (!s.user) return (
    <div>
      <p style={{ margin: '0 0 14px' }}>Роботу подає дорослий: один із батьків, законний представник або вчитель. Увійдіть на Балабони — це безкоштовно і займає хвилину (пошта або Google).</p>
      <a href={`/login?next=${encodeURIComponent(KIDS_CONTEST.path)}`} style={btn}>Увійти й подати скоромовку →</a>
    </div>
  )

  return (
    <div>
      {s.state === 'soon' && <p style={{ background: '#fff7e8', border: `2px dashed ${GOLD}`, borderRadius: 14, padding: '12px 16px', fontWeight: 700, color: NAVY }}>Прийом робіт почнеться {KIDS_CONTEST.startText}. Форму вже можна переглянути.</p>}
      {s.state === 'closed' && <p style={{ fontWeight: 700, color: NAVY }}>Прийом робіт завершено. Голосування — {KIDS_CONTEST.voteText}, переможців оголосимо {KIDS_CONTEST.resultsText}.</p>}
      {s.state !== 'closed' && (
        <form onSubmit={submit}>
          <p style={{ margin: 0, color: MUTED, fontSize: 16 }}>Ви увійшли як {s.user.email}</p>

          <span style={lab}>Хто подає</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['parent', 'teacher'] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r}
                style={{ ...btn, padding: '10px 20px', fontSize: 17, background: role === r ? GOLD : '#fff', border: `2px solid ${role === r ? GOLD : BORDER}` }}>
                {r === 'parent' ? 'Батьки / законний представник' : 'Вчитель'}
              </button>
            ))}
          </div>

          <label style={lab} htmlFor="ks-adult">Ваше ім’я та прізвище</label>
          <input id="ks-adult" style={inp} value={f.adultName} onChange={set('adultName')} required maxLength={120} autoComplete="name" />
          {role === 'teacher' && (<>
            <label style={lab} htmlFor="ks-school">Школа і клас</label>
            <input id="ks-school" style={inp} value={f.school} onChange={set('school')} required maxLength={200} placeholder="напр. Ліцей № 5, 6-Б клас" />
          </>)}

          <label style={lab} htmlFor="ks-child">Ім’я дитини (без прізвища)</label>
          <input id="ks-child" style={inp} value={f.childName} onChange={set('childName')} required maxLength={30} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 14px' }}>
            <div>
              <label style={lab} htmlFor="ks-age">Вік дитини</label>
              <input id="ks-age" style={inp} type="number" min={5} max={18} value={f.childAge} onChange={set('childAge')} required />
            </div>
            <div>
              <label style={lab} htmlFor="ks-city">Місто або село</label>
              <input id="ks-city" style={inp} value={f.city} onChange={set('city')} required maxLength={80} />
            </div>
          </div>

          <label style={lab} htmlFor="ks-group">Вікова група</label>
          <select id="ks-group" style={inp} value={f.ageGroup} onChange={set('ageGroup')} required>
            <option value="">— оберіть —</option>
            {AGE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>

          <label style={lab} htmlFor="ks-title">Назва (необов’язково)</label>
          <input id="ks-title" style={inp} value={f.title} onChange={set('title')} maxLength={120} />

          <label style={lab} htmlFor="ks-text">Скоромовка — від 1 до {MAX_LINES} рядків</label>
          <textarea id="ks-text" style={{ ...inp, minHeight: 140, lineHeight: 1.5 }} value={f.text} onChange={set('text')} required maxLength={MAX_CHARS} />
          <p style={{ margin: '6px 0 0', fontSize: 15, color: lines > MAX_LINES || f.text.length > MAX_CHARS ? NAVY : MUTED, fontWeight: lines > MAX_LINES ? 800 : 400 }}>
            Рядків: {lines} з {MAX_LINES} · знаків: {f.text.length} з {MAX_CHARS}
          </p>

          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', margin: '18px 0', fontSize: 17, cursor: 'pointer' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 24, height: 24, marginTop: 2, flex: '0 0 auto' }} required />
            <span>Я — законний представник дитини{role === 'teacher' ? ' або маю згоду батьків' : ''}. Погоджуюся з <a href="#polozhennia" style={{ color: NAVY, fontWeight: 700 }}>положенням конкурсу</a>, з публікацією та озвученням скоромовки на Балабонах і з публікацією імені, віку й міста дитини. Прізвище дитини не публікується.</span>
          </label>

          <button type="submit" disabled={busy || s.state !== 'open'} style={{ ...btn, opacity: busy || s.state !== 'open' ? 0.55 : 1 }}>{busy ? 'Надсилаю…' : 'Подати скоромовку'}</button>
          {msg && <p role="status" style={{ margin: '14px 0 0', fontWeight: 700, color: NAVY, background: msg.ok ? '#fff7e8' : BORDER, padding: '12px 16px', borderRadius: 12 }}>{msg.t}</p>}
        </form>
      )}

      {s.entries.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <h3 style={{ color: NAVY, margin: '0 0 10px', fontSize: 22 }}>Ваші подані скоромовки</h3>
          {s.entries.map((e) => (
            <div key={e.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `6px solid ${GOLD}`, borderRadius: 14, padding: '12px 16px', margin: '8px 0' }}>
              <div style={{ fontSize: 15, color: MUTED }}>№ {e.id} · {e.child_name}, {e.child_age} р. · {groupLabel(e.age_group)}</div>
              {e.title && <b style={{ color: NAVY }}>{e.title}</b>}
              <div style={{ whiteSpace: 'pre-line', fontSize: 19 }}>{e.body}</div>
            </div>
          ))}
          <p style={{ fontSize: 15, color: MUTED }}>Цифрові сертифікати учасників з’являться тут після {KIDS_CONTEST.resultsText.replace(' року', '')}.</p>
        </div>
      )}
    </div>
  )
}
