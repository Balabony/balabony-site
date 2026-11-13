'use client'
// 13.11.2026: /admin/afisha — вставити лист-анонс → ШІ розкладає по полях → перевірити → «Опублікувати».
// Публікується одразу на https://balabony.com/afisha. Формати доступності — лише ті, що названі в листі.
import { useEffect, useState } from 'react'

const GOLD = '#f5a623', DARK = '#0d1b2a', FONT = "'Montserrat', Arial, sans-serif"
type Item = { id?: string; kind: 'event' | 'film'; date: string; time?: string | null; title: string; category?: string | null; venue?: string | null; city?: string | null; studio?: string | null; genre?: string | null; director?: string | null; cast_text?: string | null; about?: string | null; book?: string | null; trailer?: string | null; source?: string | null; distributor?: string | null; access: string[]; published?: boolean }
const EMPTY: Item = { kind: 'film', date: '', title: '', access: [] }
const ACC: [string, string][] = [['audio', 'Аудіодескрипція'], ['subs', 'Розширені субтитри'], ['sign', 'Жестова мова'], ['wheel', 'Доступ на візку'], ['braille', 'Брайль']]
const F: [keyof Item, string, boolean?][] = [['date', 'Дата (13.11.2026 або 2026-11-13)'], ['time', 'Час (для подій)'], ['title', 'Назва'], ['category', 'Тип: Кіно / Вистава / Читання…'], ['venue', 'Місце'], ['city', 'Місто'], ['studio', 'Студія'], ['genre', 'Жанр'], ['director', 'Режисер'], ['cast_text', 'Актори / голоси'], ['about', 'Опис', true], ['book', 'Як потрапити (квитки, телефон)', true], ['trailer', 'Трейлер (YouTube)'], ['source', 'Джерело (сайт)'], ['distributor', 'Дистрибʼютор / організатор']]
const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #33465f', background: '#0a1628', color: '#f5f0e8', font: 'inherit', fontSize: 15 }

export default function AfishaAdmin() {
  const [text, setText] = useState('')
  const [it, setIt] = useState<Item>(EMPTY)
  const [list, setList] = useState<Item[]>([])
  const [busy, setBusy] = useState(''), [msg, setMsg] = useState('')
  const load = () => fetch('/api/admin/afisha').then((r) => r.json()).then((d) => setList(d.items || []))
  useEffect(() => { load() }, [])
  const call = async (body: object) => { const r = await fetch('/api/admin/afisha', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Помилка'); return d }
  const parse = async () => { setBusy('parse'); setMsg(''); try { const d = await call({ action: 'parse', text }); setIt({ ...EMPTY, ...d.item }); setMsg('Розібрано. Перевірте поля й натисніть «Опублікувати».') } catch (e) { setMsg((e as Error).message) } setBusy('') }
  const save = async () => {
    // 13.11.2026: кнопка не блокується мовчки — пояснюємо, чого бракує; дата приймається й як 13.11.2026
    let date = String(it.date || '').trim()
    const m = date.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/)
    if (m) date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    if (!it.title) { setMsg('Впишіть назву.'); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setMsg('Впишіть дату, наприклад 13.11.2026 або 2026-11-13.'); return }
    setBusy('save'); setMsg(''); try { await call({ action: 'save', item: { ...it, date } }); setMsg('Опубліковано на balabony.com/afisha'); setIt(EMPTY); setText(''); load() } catch (e) { setMsg((e as Error).message) } setBusy('') }
  const del = async (id?: string) => { if (!id || !window.confirm('Прибрати з афіші?')) return; await call({ action: 'delete', id }); load() }
  const set = (k: keyof Item, v: unknown) => setIt((x) => ({ ...x, [k]: v }))
  return (
    <main style={{ background: DARK, minHeight: '100vh', color: '#f5f0e8', fontFamily: FONT, padding: '28px 20px 60px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, margin: '0 0 6px' }}>Афіша без барʼєрів</h1>
        <p style={{ margin: '0 0 18px', color: '#c9d4e4' }}>Вставте лист-анонс (напр. від Kinomania) → «Розібрати» → перевірте поля → «Опублікувати». Сторінка: <a href="/afisha" target="_blank" rel="noreferrer" style={{ color: GOLD }}>balabony.com/afisha</a></p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder="Текст листа повністю…" style={{ ...inp, resize: 'vertical' }} />
        <p><button type="button" onClick={parse} disabled={!!busy} style={{ background: GOLD, color: '#1a1206', border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' }}>{busy === 'parse' ? 'Розбираю…' : 'Розібрати лист'}</button></p>
        <div style={{ background: '#13243d', borderRadius: 12, padding: 18, display: 'grid', gap: 10 }}>
          <label>Що це: <select value={it.kind} onChange={(e) => set('kind', e.target.value)} style={{ ...inp, width: 'auto' }}><option value="film">Фільм у прокаті («Скоро в кіно»)</option><option value="event">Подія з датою й місцем</option></select></label>
          {F.map(([k, l, big]) => <label key={k} style={{ display: 'grid', gap: 4, fontSize: 14 }}>{l}{big ? <textarea rows={3} value={String(it[k] ?? '')} onChange={(e) => set(k, e.target.value)} style={inp} /> : <input value={String(it[k] ?? '')} onChange={(e) => set(k, e.target.value)} style={inp} />}</label>)}
          <fieldset style={{ border: '1px solid #33465f', borderRadius: 8 }}><legend>Формати доступності (лише підтверджені організатором)</legend>
            {ACC.map(([k, l]) => <label key={k} style={{ marginRight: 16, whiteSpace: 'nowrap' }}><input type="checkbox" checked={it.access.includes(k)} onChange={(e) => set('access', e.target.checked ? [...it.access, k] : it.access.filter((a) => a !== k))} /> {l}</label>)}
          </fieldset>
          <p style={{ margin: 0 }}><button type="button" onClick={save} disabled={!!busy} style={{ background: '#34d399', color: '#04241a', border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' }}>{busy === 'save' ? 'Публікую…' : it.id ? 'Зберегти зміни' : 'Опублікувати'}</button> {it.id && <button type="button" onClick={() => setIt(EMPTY)} style={{ marginLeft: 8 }}>Скасувати</button>}</p>
          {msg && <p role="status" style={{ margin: 0, color: GOLD }}>{msg}</p>}
        </div>
        <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>Уже на афіші</h2>
        {list.length === 0 && <p style={{ color: '#9fb0c8' }}>Поки порожньо. (Перші анонси вписані в код сторінки й тут не показуються.)</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {list.map((x) => <li key={x.id} style={{ background: '#13243d', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ color: GOLD, minWidth: 96 }}>{x.date}</span><b style={{ flex: 1 }}>{x.title}</b><span style={{ color: '#9fb0c8' }}>{x.kind === 'film' ? 'Кіно' : x.category || 'Подія'}</span><button type="button" onClick={() => setIt({ ...EMPTY, ...x, access: x.access || [] })}>Редагувати</button><button type="button" onClick={() => del(x.id)}>Прибрати</button></li>)}
        </ul>
      </div>
    </main>
  )
}
