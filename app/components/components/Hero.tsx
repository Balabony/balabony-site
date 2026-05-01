export default function Hero() {
  return (
    <>
      <div style={{
        background: 'var(--dark)', padding: '72px 5% 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%,rgba(37,99,235,0.15) 0%,transparent 70%), radial-gradient(ellipse 50% 60% at 80% 40%,rgba(230,57,70,0.12) 0%,transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative', maxWidth: 960, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 40,
          alignItems: 'center', textAlign: 'left'
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 20
            }}>
              <span style={{ display: 'block', width: 24, height: 1, background: 'var(--amber)', opacity: 0.6 }} />
              Аудіоісторії та серіали
              <span style={{ display: 'block', width: 24, height: 1, background: 'var(--amber)', opacity: 0.6 }} />
            </div>
            <h1 style={{
              fontFamily: "'Lora', serif", fontSize: 52, fontWeight: 600,
              color: '#fff', lineHeight: 1.15, marginBottom: 18, letterSpacing: -0.5
            }}>
              Всесвіт<br /><em style={{ fontStyle: 'italic', color: 'var(--amber)' }}>неймовірних</em><br />історій
            </h1>
            <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 480, margin: '0 0 32px', lineHeight: 1.75 }}>
              Дід Панас і його синій блокнот — серце платформи Balabony®. Слухайте українські аудіоісторії без реєстрації.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#pricing" style={{
                background: 'var(--accent-gold)', color: '#fff', padding: '13px 26px',
                borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700
              }}>Спробувати безкоштовно</a>
              <a href="#reader" style={{
                background: 'var(--accent-gold)', color: '#fff', padding: '13px 26px',
                borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700
              }}>Читати та слухати</a>
              <a href="#pricing" style={{
                color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                padding: '13px 26px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600
              }}>Тарифи</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'relative', width: 280, height: 340, borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 20px 48px rgba(0,0,0,0.5),0 0 0 2px rgba(239,159,39,0.3),0 0 30px rgba(239,159,39,0.2)'
            }}>
              <img
                loading="lazy" decoding="async" width={800} height={600}
                src="/images/dad-panas.jpg" alt="Дід Панас із синім блокнотом"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px',
                background: 'linear-gradient(to top,rgba(15,23,42,0.95) 0%,transparent 100%)'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef9f27', letterSpacing: 1 }}>ДІД ПАНАС</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Серце платформи Balabony®</div>
              </div>
              <div style={{
                position: 'absolute', top: 12, right: 12, background: 'rgba(239,159,39,0.9)',
                borderRadius: 6, padding: '3px 8px', fontSize: 9, color: '#0f172a', fontWeight: 700
              }}>ОРИГІНАЛЬНИЙ АРТ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'var(--dark)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 5%' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex',
          justifyContent: 'space-around', gap: 16, flexWrap: 'wrap'
        }}>
          {[
            { num: '1', label: 'Серія безкоштовно' },
            { num: '4+', label: 'Серій вийшло' },
            { num: 'AI', label: 'Синтез голосу' },
            { num: '1₴', label: 'Соціальний доступ' },
            { num: '5', label: 'Платформ' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600, color: 'var(--amber)', display: 'block' }}>{s.num}</span>
              <span style={{ fontSize: 11, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community listening bar */}
      <div style={{
        background: 'linear-gradient(90deg,var(--bg-deep),#1e293b)', padding: '14px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        borderTop: '1px solid rgba(239,159,39,0.2)'
      }}>
        <span style={{ fontSize: 14, color: '#f8fafc' }}>
          Разом ми прослухали <b style={{ color: '#ef9f27' }}>24 831</b> годин українського контенту
        </span>
      </div>
    </>
  )
}
