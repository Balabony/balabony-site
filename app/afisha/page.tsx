import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ThemeProvider } from '../context/ThemeContext'
import { upcoming, upcomingPremieres, ACCESS_LABEL, fromRows } from '@/lib/afisha'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { AccessIcon, StageArt } from './AfishaArt'
import type { Access } from '@/lib/afisha'

// 13.11.2026 (Богдан): рубрика «Афіша без бар'єрів» — вистави, кіно й читання з аудіодескрипцією,
// субтитрами, жестовою мовою чи доступним залом. Окремої такої афіші в Україні немає — перевірено 13.11.2026.
export const revalidate = 3600

const NAVY_DEEP = '#0a1628'
const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const FONT = "'Montserrat', Arial, sans-serif"
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']
const DAYS = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота']
const human = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return `${d} ${MONTHS[m - 1]}, ${DAYS[w]}` }

export const metadata: Metadata = {
  title: 'Афіша без барʼєрів — вистави й кіно з аудіодескрипцією · Балабони',
  description: 'Куди піти незрячим, людям з порушеннями слуху й на візку: вистави з аудіодескрипцією, кіно з субтитрами, події з жестовою мовою. Львів і вся Україна.',
  alternates: { canonical: '/afisha' },
}

export default async function AfishaPage() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
  let db: ReturnType<typeof fromRows> = { events: [], films: [] }
  try {
    const { data } = await getSupabaseAdmin().from('afisha_items').select('*').eq('published', true).gte('date', today)
    db = fromRows(data || [])
  } catch {}
  const byDate = <T extends { date: string; time?: string }>(a: T, b: T) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))
  const list = [...upcoming(today), ...db.events].sort(byDate)
  const films = [...upcomingPremieres(today), ...db.films].sort(byDate)
  const ytId = (u?: string) => (u || '').match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1]
  const SR: React.CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }
  const Badge = ({ a }: { a: Access }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '5px 11px 5px 9px', borderRadius: 99, background: 'rgba(239,159,39,0.14)', color: GOLD, border: `1px solid ${GOLD}55` }}><AccessIcon a={a} size={16} />{ACCESS_LABEL[a]}</span>
  const DateTile = ({ iso, time }: { iso: string; time?: string }) => { const [, m, d] = iso.split('-').map(Number); const w = new Date(iso + 'T12:00:00Z').getUTCDay(); return (
    <div aria-hidden style={{ flex: '0 0 84px', textAlign: 'center', background: 'linear-gradient(160deg,#ef9f27,#c97a0c)', color: '#1a1206', borderRadius: 14, padding: '10px 6px', alignSelf: 'flex-start' }}>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{d}</div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{MONTHS[m - 1]}</div>
      <div style={{ fontSize: 12, opacity: .8 }}>{DAYS[w]}</div>
      {time && <div style={{ fontSize: 13, fontWeight: 800, marginTop: 6, background: '#1a1206', color: '#ffd98a', borderRadius: 8, padding: '2px 0' }}>{time}</div>}
    </div>) }
  return (
    <ThemeProvider>
      <Header />
      <main id="main" style={{ background: NAVY_DEEP, padding: '40px 20px 72px', fontFamily: FONT }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'center', marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>Балабони · Культура для всіх</div>
              <h1 style={{ fontSize: 'clamp(30px,4.5vw,44px)', fontWeight: 800, color: CREAM, lineHeight: 1.12, margin: '0 0 14px' }}>Афіша без барʼєрів</h1>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: '#dbe4f0', margin: '0 0 18px' }}>Вистави, кіно, концерти й читання, куди можуть прийти всі. Збираємо лише ті події, де організатор сам оголосив формат доступності. Починаємо зі Львова.</p>
              <ul aria-label="Формати доступності" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(Object.keys(ACCESS_LABEL) as Access[]).map((a) => <li key={a}><Badge a={a} /></li>)}
              </ul>
            </div>
            <StageArt />
          </section>

          <h2 style={{ fontSize: 24, color: CREAM, margin: '0 0 16px' }}>Найближчі події</h2>
          {list.length === 0 && <p style={{ color: '#dbe4f0' }}>Нових подій поки немає. Надішліть нам свою — додамо.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'grid', gap: 16 }}>
            {list.map((e) => (
              <li key={e.date + e.title} style={{ display: 'flex', gap: 18, background: 'linear-gradient(180deg,#12244a,#0f1e3a)', border: '1px solid rgba(239,159,39,0.25)', borderRadius: 18, padding: 18, flexWrap: 'wrap' }}>
                <DateTile iso={e.date} time={e.time} />
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', color: GOLD, fontWeight: 700, fontSize: 14, letterSpacing: .5, textTransform: 'uppercase' }}>{e.kind} · {e.city}<span style={SR}>, {human(e.date)}{e.time ? `, ${e.time}` : ''}</span></p>
                  <h3 style={{ margin: '0 0 4px', color: CREAM, fontSize: 22, lineHeight: 1.25 }}>{e.title}</h3>
                  <p style={{ margin: '0 0 12px', color: '#c9d4e4', fontSize: 15 }}>{e.venue}</p>
                  <p style={{ margin: '0 0 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>{e.access.map((a) => <Badge key={a} a={a} />)}</p>
                  <p style={{ margin: '0 0 8px', color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.6 }}>{e.note}</p>
                  {e.book && <p style={{ margin: '0 0 8px', color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.6 }}><strong style={{ color: CREAM }}>Як піти:</strong> {e.book}</p>}
                  {e.source && <p style={{ margin: 0, fontSize: 14 }}><a href={e.source} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>Джерело: сайт організатора<span style={SR}> (відкриється в новій вкладці)</span></a></p>}
                </div>
              </li>
            ))}
          </ul>

          {films.length > 0 && (
            <section aria-labelledby="kino" style={{ marginBottom: 40 }}>
              <h2 id="kino" style={{ fontSize: 24, color: CREAM, margin: '0 0 6px' }}>Скоро в кіно</h2>
              <p style={{ margin: '0 0 16px', color: '#9fb0c8', fontSize: 14.5, lineHeight: 1.6 }}>Анонси від наших партнерів-дистрибʼюторів. Чи будуть сеанси із субтитрами чи аудіодескрипцією, уточнюємо й допишемо тут.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                {films.map((f) => { const id = ytId(f.trailer); return (
                  <li key={f.date + f.title} style={{ background: '#0f1e3a', border: '1px solid rgba(239,159,39,0.25)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {id && <a href={f.trailer} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'block', aspectRatio: '16/9', background: '#000' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`Кадр з трейлера «${f.title}»`} loading="lazy" width={480} height={270} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <span aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(10,22,40,.75)', border: `2px solid ${GOLD}`, display: 'grid', placeItems: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill={GOLD} /></svg></span></span>
                      <span style={SR}>Дивитися трейлер на YouTube (відкриється в новій вкладці)</span>
                    </a>}
                    <div style={{ padding: '16px 18px 18px', display: 'grid', gap: 8 }}>
                      <p style={{ margin: 0, color: GOLD, fontWeight: 700, fontSize: 14 }}>У кіно з {human(f.date)}</p>
                      <h3 style={{ margin: 0, color: CREAM, fontSize: 21, lineHeight: 1.25 }}>{f.title}</h3>
                      <p style={{ margin: 0, color: '#c9d4e4', fontSize: 14.5 }}>{f.genre}{f.studio ? ` · ${f.studio}` : ''}</p>
                      {f.access && f.access.length > 0 && <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>{f.access.map((a) => <Badge key={a} a={a} />)}</p>}
                      <p style={{ margin: 0, color: '#dbe4f0', fontSize: 15, lineHeight: 1.6 }}>{f.about}</p>
                      {(f.director || f.cast) && <p style={{ margin: 0, color: '#c9d4e4', fontSize: 14, lineHeight: 1.6 }}>{f.director && <>Режисер: {f.director}. </>}{f.cast && <>Ролі озвучують: {f.cast}.</>}</p>}
                      {f.distributor && <p style={{ margin: 0, color: '#9fb0c8', fontSize: 13.5 }}>Дистрибʼютор: {f.distributor}</p>}
                    </div>
                  </li>) })}
              </ul>
            </section>
          )}

          <section aria-labelledby="dodaty" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center', background: 'linear-gradient(135deg,rgba(239,159,39,0.16),rgba(239,159,39,0.05))', border: `1px solid ${GOLD}55`, borderRadius: 18, padding: '22px 24px', marginBottom: 26 }}>
            <div>
              <h2 id="dodaty" style={{ fontSize: 22, color: CREAM, margin: '0 0 8px' }}>Організовуєте доступну подію?</h2>
              <p style={{ margin: 0, color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.65 }}>Театр, кінотеатр, бібліотека, музей чи громадська організація — надішліть анонс: назва, дата, місце, які формати доступності є і як їх замовити. Публікуємо безкоштовно.</p>
            </div>
            <p style={{ margin: 0 }}><a href="mailto:nazar@balabony.com?subject=Афіша%20без%20барʼєрів" style={{ display: 'inline-block', background: GOLD, color: '#1a1206', fontWeight: 800, padding: '13px 22px', borderRadius: 12, textDecoration: 'none' }}>Надіслати анонс</a></p>
          </section>
          <p style={{ color: '#9fb0c8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Розклад може змінитися — перед виходом уточніть в організатора. Більше про доступність Балабонів — на сторінці <Link href="/accessibility" style={{ color: GOLD }}>«Доступність»</Link>.</p>
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
