export default function Hero() {
  return (
    <>
      <div style={{
        background: 'var(--dark)', padding: '48px 5% 60px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%,rgba(37,99,235,0.15) 0%,transparent 70%), radial-gradient(ellipse 50% 60% at 80% 40%,rgba(230,57,70,0.12) 0%,transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: "'Lora', serif",
            fontSize: 'clamp(32px, 8vw, 60px)',
            fontWeight: 600,
            color: '#fff', lineHeight: 1.1,
            letterSpacing: -0.5, margin: '0 0 18px',
          }}>
            Читай українське
          </h1>

          <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: '#94a3b8', margin: '0 0 28px', lineHeight: 1.75, maxWidth: 540 }}>
            Українські історії для всієї родини
          </p>

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
      <div style={{ background: 'var(--dark)', borderTop: '1px solid rgba(255,255,255,0.15)', padding: '20px 5%' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex',
          justifyContent: 'space-around', gap: 16, flexWrap: 'wrap'
        }}>
          {[
            { num: '1',   label: 'Серія безкоштовно' },
            { num: '4+',  label: 'Серій вийшло' },
            { num: 'AI',  label: 'Синтез голосу' },
            { num: '1₴',  label: 'Соціальний доступ' },
            { num: '5',   label: 'Платформ' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: 90, flex: '1 1 90px' }}>
              <span style={{ fontFamily: "'Lora', serif", fontSize: 24, fontWeight: 600, color: 'var(--amber)', display: 'block' }}>{s.num}</span>
              <span style={{ fontSize: 10, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', lineHeight: 1.4 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community bar */}
      <div style={{
        background: 'linear-gradient(90deg,var(--bg-deep),#1e293b)', padding: '12px 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        borderTop: '1px solid rgba(255,255,255,0.15)'
      }}>
        <span style={{ fontSize: 13, color: '#f8fafc', textAlign: 'center' }}>
          Разом ми прослухали <b style={{ color: '#ef9f27' }}>24 831</b> годин українського контенту
        </span>
      </div>
    </>
  )
}
