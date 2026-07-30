import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ThemeProvider } from '../context/ThemeContext'

const NAVY_DEEP = '#0a1628'
const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export const metadata: Metadata = {
  title: 'Голоси платформи · Балабони',
  description:
    'Голоси, якими Балабони озвучуватимуть історії та серіали. Багатоголосе озвучення в розробці, запуск — восени 2026.',
  alternates: { canonical: '/holosy' },
}

type VoiceCard = {
  name: string
  timbre: string
  about: string
}

const VOICES: VoiceCard[] = [
  {
    name: 'Чоловічий · зрілий',
    timbre: 'Теплий, неквапливий',
    about: 'Оповідач для родинних історій і серій «Балабонів». Той голос, яким читають онукам.',
  },
  {
    name: 'Жіночий · зрілий',
    timbre: 'М’який, рівний',
    about: 'Для казок і ліричної прози. Спокійний темп, чітка дикція без театральності.',
  },
  {
    name: 'Чоловічий · молодий',
    timbre: 'Стриманий, сухуватий',
    about: 'Для авторських серіалів 18+, зокрема «Тиші». Без пафосу й без надриву.',
  },
  {
    name: 'Багатоголосе',
    timbre: 'Кілька дикторів',
    about: 'Репліки читають різні голоси — ближче до аудіодрами, ніж до начитки. Головний напрямок роботи.',
  },
]

export default function HolosyPage() {
  return (
    <ThemeProvider>
      <Header />
      <main style={{ background: NAVY_DEEP, padding: '48px 20px 72px', fontFamily: FONT }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              color: GOLD,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Балабони · Озвучення
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.22, margin: '0 0 14px' }}>
            Голоси платформи
          </h1>

          {/* Чесна плашка про стан */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              background: 'rgba(239,159,39,0.09)',
              border: `1px solid ${GOLD}44`,
              borderLeft: `3px solid ${GOLD}`,
              borderRadius: 12,
              padding: '16px 18px',
              margin: '0 0 26px',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1.2 }} aria-hidden>
              🎙
            </span>
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#dbe4f0', margin: 0 }}>
              <strong style={{ color: '#f5f0e8' }}>Голосів поки немає.</strong> Сьогодні платформа текстова.
              Запис із дикторами заплановано на вересень 2026 — тоді ця сторінка наповниться зразками,
              які можна буде послухати. Нижче — голоси, які готуємо, і те, для чого кожен призначений.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {VOICES.map((v) => (
              <div
                key={v.name}
                style={{
                  background: '#0f1e3a',
                  border: '1px solid rgba(239,159,39,0.22)',
                  borderRadius: 14,
                  padding: '20px 20px 22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700, color: '#f5f0e8', lineHeight: 1.3 }}>{v.name}</span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      color: GOLD,
                      border: `1px solid ${GOLD}66`,
                      borderRadius: 5,
                      padding: '3px 7px',
                    }}
                  >
                    Готуємо
                  </span>
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 600, color: GOLD, marginBottom: 8 }}>{v.timbre}</div>

                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#b9c6db', margin: 0 }}>{v.about}</p>

                {/* Місце під програвач — зʼявиться разом із записом */}
                <div
                  style={{
                    marginTop: 16,
                    height: 40,
                    borderRadius: 8,
                    border: '1px dashed rgba(200,212,232,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: 'rgba(200,212,232,0.5)',
                  }}
                >
                  Зразок зʼявиться у вересні
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#0f1e3a',
              border: '1px solid rgba(239,159,39,0.22)',
              borderRadius: 14,
              padding: '22px 20px',
              marginBottom: 28,
            }}
          >
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#f5f0e8', margin: '0 0 10px' }}>
              Що вже можна послухати
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: '#b9c6db', margin: '0 0 16px' }}>
              Одне пробне озвучення серії «Панас і 5G на вишні» — щоб почути темп і манеру читання.
              Це чернетка, а не фінальний голос платформи.
            </p>
            <Link
              href="/demo"
              style={{
                display: 'inline-block',
                background: GOLD,
                color: NAVY_DEEP,
                borderRadius: 10,
                padding: '13px 24px',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Послухати демо →
            </Link>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#8fa3c4', margin: 0 }}>
            Хочете аудіоверсію своєї книги чи серіалу?{' '}
            <Link href="/become-author" style={{ color: GOLD, fontWeight: 600 }}>
              Залиште заявку
            </Link>{' '}
            — порахуємо вартість під ваш текст, коли запис стартує.
          </p>
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
