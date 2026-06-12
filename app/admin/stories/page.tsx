'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import GeminiAnalyzer from '@/components/admin/GeminiAnalyzer'
import type { AnalysisResult } from '@/components/admin/GeminiAnalyzer'
import { analyzeEpisode } from '@/lib/episode-metrics'
import EditorialTools from '@/components/admin/EditorialTools'

const FONT       = "'Montserrat', Arial, sans-serif"
const GOLD       = '#f0a500'
const NAVY       = '#0f1e3a'
const NAVY_DEEP  = '#0a1628'
const JAMENDO_ID = 'a4f04bbe'

const GENRES = ['Казка', 'Оповідання', 'Детектив', 'Пригода', 'Романтика', 'Фантастика', 'Інше']

// ── Канонічний стиль для автозаповнення поля «Стиль та контекст» ──────────────
const STYLE_CTX = 'Тепла комедія характерів про живу українську мову. Двигун серії — зіткнення Панасових «інновацій» зі здоровим глуздом села. Дід Панас («Оце я вкляв!», синій блокнот), баба Ганя з ополоником («АНУ ЦИТЬ!»), Орися-«радіо», Мотря з картами, голова Григорій із синьою хусткою. Без сарказму й політичної злоби, без моралі в лоб. Композиція: гачок → основна частина (3–5 персонажів) → висновок. Останній рядок — «Приказка серії: …». Обсяг 9–10 хв (≈1350–1500 слів).'

interface PlannedEp { ep: number; season: number; title: string; desc: string }

