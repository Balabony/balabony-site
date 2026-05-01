'use client'

import { useState } from 'react'

function EmergencySection() {
  const [confirm, setConfirm] = useState<string | null>(null)

  const call = (num: string) => {
    window.location.href = `tel:${num}`
    setConfirm(null)
  }

  return (
    <>
      <div style={{
        background: '#fdf6ec',
        border: '1px solid #f5d9b0',
        borderRadius: 20, padding: '20px 24px',
        marginBottom: 40, maxWidth: 1100, margin: '0 auto 40px',
      }}>
        <div style={{ color: '#c2410c', fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 12, letterSpacing: 1 }}>
          ЕКСТРЕНА ДОПОМОГА
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {/* 112 */}
          <button
            onClick={() => setConfirm('112')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22,
              boxShadow: '0 2px 12px rgba(220,38,38,0.4)',
            }}
          >
            <b>112</b>
            <span style={{ fontSize: 11, opacity: 0.9 }}>Єдина екстрена</span>
          </button>

          {/* 102 — Поліція між 112 і 103 */}
          <button
            onClick={() => setConfirm('102')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, background: '#1d4ed8', color: '#fff', border: 'none',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20,
            }}
          >
            <b>102</b>
            <span style={{ fontSize: 11, opacity: 0.9 }}>Поліція</span>
          </button>

          {/* 103 */}
          <button
            onClick={() => setConfirm('103')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, background: '#b91c1c', color: '#fff', border: 'none',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20,
            }}
          >
            <b>103</b>
            <span style={{ fontSize: 11, opacity: 0.9 }}>Швидка</span>
          </button>
        </div>
      </div>

      {/* Підтвердження */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#1a2332', borderRadius: 24, padding: 32,
            width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 20,
          }}>
            <div style={{ fontSize: 56 }}>
              {confirm === '112' ? '🆘' : confirm === '103' ? '🚑' : '🛡️'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
              Викликати {confirm === '103' ? 'Швидку допомогу' : confirm === '102' ? 'Поліцію' : 'екстрену службу'}?
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#ef4444' }}>{confirm}</div>
            <button
              onClick={() => call(confirm)}
              style={{
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 14, padding: '18px', fontSize: 22, fontWeight: 800,
                cursor: 'pointer', width: '100%',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              ✅ ТАК, ВИКЛИКАТИ
            </button>
            <button
              onClick={() => setConfirm(null)}
              style={{
                background: '#334155', color: '#fff', border: 'none',
                borderRadius: 14, padding: '14px', fontSize: 18, fontWeight: 700,
                cursor: 'pointer', width: '100%',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              ❌ НІ, СКАСУВАТИ
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: 'var(--dark)', color: '#94a3b8', padding: '60px 5% 30px', marginTop: 60 }}>

      {/* Екстрена допомога */}
      <EmergencySection />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40, maxWidth: 1100, margin: '0 auto 40px'
      }}>
        <div>
          <span style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, color: 'var(--accent-gold)', display: 'block', marginBottom: 12 }}>
            Balabony<sup style={{ fontSize: 10 }}>®</sup>
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: '#64748b', marginBottom: 8 }}>
            Платформа для тих, хто любить живі та щирі українські історії.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
            {[
              { label: 'Telegram', href: 'https://t.me/balabony_bot' },
              { label: 'Instagram', href: 'https://www.instagram.com/balabony_' },
              { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61568006368489' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Платформи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Web (браузер)', 'iOS (Safari PWA)', 'Android (Chrome PWA)', 'Telegram-бот', 'Smart TV / Tablets'].map(item => (
              <li key={item} style={{ marginBottom: 9 }}>
                <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Інклюзивність</h4>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
            Пільгові умови для ветеранів (УБД) та людей з інвалідністю: повний доступ за 1 грн.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Документи</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Угода користувача', 'Політика конфіденційності', 'Публічна оферта', 'Договір з автором'].map(item => (
              <li key={item} style={{ marginBottom: 9 }}>
                <a href="#docs" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Навігація</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              { label: 'Відеоісторія дня', href: '#video' },
              { label: 'Рідер', href: '#reader' },
              { label: 'Тарифи', href: '#pricing' },
              { label: 'Документи', href: '#docs' },
            ].map(item => (
              <li key={item.label} style={{ marginBottom: 9 }}>
                <a href={item.href} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #1e293b', paddingTop: 28, textAlign: 'center',
        fontSize: 12, color: '#475569', maxWidth: 1100, margin: '0 auto'
      }}>
        <p>
          © 2026 Balabony®. Історії українською. Усі права захищено згідно із законодавством України.<br />
          <span style={{ fontSize: 11, color: '#334155' }}>
            Торговельна марка: заявка №m202501234 до Укрпатенту.
          </span>
        </p>
      </div>
    </footer>
  )
}
