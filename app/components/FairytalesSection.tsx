export default function FairytalesSection() {
  return (
    <section className="fairytales-section" style={{ background: 'var(--dark)', padding: '64px 5%', position: 'relative' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(245,166,35,0.12)',
          border: '1px solid rgba(245,166,35,0.35)',
          color: '#f5a623',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          fontFamily: "'Montserrat', sans-serif",
          marginBottom: 18
        }}>
          Скоро
        </div>
        <h2 style={{
          fontFamily: "'Lora', serif",
          fontSize: 'clamp(28px, 6vw, 44px)',
          fontWeight: 600,
          color: '#fff',
          margin: '0 0 12px',
          letterSpacing: -0.5
        }}>
          Казки
        </h2>
        <p style={{
          fontSize: 'clamp(14px, 2.5vw, 17px)',
          color: '#94a3b8',
          margin: '0 0 8px',
          lineHeight: 1.6
        }}>
          Українські народні казки для дітей та дорослих
        </p>
        <p style={{
          fontSize: 14,
          color: '#64748b',
          margin: 0,
          fontStyle: 'italic'
        }}>
          Готуємо колекцію аудіоказок. Слідкуй за оновленнями.
        </p>
      </div>
    </section>
  )
}