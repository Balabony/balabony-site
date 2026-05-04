'use client'

import { useState } from 'react'

const LEGAL_DOCS = [
  {
    title: 'Угода користувача',
    content: 'Ця Угода регулює доступ та використання платформи Balabony. Контент платформи захищений авторським правом. Будь-яке копіювання чи розповсюдження аудіофайлів без дозволу заборонено. Адміністрація не несе відповідальності за тимчасові технічні збої месенджерів (Telegram, Viber). Користувач зобов\'язується надавати правдиві дані для валідації через сервіс «Дія» при обранні соціального тарифу.',
  },
  {
    title: 'Політика конфіденційності',
    content: 'Ми поважаємо ваші дані згідно із Законом України «Про захист персональних даних». Ми збираємо лише ті дані, які необхідні для функціонування бота та ідентифікації оплати. Дані про валідацію через «Дія» обробляються згідно з державними стандартами безпеки. Ми не передаємо ваші контактні дані третім особам для маркетингових цілей.',
  },
  {
    title: 'Публічна оферта',
    content: 'Акцептом оферти вважається здійснення оплати обраного тарифу. Послуга вважається наданою в момент відкриття доступу до аудіофайлів у месенджері. Повернення коштів за цифрові товари належної якості після надання доступу не здійснюється згідно з законодавством України. Ціни на тарифи можуть бути змінені адміністрацією з попередженням на сайті.',
  },
]

export default function Footer() {
  const [legalDoc, setLegalDoc] = useState<string | null>(null)
  const doc = LEGAL_DOCS.find(d => d.title === legalDoc)

  return (
    <footer style={{ background: 'var(--dark)', color: '#94a3b8', padding: '32px 5% 30px', marginTop: 24 }}>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40, maxWidth: 1100, margin: '0 auto 40px'
      }}>
        <div>
          <span style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, color: 'var(--accent-gold)', display: 'block', marginBottom: 12 }}>
            Balabony<sup style={{ fontSize: 10 }}>®</sup>
          </span>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
            Читай українське.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
            {[
              { label: 'Telegram', href: 'https://t.me/balabony_bot' },
              { label: 'Instagram', href: 'https://www.instagram.com/balabony_' },
              { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61568006368489' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 600 }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Платформи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Web (браузер)', 'iOS (Safari PWA)', 'Android (Chrome PWA)', 'Telegram-бот', 'Smart TV / Tablets'].map(item => (
              <li key={item} style={{ marginBottom: 9 }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Інклюзивність</h4>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
            Пільгові умови для ветеранів (УБД) та людей з інвалідністю: повний доступ за 1 грн.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Документи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {LEGAL_DOCS.map(d => (
              <li key={d.title} style={{ marginBottom: 9 }}>
                <button
                  onClick={() => setLegalDoc(d.title)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 16, cursor: 'pointer', padding: 0, fontFamily: "'Montserrat', sans-serif", textAlign: 'left' }}
                >
                  {d.title}
                </button>
              </li>
            ))}
            <li style={{ marginBottom: 9 }}>
              <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>Договір з автором</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>Навігація</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { label: 'Відеоісторія дня', href: '#video' },
              { label: 'Рідер', href: '#reader' },
              { label: 'Тарифи', href: '#pricing' },
            ].map(item => (
              <li key={item.label} style={{ marginBottom: 9 }}>
                <a href={item.href} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 16 }}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 28, textAlign: 'center',
        fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 1100, margin: '0 auto'
      }}>
        <p>
          © 2026 Balabony®. Історії українською. Усі права захищено згідно із законодавством України.<br />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Торговельна марка: заявка №m202501234 до Укрпатенту.
          </span>
        </p>
      </div>

      {/* Legal document modal */}
      {doc && (
        <div
          onClick={() => setLegalDoc(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#0f1e3a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 24px', maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
          >
            <button
              onClick={() => setLegalDoc(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#f5f0e8', width: 32, height: 32, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >
              ✕
            </button>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: '#f5f0e8', marginBottom: 16, paddingRight: 40 }}>
              {doc.title}
            </h3>
            <p style={{ fontSize: 14, color: '#8899bb', lineHeight: 1.8 }}>
              {doc.content}
            </p>
          </div>
        </div>
      )}
    </footer>
  )
}
