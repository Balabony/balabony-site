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
          </div>
        </div>
      </div>

    </>
  )
}
