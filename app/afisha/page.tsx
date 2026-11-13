import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ThemeProvider } from '../context/ThemeContext'
import { upcoming, upcomingPremieres, ACCESS_LABEL, fromRows } from '@/lib/afisha'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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
  return (
    <ThemeProvider>
      <Header />
      <main id="main" style={{ background: NAVY_DEEP, padding: '48px 20px 72px', fontFamily: FONT }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>Балабони · Культура для всіх</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: CREAM, lineHeight: 1.22, margin: '0 0 14px' }}>Афіша без барʼєрів</h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: '#dbe4f0', margin: '0 0 26px' }}>
            Вистави, кіно й читання, куди можуть прийти всі: з аудіодескрипцією для незрячих, субтитрами чи жестовою мовою для людей з порушеннями слуху, із залом, доступним на візку. Збираємо лише ті події, де організатор сам оголосив формат доступності. Починаємо зі Львова.
          </p>

          <h2 style={{ fontSize: 22, color: CREAM, margin: '0 0 14px' }}>Найближчі події</h2>
          {list.length === 0 && <p style={{ color: '#dbe4f0' }}>Нових подій поки немає. Надішліть нам свою — додамо.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'grid', gap: 14 }}>
            {list.map((e) => (
              <li key={e.date + e.title} style={{ background: '#0f1e3a', border: '1px solid rgba(239,159,39,0.22)', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ margin: '0 0 6px', color: GOLD, fontWeight: 700, fontSize: 15 }}>{human(e.date)}{e.time ? ` · ${e.time}` : ''} · {e.city}</p>
                <h3 style={{ margin: '0 0 6px', color: CREAM, fontSize: 20, lineHeight: 1.3 }}>{e.title}</h3>
                <p style={{ margin: '0 0 10px', color: '#c9d4e4', fontSize: 15 }}>{e.kind} · {e.venue}</p>
                <p style={{ margin: '0 0 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {e.access.map((a) => <span key={a} style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(239,159,39,0.14)', color: GOLD, border: `1px solid ${GOLD}55` }}>{ACCESS_LABEL[a]}</span>)}
                </p>
                <p style={{ margin: '0 0 8px', color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.6 }}>{e.note}</p>
                {e.book && <p style={{ margin: '0 0 8px', color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.6 }}><strong style={{ color: CREAM }}>Як піти:</strong> {e.book}</p>}
                {e.source && <p style={{ margin: 0, fontSize: 14 }}><a href={e.source} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>Джерело: сайт організатора<span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}> (відкриється в новій вкладці)</span></a></p>}
              </li>
            ))}
          </ul>

          {films.length > 0 && (
            <section aria-labelledby="kino" style={{ marginBottom: 36 }}>
              <h2 id="kino" style={{ fontSize: 22, color: CREAM, margin: '0 0 6px' }}>Скоро в кіно</h2>
              <p style={{ margin: '0 0 14px', color: '#9fb0c8', fontSize: 14.5, lineHeight: 1.6 }}>Анонси від наших партнерів-дистрибʼюторів. Чи будуть сеанси із субтитрами чи аудіодескрипцією, уточнюємо й допишемо тут.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
                {films.map((f) => (
                  <li key={f.date + f.title} style={{ background: '#0f1e3a', border: '1px solid rgba(239,159,39,0.22)', borderRadius: 14, padding: '18px 20px' }}>
                    <p style={{ margin: '0 0 6px', color: GOLD, fontWeight: 700, fontSize: 15 }}>У кіно з {human(f.date)}</p>
                    <h3 style={{ margin: '0 0 6px', color: CREAM, fontSize: 20, lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ margin: '0 0 10px', color: '#c9d4e4', fontSize: 15 }}>{f.genre} · {f.studio}</p>
                    {f.access && f.access.length > 0 && <p style={{ margin: '0 0 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>{f.access.map((a) => <span key={a} style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(239,159,39,0.14)', color: GOLD, border: `1px solid ${GOLD}55` }}>{ACCESS_LABEL[a]}</span>)}</p>}
                    <p style={{ margin: '0 0 8px', color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.6 }}>{f.about}</p>
                    {(f.director || f.cast) && <p style={{ margin: '0 0 8px', color: '#c9d4e4', fontSize: 14.5, lineHeight: 1.6 }}>{f.director && <>Режисер: {f.director}. </>}{f.cast && <>Ролі озвучують: {f.cast}.</>}</p>}
                    <p style={{ margin: 0, fontSize: 14 }}>{f.trailer && <a href={f.trailer} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontWeight: 600 }}>Дивитися трейлер<span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}> (YouTube, відкриється в новій вкладці)</span></a>}{f.distributor && <span style={{ color: '#9fb0c8' }}>{f.trailer ? ' · ' : ''}Дистрибʼютор: {f.distributor}</span>}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="dodaty" style={{ background: 'rgba(239,159,39,0.09)', border: `1px solid ${GOLD}44`, borderLeft: `3px solid ${GOLD}`, borderRadius: 12, padding: '18px 20px', marginBottom: 26 }}>
            <h2 id="dodaty" style={{ fontSize: 20, color: CREAM, margin: '0 0 8px' }}>Організовуєте доступну подію?</h2>
            <p style={{ margin: 0, color: '#dbe4f0', fontSize: 15.5, lineHeight: 1.65 }}>
              Театр, кінотеатр, бібліотека, музей чи громадська організація — надішліть анонс на <a href="mailto:nazar@balabony.com?subject=Афіша%20без%20барʼєрів" style={{ color: GOLD, fontWeight: 600 }}>nazar@balabony.com</a>: назва, дата, місце, які формати доступності є і як їх замовити. Публікуємо безкоштовно.
            </p>
          </section>
          <p style={{ color: '#9fb0c8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Розклад може змінитися — перед виходом уточніть в організатора. Більше про доступність Балабонів — на сторінці <Link href="/accessibility" style={{ color: GOLD }}>«Доступність»</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