// Заплановані нові серії 81–120 (81–87 — пріоритетні ідеї; 88–120 — резерв, звірено без дублів)
const PLANNED: PlannedEp[] = [
  { ep: 81, season: 5, title: 'Обрання сільського голови', desc: 'У Балабонах оголошують вибори голови: Григорій іде на новий термін, а проти нього несподівано висувається кандидат із гучною програмою. Дебати в клубі, агітація через Орисю-«радіо» та Панасові обіцянки перетворюють вибори на сільський фестиваль.' },
  { ep: 82, season: 5, title: 'Страшна вірус-інфекція у селі', desc: 'Селом шириться чутка про «страшну інфекцію», і Балабони йдуть на «карантин»: Мотря лікує картами, Панас винаходить «знезаражувач», Віра повертає всіх до здорового глузду. «Епідемія» виявляється звичайною застудою після купання в холодному ставку.' },
  { ep: 83, season: 5, title: 'Забудовники проти села', desc: 'До Балабонів приїздять «товстосуми з міста» з планом знести хати під багатоповерхівки. Село піднімається на захист: Григорій воює паперами, Панас «винаходить» причини неможливості будівництва, Орися мобілізує громаду. Забудовники відступають перед єдністю.' },
  { ep: 84, season: 5, title: 'Дід Панас зайнявся спортом', desc: 'Начитавшись про ЗОЖ від Аліни, Панас оголошує «спортивну революцію»: тренажери з відер, «протеїн» із гороху. Усе село втягується, поки Ганя рахує побиті городи. Фініш: найкращий спорт у Балабонах — це косовиця й утеча від ополоника.' },
  { ep: 85, season: 5, title: 'Баба Ганя пише книгу рецептів', desc: 'Ганя береться писати «Книгу балабонських рецептів», і село стає гастрономічним полем бою: кожна господиня вимагає, щоб її борщ був «канонічним». Книга виходить — і головним рецептом виявляється тепло, з яким готують.' },
  { ep: 86, season: 5, title: 'Футбольний матч на селі', desc: 'Балабони викликають сусіднє село на футбол, і Панас стає «тренером-новатором» зі схемами в синьому блокноті. Воротар Стьопа, нападник Петро на велосипеді й коза-«талісман» творять хаос. Головна перемога — село грає разом.' },
  { ep: 87, season: 5, title: 'Розлучення Панаса і Гані (понарошку)', desc: 'Після чергової витівки Панас і Ганя демонстративно «розлучаються» й беруться «ділити майно»: ополоник, блокнот, корову, кота. Орися веде «репортаж», Мотря «віщує примирення». Під вечір обоє згадують, що одне без одного не варять навіть борщу — і «розлучення» завершується вечерею вдвох.' },
  { ep: 88, season: 5, title: 'Зірка в Балабонах', desc: 'У село на концерт приїздить відома співачка; Панас «озвучує» сцену з відер і старих колонок.' },
  { ep: 89, season: 5, title: 'День Балабонів', desc: 'Суперечка про дату заснування села перетворюється на свято; Тодось згадує легенду про Мамая.' },
  { ep: 90, season: 5, title: 'Перший дзвоник', desc: 'Сільській школі бракує учнів — і село «нагонить клас» усіма правдами й неправдами.' },
  { ep: 91, season: 5, title: 'Газ у Балабони', desc: 'Газифікація грузне в бюрократії, і Панас винаходить «біогаз із капусти».' },
  { ep: 92, season: 5, title: 'Перепис у Балабонах', desc: 'Переписувачі приїздять у село; Орися «допомагає», а Панас вписує у форму свої винаходи.' },
  { ep: 93, season: 5, title: 'Пожежна команда', desc: 'Стьопа стає «брандмайстром» добровільної пожежної дружини з відром і мотопомпою Панаса.' },
  { ep: 94, season: 5, title: 'Виставка гарбузів', desc: 'Конкурс на найбільший гарбуз; Панасів «селекційний монстр» лякає півсела.' },
  { ep: 95, season: 5, title: 'Бджолиний рій', desc: 'У Тодося тікає рій, і Панас будує «дрон для бджіл» із вентилятора.' },
  { ep: 96, season: 5, title: 'Велике відключення', desc: 'Вечір без світла; Панас запускає генератор із велосипеда, село співає при свічках.' },
  { ep: 97, season: 5, title: 'Нова пошта в селі', desc: 'У Балабонах відкривають пункт видачі посилок — пряма конкуренція поштарю Петру.' },
  { ep: 98, season: 5, title: 'Мандрівний театр', desc: 'Бродячий театр застрягає в селі, і Балабони ставлять власну виставу.' },
  { ep: 99, season: 5, title: 'Музей Балабонів', desc: 'Село сперечається, чий експонат найстаріший і гідний «музею».' },
  { ep: 100, season: 5, title: 'Гості здалеку', desc: 'Іноземні волонтери приїздять у село; мовні непорозуміння й спільний борщ.' },
  { ep: 101, season: 6, title: 'Міс Балабони', desc: 'Конкурс краси, у фінал якого несподівано виходять сільські бабусі.' },
  { ep: 102, season: 6, title: 'Толока на дорогу', desc: 'Село гуртом лагодить вибоїну; Панас пропонує «асфальт із власного рецепту».' },
  { ep: 103, season: 6, title: 'Великдень у Балабонах', desc: 'Конкурс писанок; Отець Павло й Мотря змагаються за «найправильнішу» традицію.' },
  { ep: 104, season: 6, title: 'Сватання', desc: 'До сільської вдовиці шлють свати; Орися «веде перемовини» від обох сторін.' },
  { ep: 105, season: 6, title: 'День матері', desc: 'Чоловіки села беруться куховарити; Панас будує «машину для компліментів».' },
  { ep: 106, season: 6, title: 'Перший сніг', desc: 'Панас майструє «снігоприбиральник» із трактора й вентилятора.' },
  { ep: 107, season: 6, title: 'Йордан', desc: 'Водохреще біля ополонки; Панас занурюється в «термокостюмі» власного винаходу.' },
  { ep: 108, season: 6, title: 'Масниця', desc: 'Тиждень млинців і змагання, чий млинець тонший; Ганя проти всіх.' },
  { ep: 109, season: 6, title: 'Полювання Тодося', desc: '«Велике полювання» на кабана, що толочить городи, обертається комедією.' },
  { ep: 110, season: 6, title: 'Риболовний турнір', desc: 'Легенда про сома; Гена «Мільйонер» продає право вилову.' },
  { ep: 111, season: 6, title: 'Грибний сезон', desc: 'Хто більше; Панасів «грибний радар» зводить усіх з розуму.' },
  { ep: 112, season: 6, title: 'Сільське вино', desc: 'Дегустація домашнього вина переростає у філософські дебати.' },
  { ep: 113, season: 6, title: 'Лелеки повернулися', desc: 'Еколог кільцює лелек, а село «допомагає» так, що краще б не допомагало.' },
  { ep: 114, season: 6, title: 'Сонячне затемнення', desc: 'Оверко віщує кінець світу, а Панас «ловить тінь» для експерименту.' },
  { ep: 115, season: 6, title: 'Ветеринар приїхав', desc: 'Диспансеризація худоби; кози тікають, кури «не співпрацюють».' },
  { ep: 116, season: 6, title: 'Хрестини', desc: 'Кумівські перемовини; Павло й Мотря тягнуть кожен у свій бік традиції.' },
  { ep: 117, season: 6, title: 'Зустріч випускників', desc: 'Ностальгія; Григорій згадує бурхливу молодість, село сміється.' },
  { ep: 118, season: 6, title: 'Книга рекордів Балабонів', desc: 'Село встановлює «рекорди»: найдовший рушник, найбільший вареник.' },
  { ep: 119, season: 6, title: 'Сільське таксі', desc: '«Балабон-таксі» Панаса проти дільничного Миколи й здорового глузду.' },
  { ep: 120, season: 6, title: 'Купала', desc: 'Вінки, «цвіт папороті» й тепла містика літньої ночі.' },
]

