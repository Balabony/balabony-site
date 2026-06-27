'use client'

import { useEffect, useMemo, useState } from 'react'

type Char = { key: string; label: string; look: string }
type Scene = { key: string; label: string }
type Ep = { id: string; slug: string; title: string; episode_number: number | null }

const BG = '#0a1628'
const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

const box: React.CSSProperties = { background: '#101d33', border: '1px solid #22304d', borderRadius: 12, padding: 18, marginBottom: 22 }
const btn = (bg: string, on = true): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 8, background: on ? bg : '#33405e',
  color: '#fff', border: 'none', fontWeight: 700, cursor: on ? 'pointer' : 'default',
  fontFamily: FONT, fontSize: 14,
})
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8,
  background: '#0c1830', color: '#e8e8e8', border: '1px solid #33405e', fontFamily: FONT, fontSize: 14,
}

export default function TyshaCoversPage() {
  const [chars, setChars] = useState<Char[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [eps, setEps] = useState<Ep[]>([])

  const [charKey, setCharKey] = useState('')
  const [lookText, setLookText] = useState('')

  const [refCandidates, setRefCandidates] = useState<string[]>([])
  const [refUrl, setRefUrl] = useState('')
  const [refInput, setRefInput] = useState('')

  const [sceneKey, setSceneKey] = useState('')
  const [sceneText, setSceneText] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const [assignEp, setAssignEp] = useState('')

  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  // Ланцюжкова правка («Доправити цей кадр»)
  const [editText, setEditText] = useState('')
  const [editMax, setEditMax] = useState(false)

  // Трійця друзів (FLUX.2 мульти-референс) — URL еталонів підставлені.
  const [trioM, setTrioM] = useState('https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/tysha-gen/maksym-ref-417595-1782551508689.jpg')
  const [trioR, setTrioR] = useState('https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/tysha-gen/roman-ref-389319-1782551985471.jpg')
  const [trioS, setTrioS] = useState('https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/tysha-gen/sashko-ref-1325429-1782552264025.jpg')
  const [trioScene, setTrioScene] = useState('')
  const [warScene, setWarScene] = useState('')

  useEffect(() => {
    fetch('/api/admin/generate-tysha-cover').then(r => r.json()).then(d => {
      setChars(d.characters || []); setScenes(d.scenes || [])
    }).catch(() => setErr('Не вдалося завантажити персонажів'))
    fetch('/api/admin/tysha-list').then(r => r.json()).then(d => setEps(d.items || [])).catch(() => {})
  }, [])

  const selectedChar = useMemo(() => chars.find(c => c.key === charKey), [chars, charKey])

  function pickChar(key: string) {
    setCharKey(key)
    const c = chars.find(x => x.key === key)
    setLookText(c?.look ?? '')
    setRefCandidates([]); setRefUrl(''); setCoverUrl(''); setErr(''); setMsg('')
  }

  async function genReference() {
    if (!charKey) { setErr('Обери персонажа'); return }
    setErr(''); setMsg(''); setBusy('ref')
    try {
      const r = await fetch('/api/admin/generate-tysha-cover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ mode: 'reference', character: charKey, description: lookText }),
      })
      const d = await r.json()
      if (d.url) setRefCandidates(prev => [d.url, ...prev])
      else setErr(d.error || 'Помилка генерації еталона')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  function applyRefInput() {
    const u = refInput.trim()
    if (!u) { setErr('Встав URL еталона'); return }
    setRefUrl(u); setErr('')
  }

  async function genCover() {
    if (!refUrl) { setErr('Спершу обери еталонне обличчя'); return }
    if (!sceneKey && !sceneText.trim()) { setErr('Обери або опиши сцену'); return }
    setErr(''); setMsg(''); setBusy('cover')
    try {
      const r = await fetch('/api/admin/generate-tysha-cover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ mode: 'cover', character: charKey, referenceImageUrl: refUrl, scene: sceneKey, sceneText }),
      })
      const d = await r.json()
      if (d.url) setCoverUrl(d.url)
      else setErr(d.error || 'Помилка генерації обкладинки')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function refineCover() {
    if (!coverUrl) { setErr('Спершу згенеруй обкладинку'); return }
    if (!editText.trim()) { setErr('Опиши, що доправити'); return }
    setErr(''); setMsg(''); setBusy('refine')
    try {
      // Правка ПОВЕРХ поточного кадру: основа = сам coverUrl, rawEdit, зберігаємо кадр.
      const r = await fetch('/api/admin/generate-tysha-cover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({
          mode: 'cover', character: charKey, referenceImageUrl: coverUrl,
          sceneText: editText, rawEdit: true, model: editMax ? 'max' : 'pro',
        }),
      })
      const d = await r.json()
      if (d.url) { setCoverUrl(d.url); setEditText('') }
      else setErr(d.error || 'Помилка правки')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function genTrio() {
    if (!trioM.trim() || !trioR.trim() || !trioS.trim()) { setErr('Потрібні всі три URL еталонів'); return }
    setErr(''); setMsg(''); setBusy('trio')
    try {
      const r = await fetch('/api/admin/generate-tysha-cover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ mode: 'trio', refMaksym: trioM, refRoman: trioR, refSashko: trioS, sceneText: trioScene }),
      })
      const d = await r.json()
      if (d.url) { setCoverUrl(d.url); setMsg('Трійцю згенеровано — нижче можна доправити кадр і присвоїти серії') }
      else setErr(d.error || 'Помилка генерації трійці')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function genWarSolo() {
    if (!trioM.trim()) { setErr('Потрібен URL еталона Максима'); return }
    setErr(''); setMsg(''); setBusy('war')
    try {
      const r = await fetch('/api/admin/tysha-trio-gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ solo: true, refMaksym: trioM, sceneText: warScene }),
      })
      const d = await r.json()
      if (d.url) { setCoverUrl(d.url); setMsg('Максим-воїн готовий — вище можна присвоїти серії') }
      else setErr(d.error || 'Помилка Gemini')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function genGemini() {
    if (!trioM.trim() || !trioR.trim() || !trioS.trim()) { setErr('Потрібні всі три URL еталонів'); return }
    setErr(''); setMsg(''); setBusy('gemini')
    try {
      const r = await fetch('/api/admin/tysha-trio-gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ refMaksym: trioM, refRoman: trioR, refSashko: trioS, sceneText: trioScene }),
      })
      const d = await r.json()
      if (d.url) { setCoverUrl(d.url); setMsg('Gemini-трійцю згенеровано — вище можна доправити й присвоїти серії') }
      else setErr(d.error || 'Помилка Gemini')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function genCollage() {
    if (!trioM.trim() || !trioR.trim() || !trioS.trim()) { setErr('Потрібні всі три URL еталонів'); return }
    setErr(''); setMsg(''); setBusy('collage')
    try {
      const r = await fetch('/api/admin/tysha-trio-collage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ refMaksym: trioM, refRoman: trioR, refSashko: trioS }),
      })
      const d = await r.json()
      if (d.url) { setCoverUrl(d.url); setMsg('Колаж зібрано (точні обличчя) — вище можна присвоїти серії') }
      else setErr(d.error || 'Помилка колажу')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  async function assignCover() {
    if (!coverUrl) { setErr('Спершу згенеруй обкладинку'); return }
    if (!assignEp) { setErr('Обери серію'); return }
    setErr(''); setMsg(''); setBusy('assign')
    try {
      const r = await fetch(`/api/admin/content/${assignEp}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ cover_url: coverUrl }),
      })
      const d = await r.json()
      if (r.ok) { const ep = eps.find(e => e.id === assignEp); setMsg(`Обкладинку присвоєно: ${ep?.title ?? assignEp}`) }
      else setErr(d.error || 'Не вдалося присвоїти')
    } catch { setErr('Помилка мережі') } finally { setBusy('') }
  }

  return (
    <div style={{ minHeight: '100dvh', background: BG, color: '#e8e8e8', fontFamily: FONT }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 22px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Обкладинки «Тиша»</h1>
        <p style={{ opacity: 0.75, marginBottom: 20, lineHeight: 1.5, fontSize: 14 }}>
          Двокроковий потік: <b>еталонне обличчя</b> (flux-1.1-pro) → <b>обкладинка 16:9</b> у сцені
          (flux-kontext-pro тримає те саме обличчя). Серії 1-3 — портрети друзів; серія 4+ — Максим на війні.
        </p>

        {err && <div style={{ background: '#5b1a1a', padding: 12, borderRadius: 8, marginBottom: 16 }}>{err}</div>}
        {msg && <div style={{ background: '#143d22', padding: 12, borderRadius: 8, marginBottom: 16, color: '#9ff0b8' }}>{msg}</div>}

        {/* КРОК 1 — ПЕРСОНАЖ + ЕТАЛОН */}
        <section style={box}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 12 }}>1. Персонаж і еталонне обличчя</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {chars.map(c => (
              <button key={c.key} onClick={() => pickChar(c.key)} style={btn(charKey === c.key ? GOLD : '#22304d')}>
                {c.label}
              </button>
            ))}
          </div>

          {selectedChar && (
            <>
              <label style={{ fontSize: 13, opacity: 0.7, display: 'block', marginBottom: 6 }}>Опис вигляду (можна правити перед генерацією):</label>
              <textarea value={lookText} onChange={e => setLookText(e.target.value)} rows={4} style={{ ...input, marginBottom: 12, resize: 'vertical', lineHeight: 1.5 }} />
              <button onClick={genReference} disabled={busy === 'ref'} style={btn('#2E75B6', busy !== 'ref')}>
                {busy === 'ref' ? 'Генерую…' : '+ Згенерувати еталон'}
              </button>
              <span style={{ fontSize: 12, opacity: 0.55, marginLeft: 10 }}>тисни кілька разів — обери найкраще обличчя</span>

              {refCandidates.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 14 }}>
                  {refCandidates.map((u, i) => (
                    <div key={i} onClick={() => setRefUrl(u)} style={{ cursor: 'pointer', border: refUrl === u ? `3px solid ${GOLD}` : '3px solid transparent', borderRadius: 10, overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={`еталон ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                      <div style={{ textAlign: 'center', padding: 4, fontSize: 12, background: refUrl === u ? GOLD : '#1a2236', color: refUrl === u ? '#0a1628' : '#aaa', fontWeight: 700 }}>
                        {refUrl === u ? 'обрано ✓' : 'обрати'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <input value={refInput} onChange={e => setRefInput(e.target.value)} placeholder="…або встав URL збереженого еталона" style={input} />
                <button onClick={applyRefInput} style={btn('#22304d')}>Застосувати</button>
              </div>
              {refUrl && <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8, wordBreak: 'break-all' }}>Еталон: {refUrl}</p>}
            </>
          )}
        </section>

        {/* КРОК 2 — ОБКЛАДИНКА */}
        <section style={{ ...box, opacity: refUrl ? 1 : 0.5 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 12 }}>2. Обкладинка 16:9</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={sceneKey} onChange={e => setSceneKey(e.target.value)} style={{ ...input, width: 'auto', minWidth: 220 }}>
              <option value="">— обери сцену —</option>
              {scenes.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button onClick={genCover} disabled={!refUrl || busy === 'cover'} style={btn(GOLD, !!refUrl && busy !== 'cover')}>
              {busy === 'cover' ? 'Генерую…' : 'Згенерувати обкладинку'}
            </button>
          </div>
          <input value={sceneText} onChange={e => setSceneText(e.target.value)} placeholder="…або опиши сцену словами (англ. краще; переб'є пресет)" style={{ ...input, marginBottom: 12 }} />

          {coverUrl && (
            <div style={{ maxWidth: 380, border: '2px solid #22304d', borderRadius: 8, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="обкладинка" style={{ width: '100%', display: 'block', aspectRatio: '3 / 4', objectFit: 'cover' }} />
            </div>
          )}

          {coverUrl && (
            <div style={{ marginTop: 14, padding: 14, background: '#0c1830', border: '1px solid #22304d', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#cdd6e6', marginBottom: 4 }}>Доправити цей кадр (одна зміна за раз)</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, lineHeight: 1.5 }}>
                Правка йде ПОВЕРХ кадру вище й зберігає обличчя. Дроби складне на кроки:
                спершу одяг, тоді каска, тоді фон. Англійською надійніше. Приклад:
                <i> «Put a combat helmet on his head»</i>.
              </div>
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                placeholder="напр. Erase the name patch, make the chest blank"
                style={{ ...input, marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={refineCover} disabled={busy === 'refine'} style={btn('#2E75B6', busy !== 'refine')}>
                  {busy === 'refine' ? 'Правлю…' : 'Застосувати правку →'}
                </button>
                <label style={{ fontSize: 13, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editMax} onChange={e => setEditMax(e.target.checked)} />
                  якісніше (kontext-max, для впертих правок)
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ТРІЙЦЯ ДРУЗІВ */}
        <section style={box}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 6 }}>Трійця друзів (3 в одному кадрі)</h2>
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12, lineHeight: 1.5 }}>
            FLUX.2 мульти-референс: бере три еталони й ставить друзів разом (Максим зліва, Роман у центрі, Сашко справа).
            URL уже підставлені. Обличчя будуть близькі до еталонів, але можливе невелике «попливання».
            Результат з'явиться у блоці обкладинки вище — там само доправляй і присвоюй серії.
          </p>
          <input value={trioM} onChange={e => setTrioM(e.target.value)} placeholder="URL еталона Максима" style={{ ...input, marginBottom: 8, fontSize: 12 }} />
          <input value={trioR} onChange={e => setTrioR(e.target.value)} placeholder="URL еталона Романа" style={{ ...input, marginBottom: 8, fontSize: 12 }} />
          <input value={trioS} onChange={e => setTrioS(e.target.value)} placeholder="URL еталона Сашка" style={{ ...input, marginBottom: 10, fontSize: 12 }} />
          <input value={trioScene} onChange={e => setTrioScene(e.target.value)} placeholder="опис сцени (англ., необов'язково; напр. standing in a schoolyard)" style={{ ...input, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={genGemini} disabled={busy === 'gemini'} style={btn('#d97706', busy !== 'gemini')}>
              {busy === 'gemini' ? 'Gemini малює…' : 'Трійця разом (Gemini, твої обличчя) ★'}
            </button>
            <button onClick={genCollage} disabled={busy === 'collage'} style={btn('#1b9e6f', busy !== 'collage')}>
              {busy === 'collage' ? 'Збираю колаж…' : 'Колаж (склейка фото)'}
            </button>
            <button onClick={genTrio} disabled={busy === 'trio'} style={btn('#9b6dff', busy !== 'trio')}>
              {busy === 'trio' ? 'Генерую…' : 'FLUX.2 (обличчя приблизні)'}
            </button>
          </div>
          <p style={{ fontSize: 11, opacity: 0.55, marginTop: 8, lineHeight: 1.5 }}>
            <b>Gemini ★</b> — зводить твої 3 фото в один теплий кадр «друзі разом», обличчя твої (раджу це).
            <b> Колаж</b> — механічна склейка. <b>FLUX.2</b> — мальоване, обличчя лише схожі.
            Опис сцени діє на Gemini і FLUX.2.
          </p>
        </section>

        {/* МАКСИМ НА ВІЙНІ (Gemini, solo) */}
        <section style={box}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 6 }}>Максим на війні (Gemini, вертикаль 3:4)</h2>
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12, lineHeight: 1.5 }}>
            Один Максим у воєнній формі, вертикально, обличчя з еталона. URL Максима береться з блоку «Трійця» вище.
            Опиши сцену англійською або обери пресет (порожнє = зруйноване село за замовчуванням).
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {[
              ['Село в руїнах', 'weary serious face, blurred destroyed war-torn village behind him, overcast cold light, dust haze'],
              ['Окоп', 'tired face, in a muddy trench at the front line, grey overcast sky, smoke in the distance'],
              ['Нічний блокпост', 'serious face at a night checkpoint, cold blue light, distant fires, dark mood'],
              ['Втома після бою', 'exhausted hollow stare, dirt on his face, ruined building behind, cold grey light'],
            ].map(([label, val]) => (
              <button key={label} onClick={() => setWarScene(val)} style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: 12, cursor: 'pointer', opacity: warScene === val ? 1 : 0.7, borderColor: warScene === val ? GOLD : undefined }}>
                {label}
              </button>
            ))}
          </div>
          <input value={warScene} onChange={e => setWarScene(e.target.value)} placeholder="опис воєнної сцени (англ.), або обери пресет вище" style={{ ...input, marginBottom: 12 }} />
          <button onClick={genWarSolo} disabled={busy === 'war'} style={btn('#b45309', busy !== 'war')}>
            {busy === 'war' ? 'Gemini малює…' : 'Згенерувати Максима-воїна ★'}
          </button>
        </section>

        {/* КРОК 3 — ПРИСВОЇТИ */}
        <section style={{ ...box, opacity: coverUrl ? 1 : 0.5 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 12 }}>3. Присвоїти серії</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={assignEp} onChange={e => setAssignEp(e.target.value)} style={{ ...input, width: 'auto', minWidth: 260 }}>
              <option value="">— обери серію —</option>
              {eps.map(e => <option key={e.id} value={e.id}>{e.episode_number ? `${e.episode_number}. ` : ''}{e.title}</option>)}
            </select>
            <button onClick={assignCover} disabled={!coverUrl || busy === 'assign'} style={btn('#1b5e20', !!coverUrl && busy !== 'assign')}>
              {busy === 'assign' ? 'Зберігаю…' : 'Присвоїти обкладинку'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
