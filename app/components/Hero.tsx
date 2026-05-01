import Image from 'next/image'

export default function Hero() {
  return (
    <>
      <div style={{
        background: 'var(--dark)', padding: '40px 5% 56px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%,rgba(37,99,235,0.15) 0%,transparent 70%), radial-gradient(ellipse 50% 60% at 80% 40%,rgba(230,57,70,0.12) 0%,transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>

          {/* Верхній рядок */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 28,
          }}>
            <span style={{ width: 20, height: 1, background: 'var(--amber)', opacity: 0.5, display: 'block', flexShrink: 0 }}/>
            ДЛЯ ДУШІ · ДЛЯ СІМ'Ї · ДЛЯ ЗДОРОВ'Я
            <span style={{ width: 20, height: 1, background: 'var(--amber)', opacity: 0.5, display: 'block', flexShrink: 0 }}/>
          </div>

          {/* Фото + заголовок поруч */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>

            {/* Фото — зліва, компактне */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                position: 'relative', width: 140, height: 170,
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5),0 0 0 2px rgba(239,159,39,0.3)'
              }}>
                <Image
                  src="https://raw.githubusercontent.com/Balabony/balabony/main/dad-panas.jpg"
                  alt="Дід Панас"
                  width={400} height={500}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px',
                  background: 'linear-gradient(to top,rgba(15,23,42,0.95) 0%,transparent 100%)'
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#ef9f27', letterSpacing: 1 }}>ДІД ПАНАС</div>
                  <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>Аудіоісторії та серіали</div>
                </div>
              </div>
            </div>

            {/* Заголовок — справа, великий */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: "'Lora', serif",
                fontSize: 'clamp(28px, 7vw, 52px)',
                fontWeight: 600,
                color: '#fff', lineHeight: 1.15,
                letterSpacing: -0.5, margin: 0,
              }}>
                Живи довго.<br />
                <em style={{ fontStyle: 'italic', color: 'var(--amber)' }}>Слухай</em><br />
                серцем
              </h1>
            </div>
          </div>

          {/* Підзаголовок */}
          <p style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.75, maxWidth: 540 }}>
            Платформа ментального здоров'я для літніх людей та їхніх родин. Аудіотерапія, когнітивні ігри та безпечний зв'язок з рідними — в одному місці.
          </p>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="#pricing" style={{
              background: 'var(--accent-gold)', color: '#fff', padding: '12px 22px',
              borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700
            }}>Спробувати безкоштовно</a>
            <a href="#reader" style={{
              color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600
            }}>Читати та слухати</a>
            <a href="#pricing" style={{
              color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600
            }}>Тарифи</a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'var(--dark)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 5%' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex',
          justifyContent: 'space-around', gap: 12, flexWrap: 'wrap'
        }}>
          {[
            { num: '1', label: 'Серія безкоштовно' },
            { num: '4+', label: 'Серій вийшло' },
            { num: 'AI', label: 'Синтез голосу' },
            { num: '1₴', label: 'Соціальний доступ' },
            { num: '5', label: 'Платформ' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, color: 'var(--amber)', display: 'block' }}>{s.num}</span>
              <span style={{ fontSize: 10, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community bar */}
      <div style={{
        background: 'linear-gradient(90deg,var(--bg-deep),#1e293b)', padding: '12px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        borderTop: '1px solid rgba(239,159,39,0.2)'
      }}>
        <span style={{ fontSize: 13, color: '#f8fafc', textAlign: 'center' }}>
          Разом ми прослухали <b style={{ color: '#ef9f27' }}>24 831</b> годин українського контенту
        </span>
      </div>
    </>
  )
}
