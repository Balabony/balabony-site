'use client'

import { useState } from 'react'

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = 'Georgia, "Times New Roman", serif'

const UI = {
  labelText: '#f5f0e8',
  fieldBorder: 'rgba(143,163,196,0.28)',
  chipBg: 'rgba(255,255,255,0.05)',
  chipBorder: 'rgba(143,163,196,0.32)',
  chipText: '#f5f0e8',
  chipOnBg: 'rgba(239,159,39,0.18)',
  chipOnBorder: '#ef9f27',
  chipOnText: '#ef9f27',
  solidBg: '#ef9f27',
  solidBorder: '#d98324',
  solidText: '#0a1628',
}


export type Feedback = {
  ease_rating: number | null
  inconvenience: string | null
  topics: string[] | null
  topics_other: string | null
  helps_write: string[] | null
  audio_interest: string | null
  wishes: string | null
  updated_at: string | null
}

const TOPICS = [
  'Життєві історії',
  'Родина й діти',
  'Село й традиції',
  'Кохання',
  'Війна і люди',
  'Містика',
  'Гумор',
  'Історична проза',
  'Пригоди',
  'Казки для дітей',
]

const HELPS = [
  'Більше читачів',
  'Вища винагорода',
  'Редакторська підтримка',
  'Зрозумілі дедлайни й теми',
  'Аудіоверсії моїх творів',
  'Конкурси з гонорарами',
  'Спілкування з іншими авторами',
  'Спілкування з читачами',
]

const AUDIO = ['Так, цікавить', 'Можливо, пізніше', 'Ні, тільки текст']

export default function AuthorSurvey({ initial }: { initial: Feedback }) {
  const answered = initial.updated_at !== null
  const [open, setOpen] = useState(!answered)
  const [ease, setEase] = useState<number | null>(initial.ease_rating)
  const [inconv, setInconv] = useState(initial.inconvenience ?? '')
  const [topics, setTopics] = useState<string[]>(initial.topics ?? [])
  const [topicsOther, setTopicsOther] = useState(initial.topics_other ?? '')
  const [helps, setHelps] = useState<string[]>(initial.helps_write ?? [])
  const [audio, setAudio] = useState(initial.audio_interest ?? '')
  const [wishes, setWishes] = useState(initial.wishes ?? '')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v])
  }

  async function save() {
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/author/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          easeRating: ease,
          inconvenience: inconv.trim() || null,
          topics,
          topicsOther: topicsOther.trim() || null,
          helpsWrite: helps,
          audioInterest: audio || null,
          wishes: wishes.trim() || null,
        }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) { setNote(data.error || 'Не вдалося зберегти.'); return }
      setNote('Дякуємо! Ваші відповіді допоможуть нам зробити платформу зручнішою.')
      setOpen(false)
    } catch {
      setNote('Немає звʼязку із сервером.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={{
      background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginTop: '1.5rem',
    }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.25rem' }}>
            Ваша думка про платформу
          </h2>
          <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: 0 }}>
            Кілька запитань — щоб ми знали, що виправити й що писати далі.
          </p>
        </div>
        {answered && !open && (
          <button type="button" onClick={() => setOpen(true)} style={secondaryBtn}>Змінити відповіді</button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={block}>
            <div style={label}>Наскільки зручно користуватися кабінетом?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setEase(n)} style={ease === n ? pickOn : pickOff}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ color: BRAND.muted, fontSize: '0.82rem', marginTop: 6 }}>1 — незручно, 5 — усе зрозуміло</p>
          </div>

          <div style={block}>
            <div style={label}>Що незручно або чого бракує?</div>
            <textarea
              value={inconv}
              onChange={e => setInconv(e.target.value)}
              rows={3}
              placeholder="Напишіть своїми словами"
              style={area}
            />
          </div>

          <div style={block}>
            <div style={label}>Про що вам цікаво писати?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TOPICS.map(t => (
                <button key={t} type="button" onClick={() => toggle(topics, setTopics, t)} style={topics.includes(t) ? pickOn : pickOff}>
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={topicsOther}
              onChange={e => setTopicsOther(e.target.value)}
              placeholder="Інше — впишіть"
              style={{ ...input, marginTop: 10 }}
            />
          </div>

          <div style={block}>
            <div style={label}>Що допомогло б вам писати більше?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {HELPS.map(h => (
                <button key={h} type="button" onClick={() => toggle(helps, setHelps, h)} style={helps.includes(h) ? pickOn : pickOff}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div style={block}>
            <div style={label}>Чи хочете аудіоверсії своїх творів?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AUDIO.map(a => (
                <button key={a} type="button" onClick={() => setAudio(a)} style={audio === a ? pickOn : pickOff}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div style={block}>
            <div style={label}>Побажання редакції</div>
            <textarea
              value={wishes}
              onChange={e => setWishes(e.target.value)}
              rows={3}
              placeholder="Усе, що вважаєте важливим"
              style={area}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={save} disabled={busy} style={primaryBtn}>
              {busy ? 'Зберігаю…' : 'Надіслати'}
            </button>
            {answered && (
              <button type="button" onClick={() => setOpen(false)} style={secondaryBtn}>Скасувати</button>
            )}
          </div>
        </div>
      )}

      {note && <p style={{ color: BRAND.text, fontSize: '0.9rem', marginTop: 12 }}>{note}</p>}

      {!open && !note && answered && (
        <p style={{ color: BRAND.text, fontSize: '0.9rem', marginTop: 12 }}>
          Дякуємо, ви вже відповіли. Можна змінити відповіді будь-коли.
        </p>
      )}
    </section>
  )
}

const block: React.CSSProperties = { marginBottom: '1.25rem' }

const label: React.CSSProperties = {
  fontSize: '0.95rem', color: '#f5f0e8', fontWeight: 700, marginBottom: 8,
  letterSpacing: '0.01em', overflowWrap: 'anywhere',
}

const input: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${UI.fieldBorder}`,
  borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: BRAND.text, fontSize: '0.95rem',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const area: React.CSSProperties = { ...input, resize: 'vertical' }

const pickOn: React.CSSProperties = {
  padding: '0.5rem 0.95rem', borderRadius: 999, border: `1.5px solid ${UI.chipOnBorder}`,
  background: UI.chipOnBg, color: UI.chipOnText, fontWeight: 700, fontSize: '0.88rem',
  cursor: 'pointer', fontFamily: 'inherit', overflowWrap: 'anywhere', textAlign: 'left',
}

const pickOff: React.CSSProperties = {
  padding: '0.5rem 0.95rem', borderRadius: 999, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.88rem',
  cursor: 'pointer', fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.3rem', borderRadius: 10, border: `1.5px solid ${UI.solidBorder}`,
  background: UI.solidBg, color: UI.solidText, fontWeight: 700,
  fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.6rem 1.1rem', borderRadius: 10, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit',
}