const MOODS = [
  { label: 'Весела',       tags: 'happy folk acoustic' },
  { label: 'Ностальгічна', tags: 'melancholic ambient piano' },
  { label: 'Пригодницька', tags: 'adventure orchestral' },
  { label: 'Зустріч',      tags: 'romantic acoustic guitar' },
]

interface JTrack {
  id: string
  name: string
  duration: number
  artist_name: string
  audio: string
  image: string
}

// ── Reusable primitives ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children, right }: { label: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>{label}</span>
        {right && <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{right}</span>}
      </div>
      {children}
    </div>
  )
}

function SectionCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: NAVY_DEEP, flexShrink: 0, fontFamily: FONT }}>
          {n}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function fmtDur(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StoriesAdminPage() {
  // story fields
  const [title,        setTitle]        = useState('')
  const [season,       setSeason]       = useState('')
  const [episode,      setEpisode]      = useState('')
  const [character,    setCharacter]    = useState('')
  const [genre,        setGenre]        = useState(GENRES[0])
  const [summary,      setSummary]      = useState('')
  const [text,         setText]         = useState('')
  const [styleContext, setStyleContext] = useState('')

  // ── Черга нових серій 81–120 + перевірка дублів ────────────────────────────
  const [takenSlugs,  setTakenSlugs]  = useState<Set<string>>(new Set())
  const [takenTitles, setTakenTitles] = useState<Set<string>>(new Set())
  const [queueOpen,   setQueueOpen]   = useState(false)

  useEffect(() => {
    fetch('/api/admin/series')
      .then(r => r.json())
      .then((d: { series?: Array<{ slug?: string; title?: string }> }) => {
        const s = new Set<string>(); const t = new Set<string>()
        for (const row of d.series ?? []) {
          if (row.slug)  s.add(row.slug.toLowerCase())
          if (row.title) t.add(row.title.trim().toLowerCase())
        }
        setTakenSlugs(s); setTakenTitles(t)
      })
      .catch(() => {})
  }, [])

  const slugFor = (p: PlannedEp) => `s${p.season}e${String(p.ep).padStart(2, '0')}`
  const isTaken = (p: PlannedEp) =>
    takenSlugs.has(slugFor(p).toLowerCase()) || takenTitles.has(p.title.trim().toLowerCase())

  const pickPlanned = (p: PlannedEp) => {
    setTitle(p.title)
    setSeason(String(p.season))
    setEpisode(String(p.ep))
    setSummary(p.desc)
    setCharacter('Дід Панас')
    setStyleContext(STYLE_CTX)
    setQueueOpen(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // AI generation
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState('')

  // photo
  const [imgSrc,   setImgSrc]   = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // music
  const [mood,          setMood]          = useState(MOODS[0].label)
  const [tracks,        setTracks]        = useState<JTrack[]>([])
  const [musicLoading,  setMusicLoading]  = useState(false)
  const [musicError,    setMusicError]    = useState('')
  const [playingId,     setPlayingId]     = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<JTrack | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // export
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  // publish
  const [hasAudio,     setHasAudio]     = useState(false)
  const [isPremium,    setIsPremium]    = useState(false)
  const [publishState, setPublishState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [publishMsg,   setPublishMsg]   = useState('')
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null)

  const fileRef  = useRef<HTMLInputElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  // ── Photo handlers ────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { setImgSrc(ev.target?.result as string); setUrlDraft('') }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [loadFile])

  const handleUrlChange = (val: string) => {
    setUrlDraft(val)
    const t = val.trim()
    if (t.startsWith('http://') || t.startsWith('https://')) setImgSrc(t)
    else if (!t) setImgSrc('')
  }

  // ── Jamendo music ─────────────────────────────────────────────────────────

  const searchJamendo = async () => {
    const moodObj = MOODS.find(m => m.label === mood)
    if (!moodObj) return
    setMusicLoading(true); setTracks([]); setMusicError(''); setSelectedTrack(null)
    const audio = musicRef.current
    if (audio) { audio.pause(); setPlayingId(null); setIsAudioPlaying(false) }
    try {
      const u = new URL('https://api.jamendo.com/v3.0/tracks/')
      u.searchParams.set('client_id', JAMENDO_ID)
      u.searchParams.set('format', 'json')
      u.searchParams.set('limit', '5')
      u.searchParams.set('tags', moodObj.tags)
      u.searchParams.set('audioformat', 'mp32')
      const res = await fetch(u.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { results: JTrack[] } = await res.json()
      const results = data.results ?? []
      setTracks(results)
      if (results.length === 0) setMusicError('Нічого не знайдено. Спробуйте іншу настрій.')
    } catch {
      setMusicError('Помилка пошуку. Перевірте з\'єднання та спробуйте знову.')
    } finally {
      setMusicLoading(false)
    }
  }

  const togglePlay = (track: JTrack) => {
    const audio = musicRef.current
    if (!audio) return
    if (playingId === track.id) {
      if (audio.paused) { audio.play().catch(() => {}); setIsAudioPlaying(true) }
      else              { audio.pause(); setIsAudioPlaying(false) }
    } else {
      audio.src = track.audio
      audio.play().catch(() => {})
      setPlayingId(track.id)
      setIsAudioPlaying(true)
    }
  }

  // ── AI generation ────────────────────────────────────────────────────────

  const generateAI = async () => {
    setAiLoading(true); setAiError(''); setText('')
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, season, episode, character, genre, summary, styleContext }),
      })
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '')
        setAiError(msg || 'Помилка генерації')
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setText(acc)
      }
      acc += decoder.decode()
      setText(acc.trim())
    } catch {
      setAiError("Помилка з'єднання з API")
    } finally {
      setAiLoading(false)
    }
  }

  // ── Publish ──────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!title || !season || !episode) {
      setPublishMsg('Заповніть назву, сезон і номер серії'); setPublishState('error'); return
    }
    setPublishState('loading'); setPublishMsg('')
    try {
      const res = await fetch('/api/admin/series', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, season, episode, description: summary, hasAudio, analyzeReport: analysisData, isPremium }),
      })
      const data = await res.json() as { message?: string; error?: string }
      if (!res.ok) { setPublishMsg(data.error ?? 'Помилка'); setPublishState('error'); return }
      setPublishMsg(data.message ?? 'Опубліковано!')
      setPublishState('done')
    } catch {
      setPublishMsg("Помилка з'єднання"); setPublishState('error')
    }
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  const epNum = episode ? episode.padStart(2, '0') : ''
  const seasonEpLabel = [season, epNum ? `Серія ${epNum}` : ''].filter(Boolean).join(' · ')

  const exportText = (): string => {
    const lines = [
      '══════════════════════════════',
      `📖  ${title || '(без назви)'}`,
    ]
    if (seasonEpLabel) lines.push(`📺  ${seasonEpLabel}`)
    lines.push(`👤  ${character || '—'} · ${genre}`)
    if (selectedTrack) lines.push(`🎵  ${selectedTrack.name} — ${selectedTrack.artist_name}`)
    if (summary) lines.push(`\n📝  ${summary}`)
    lines.push('══════════════════════════════', '', text)
    return lines.join('\n')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText())
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2500)
    } catch { /* clipboard blocked */ }
  }

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const slug = (title || 'story').substring(0, 32).replace(/\s+/g, '_').replace(/[^\w_]/g, '')
  const fileBase = [season && `s${season.replace(/\D/g, '')}`, epNum && `ep${epNum}`, slug].filter(Boolean).join('_')

  const handleDownloadTxt  = () => downloadBlob(exportText(), `${fileBase}.txt`, 'text/plain;charset=utf-8')
  const handleDownloadJson = () => {
    const payload = {
      title, season, episode, character, genre, summary, text,
      coverUrl: urlDraft || (imgSrc.startsWith('http') ? imgSrc : ''),
      music: selectedTrack ? { id: selectedTrack.id, name: selectedTrack.name, artist: selectedTrack.artist_name, url: selectedTrack.audio } : null,
      wordCount, createdAt: new Date().toISOString(),
    }
    downloadBlob(JSON.stringify(payload, null, 2), `${fileBase}.json`, 'application/json;charset=utf-8')
  }

  const selectStyle: React.CSSProperties = { ...inputBase, appearance: 'none', cursor: 'pointer' }
  const isEmpty = !title && !text

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <audio ref={musicRef} onEnded={() => setIsAudioPlaying(false)} />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ━━━ Черга нових серій 81–120 ━━━ */}
        <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <button
            onClick={() => setQueueOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#f5f0e8', fontFamily: FONT,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📋</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Черга нових серій (81–120)</span>
              <span style={{ fontSize: 12, color: '#8899bb' }}>
                {PLANNED.filter(p => !isTaken(p)).length} вільних · {PLANNED.filter(p => isTaken(p)).length} вже створено
              </span>
            </span>
            <span style={{ fontSize: 18, color: '#8899bb', transform: queueOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>⌄</span>
          </button>

          {queueOpen && (
            <div style={{ maxHeight: 360, overflow: 'auto', padding: '0 12px 12px' }}>
              {PLANNED.map(p => {
                const taken = isTaken(p)
                return (
                  <button
                    key={p.ep}
                    onClick={() => !taken && pickPlanned(p)}
                    disabled={taken}
                    title={taken ? 'Вже створено — щоб не дублювати' : 'Заповнити форму цією серією'}
                    style={{
                      width: '100%', textAlign: 'left', marginBottom: 6,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: taken ? 'rgba(255,255,255,0.03)' : 'rgba(240,165,0,0.07)',
                      border: `1px solid ${taken ? 'rgba(255,255,255,0.06)' : 'rgba(240,165,0,0.25)'}`,
                      cursor: taken ? 'not-allowed' : 'pointer', fontFamily: FONT,
                      opacity: taken ? 0.55 : 1,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: taken ? '#667799' : GOLD, minWidth: 30 }}>{p.ep}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#f5f0e8' }}>{p.title}</span>
                      <span style={{ display: 'block', fontSize: 11, color: '#8899bb', marginTop: 2, lineHeight: 1.5 }}>
                        s{p.season}e{String(p.ep).padStart(2, '0')} · {p.desc.slice(0, 90)}{p.desc.length > 90 ? '…' : ''}
                      </span>
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap',
                      color: taken ? '#f87171' : '#9ae6b4', alignSelf: 'center',
                    }}>
                      {taken ? 'ВЖЕ Є' : 'ВІЛЬНО'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ━━━ SECTION 1 — Story Details ━━━ */}
        <SectionCard n={1} title="Деталі серії">
          <Field label="Назва серії">
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Наприклад: Балабон і Темний ліс" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Сезон" right="необов'язково">
              <input style={inputBase} value={season} onChange={e => setSeason(e.target.value)} placeholder="Напр.: 1" />
            </Field>
            <Field label="Серія №" right="необов'язково">
              <input style={inputBase} type="number" min={1} max={999} value={episode} onChange={e => setEpisode(e.target.value)} placeholder="Напр.: 5" />
            </Field>
            <Field label="Жанр">
              <select style={selectStyle} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY }}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Персонаж">
            <input style={inputBase} value={character} onChange={e => setCharacter(e.target.value)} placeholder="Ім'я персонажа або автора" />
          </Field>
          <Field label="Короткий опис / тизер">
            <textarea style={{ ...inputBase, height: 68, resize: 'vertical', lineHeight: 1.6 }} placeholder="2–3 речення, які читач побачить у превʼю..." value={summary} onChange={e => setSummary(e.target.value)} />
          </Field>
          <Field label="Стиль та контекст">
            <textarea
              style={{ ...inputBase, height: 120, resize: 'vertical', lineHeight: 1.65 }}
              placeholder="Вставте уривки попередніх серій або опишіть стиль, атмосферу, ключові деталі. Claude використає це для збереження єдиного голосу і стилю..."
              value={styleContext}
              onChange={e => setStyleContext(e.target.value)}
            />
          </Field>

          {/* AI generate button */}
          <button
            onClick={generateAI}
            disabled={aiLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: aiLoading ? 'rgba(240,165,0,0.45)' : 'linear-gradient(135deg, #f0a500 0%, #e8920a 100%)',
              color: NAVY_DEEP, border: 'none', borderRadius: 12,
              padding: '14px 18px', fontSize: 14, fontWeight: 700,
              cursor: aiLoading ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 16,
              boxShadow: aiLoading ? 'none' : '0 2px 12px rgba(240,165,0,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {aiLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke={NAVY_DEEP} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                Claude пише…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1 L10 6 L15 6 L11 9.5 L12.5 14.5 L8 11.5 L3.5 14.5 L5 9.5 L1 6 L6 6 Z" fill={NAVY_DEEP} opacity="0.9"/>
                </svg>
                Згенерувати текст (Claude AI)
              </>
            )}
          </button>

          {aiError && (
            <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
              {aiError}
            </div>
          )}

          <Field label="Текст серії" right={`${wordCount} слів · ${text.length} символів · ~${readMin} хв`}>
            <textarea style={{ ...inputBase, height: 300, resize: 'vertical', lineHeight: 1.75 }} placeholder="Вставте або введіть повний текст серії, або згенеруйте через Claude AI вище..." value={text} onChange={e => setText(e.target.value)} />
          </Field>

          {text.trim() && (() => {
            const m = analyzeEpisode(text)
            const color = m.ok ? '#2d8f4e' : (m.lengthState === 'ok' || m.structureOk) ? '#d4a017' : '#d94545'
            const chip = (label: string, good: boolean) => (
              <span style={{
                fontSize: 12, fontWeight: 700, fontFamily: FONT,
                color: good ? '#9ae6b4' : '#fca5a5',
                background: good ? 'rgba(45,143,78,0.14)' : 'rgba(217,69,69,0.14)',
                border: `1px solid ${good ? 'rgba(45,143,78,0.4)' : 'rgba(217,69,69,0.4)'}`,
                borderRadius: 999, padding: '3px 10px',
              }}>{good ? '✓' : '✗'} {label}</span>
            )
            return (
              <div style={{ margin: '12px 0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, fontFamily: FONT, color: '#fff', background: color, borderRadius: 999, padding: '4px 12px' }}>
                    ≈ {m.minutes} хв звучання · {m.words} слів
                  </span>
                  {chip('9–10 хв', m.lengthState === 'ok')}
                  {chip('гачок', m.hasHook)}
                  {chip('висновок', m.hasConclusion)}
                  {chip('діалоги', m.hasDialogue)}
                </div>
                {m.hints.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#9fb0c8', fontSize: 12, fontFamily: FONT, lineHeight: 1.6 }}>
                    {m.hints.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
            )
          })()}

          <GeminiAnalyzer
            title={title}
            text={text}
            onApplyTeaser={(teaser) => setSummary(teaser)}
            onApplyImprovedText={(improved) => setText(improved)}
            onAnalysisComplete={setAnalysisData}
          />

          {text.trim() && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontFamily: FONT }}>Олюднення тексту</div>
              <EditorialTools
                text={text}
                genre={genre}
                title={title}
                authorName={character}
                onApply={setText}
                showAnalysis={false}
              />
            </div>
          )}
        </SectionCard>

        {/* ━━━ SECTION 2 — Cover Photo ━━━ */}
        <SectionCard n={2} title="Фото обкладинки">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ border: `1.5px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: '30px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: 14 }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>🖼</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', marginBottom: 4, fontFamily: FONT }}>Перетягніть фото сюди або клікніть</div>
            <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>PNG · JPG · WEBP · до 10 МБ</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
          </div>
          <div style={{ marginBottom: imgSrc ? 14 : 0 }}>
            <input style={inputBase} placeholder="Або вставте URL зображення..." value={urlDraft}
              onChange={e => handleUrlChange(e.target.value)}
              onPaste={e => handleUrlChange(e.clipboardData.getData('text'))}
            />
          </div>
          {imgSrc && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="cover preview" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.6) 0%, transparent 40%)' }} />
              <button onClick={() => { setImgSrc(''); setUrlDraft('') }} style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
            </div>
          )}
        </SectionCard>

        {/* ━━━ SECTION 3 — Jamendo Music ━━━ */}
        <SectionCard n={3} title="Музика для серії">

          {/* Mood chips + search button */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {MOODS.map(m => (
              <button key={m.label} onClick={() => setMood(m.label)} style={{
                background: mood === m.label ? GOLD : 'rgba(255,255,255,0.07)',
                color: mood === m.label ? NAVY_DEEP : '#c8d4e8',
                border: `1px solid ${mood === m.label ? GOLD : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={searchJamendo}
            disabled={musicLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: musicLoading ? 'rgba(240,165,0,0.5)' : GOLD,
              color: NAVY_DEEP, border: 'none', borderRadius: 12,
              padding: '13px 18px', fontSize: 14, fontWeight: 700,
              cursor: musicLoading ? 'wait' : 'pointer', fontFamily: FONT, marginBottom: 16,
            }}
          >
            {musicLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke={NAVY_DEEP} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                Пошук…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke={NAVY_DEEP} strokeWidth="1.8"/>
                  <line x1="11" y1="11" x2="14.5" y2="14.5" stroke={NAVY_DEEP} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Знайти музику
              </>
            )}
          </button>

          {/* Error */}
          {musicError && (
            <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, marginBottom: 10, fontFamily: FONT }}>
              {musicError}
            </div>
          )}

          {/* Track list */}
          {tracks.map(track => {
            const isPlaying  = playingId === track.id && isAudioPlaying
            const isPaused   = playingId === track.id && !isAudioPlaying
            const isSelected = selectedTrack?.id === track.id
            return (
              <div key={track.id} onClick={() => setSelectedTrack(track)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                background: isSelected ? 'rgba(240,165,0,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? GOLD : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.15s',
              }}>

                {/* Play/pause button */}
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(track) }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    background: isPlaying ? 'rgba(240,165,0,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isPlaying || isPaused ? GOLD : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1.5" y="1.5" width="3" height="9" rx="1" fill={GOLD}/>
                      <rect x="7.5" y="1.5" width="3" height="9" rx="1" fill={GOLD}/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <polygon points="2.5,1.5 11,6 2.5,10.5" fill={isPaused ? GOLD : '#8899bb'}/>
                    </svg>
                  )}
                </button>

                {/* Track info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? GOLD : '#f5f0e8', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2, fontFamily: FONT }}>
                    {track.artist_name}
                    {track.duration > 0 && <span style={{ marginLeft: 8, color: '#445566' }}>· {fmtDur(track.duration)}</span>}
                  </div>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, fontFamily: FONT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6 L5 9 L10 3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Вибрано
                  </div>
                )}
              </div>
            )
          })}

          {/* Selected track summary */}
          {selectedTrack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, padding: '10px 14px', background: 'rgba(240,165,0,0.07)', borderRadius: 10, border: `0.5px solid rgba(240,165,0,0.25)` }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13V6l8-2v7" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="2.5" cy="13" r="1.5" stroke={GOLD} strokeWidth="1.4"/>
                <circle cx="10.5" cy="11" r="1.5" stroke={GOLD} strokeWidth="1.4"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: GOLD, fontFamily: FONT }}>{selectedTrack.name}</span>
                <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}> — {selectedTrack.artist_name}</span>
              </div>
              <button onClick={() => { setSelectedTrack(null) }} style={{ background: 'none', border: 'none', color: '#445566', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}

        </SectionCard>

        {/* ━━━ SECTION 4 — Preview & Export ━━━ */}
        <SectionCard n={4} title="Превʼю та Експорт">

          {/* Story preview card */}
          <div style={{ background: NAVY_DEEP, border: `1px solid rgba(240,165,0,0.2)`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            {imgSrc && (
              <div style={{ position: 'relative', height: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="story cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,1) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                  {seasonEpLabel && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>{seasonEpLabel}</div>}
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, lineHeight: 1.2 }}>{title || '(без назви)'}</div>
                </div>
              </div>
            )}
            <div style={{ padding: '16px 18px 20px' }}>
              {!imgSrc && (
                <>
                  {seasonEpLabel && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT }}>{seasonEpLabel}</div>}
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', marginBottom: 12, fontFamily: FONT }}>{title || '(без назви)'}</div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{character} · {genre}</span>
              </div>
              {selectedTrack && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10V5l6-1.5v5" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="1.5" cy="10" r="1" fill={GOLD}/>
                    <circle cx="7.5" cy="8.5" r="1" fill={GOLD}/>
                  </svg>
                  <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{selectedTrack.name} — {selectedTrack.artist_name}</span>
                </div>
              )}
              {summary && (
                <p style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.7, margin: '0 0 14px', fontFamily: FONT, fontStyle: 'italic', borderLeft: `2px solid rgba(240,165,0,0.35)`, paddingLeft: 12 }}>{summary}</p>
              )}
              {text ? (
                <div style={{ paddingTop: 12, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT }}>Уривок тексту · {wordCount} слів · ~{readMin} хв</div>
                  <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.75, margin: 0, fontFamily: FONT, maxHeight: 120, overflow: 'hidden' }}>{text.substring(0, 350)}{text.length > 350 ? '…' : ''}</p>
                </div>
              ) : isEmpty ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#334455', fontSize: 13, fontFamily: FONT }}>Заповніть Секцію 1, щоб побачити превʼю</div>
              ) : null}
            </div>
          </div>

          {/* Publish to site */}
          <div style={{ marginBottom: 16, padding: '16px 18px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontFamily: FONT }}>Опублікувати на сайті</div>

            {/* hasAudio toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
              <div
                onClick={() => setHasAudio(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, background: hasAudio ? GOLD : 'rgba(255,255,255,0.1)', border: `1px solid ${hasAudio ? GOLD : 'rgba(255,255,255,0.15)'}`, position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}
              >
                <div style={{ position: 'absolute', top: 2, left: hasAudio ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: hasAudio ? '#f5f0e8' : '#8899bb', fontFamily: FONT }}>🎧 Аудіо готове</span>
            </label>

            {/* isPremium toggle — закрита серія (тільки річні) */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
              <div
                onClick={() => setIsPremium(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, background: isPremium ? GOLD : 'rgba(255,255,255,0.1)', border: `1px solid ${isPremium ? GOLD : 'rgba(255,255,255,0.15)'}`, position: 'relative', flexShrink: 0, transition: 'background 0.2s', cursor: 'pointer' }}
              >
                <div style={{ position: 'absolute', top: 2, left: isPremium ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: 13, color: isPremium ? GOLD : '#8899bb', fontFamily: FONT, fontWeight: isPremium ? 700 : 400 }}>🔒 Закрита серія (тільки річні)</span>
            </label>

            <button
              onClick={handlePublish}
              disabled={publishState === 'loading'}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: publishState === 'done' ? 'rgba(74,222,128,0.15)' : publishState === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(240,165,0,0.15)', color: publishState === 'done' ? '#4ade80' : publishState === 'error' ? '#f87171' : GOLD, border: `1px solid ${publishState === 'done' ? 'rgba(74,222,128,0.4)' : publishState === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(240,165,0,0.4)'}`, borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: publishState === 'loading' ? 'wait' : 'pointer', fontFamily: FONT, transition: 'all 0.2s' }}
            >
              {publishState === 'loading' ? (
                <><svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}><circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" fill="none" strokeDasharray="24" strokeDashoffset="8"/></svg> Публікую…</>
              ) : publishState === 'done' ? '✓ Опубліковано' : publishState === 'error' ? '✕ Помилка' : (
                <><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2 L8 10" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round"/><path d="M5 7.5 L8 4 L11 7.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 13.5 L13.5 13.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round"/></svg> Опублікувати серію</>
              )}
            </button>
            {publishMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: publishState === 'error' ? '#f87171' : '#4ade80', fontFamily: FONT }}>{publishMsg}</div>
            )}
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={handleCopy} style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke={NAVY_DEEP} strokeWidth="1.5"/>
                <path d="M10.5 5.5 L10.5 3.5 Q10.5 2.5 9.5 2.5 L2.5 2.5 Q1.5 2.5 1.5 3.5 L1.5 10.5 Q1.5 11.5 2.5 11.5 L4.5 11.5" stroke={NAVY_DEEP} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {copyState === 'copied' ? '✓ Скопійовано!' : 'Скопіювати текст'}
            </button>
            <button onClick={handleDownloadTxt} style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2 L8 10" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M5 7.5 L8 11 L11 7.5" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 13.5 L13.5 13.5" stroke="#f5f0e8" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Завантажити .txt
            </button>
            <button onClick={handleDownloadJson} style={{ flex: '1 1 150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', color: '#8899bb', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 2 L3 14 L13 14 L13 6 L9 2 Z" stroke="#8899bb" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M9 2 L9 6 L13 6" stroke="#8899bb" strokeWidth="1.4" strokeLinejoin="round"/>
                <line x1="5.5" y1="9" x2="10.5" y2="9" stroke="#8899bb" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="5.5" y1="11.5" x2="8.5" y2="11.5" stroke="#8899bb" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Завантажити .json
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 4, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            {[
              { label: 'Слів',       val: wordCount > 0 ? wordCount.toLocaleString('uk') : '—' },
              { label: 'Символів',   val: text.length > 0 ? text.length.toLocaleString('uk') : '—' },
              { label: 'Хв читання', val: readMin > 0 ? `~${readMin}` : '—' },
              { label: 'Фото',       val: imgSrc ? '✓' : '—',           accent: !!imgSrc },
              { label: 'Музика',     val: selectedTrack ? '✓' : '—',    accent: !!selectedTrack },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', flex: '1 1 60px', padding: '6px 4px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.accent ? '#4ade80' : GOLD, fontFamily: FONT, lineHeight: 1.2 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#445566', fontFamily: FONT, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </SectionCard>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
