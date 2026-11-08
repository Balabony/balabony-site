// Текст договору (блоки з підставленими значеннями) — спільний для кабінету /author/contract/[id] і посилання /pidpys/…, 08.11.2026.
export default function ContractText({ blocks }: { blocks: { k: string; t: string }[] }) {
  return (
    <>
  {blocks.map((b, i) => {
    const t = b.t
    if (b.k === 'h1') {
      return <h1 key={i} style={{ fontSize: 23, textAlign: 'center', margin: '0 0 6px', fontWeight: 700, letterSpacing: 0.5 }}>{t}</h1>
    }
    // Підзаголовок під назвою договору
    if (i === 1) {
      return <p key={i} style={{ fontSize: 16, textAlign: 'center', margin: '0 0 26px', fontWeight: 700 }}>{t}</p>
    }
    // Рядок «№ … від …» і місто — по краях одного рядка
    if (t.startsWith('№') && t.includes('м. Львів')) {
      const city = 'м. Львів'
      const left = t.replace(city, '').trim()
      return (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', fontSize: 14.5, fontWeight: 700, margin: '0 0 20px' }}>
          <span>{left}</span>
          <span>{city}</span>
        </div>
      )
    }
    if (b.k === 'h2') {
      return <h2 key={i} style={{ fontSize: 16, margin: '20px 0 8px', fontWeight: 700 }}>{t}</h2>
    }
    if (b.k === 'req') {
      return <p key={i} style={{ fontSize: 15, margin: '18px 0 6px', fontWeight: 700, letterSpacing: 0.5 }}>{t}</p>
    }
    return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px', textAlign: 'justify' }}>{t}</p>
  })}
    </>
  )
}
