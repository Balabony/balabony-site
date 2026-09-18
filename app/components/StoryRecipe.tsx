// Рецепт під твором. Пілот 18.09.2026 на 3–5 творах, де їжа — частина
// сюжету («Пекла мати „карпати"…», «Про пироги та наречених» тощо).
//
// НАВІЩО: не заради пошукового трафіку на рецепти (досвід Сторрісу:
// такі відвідувачі приходять раз і не повертаються), а щоб утримати
// читача на сторінці твору. Міряти дочитуваннями цих творів проти решти.
//
// ФОРМАТ поля content.recipe — звичайний текст, без HTML:
//   перший рядок           → назва рецепта
//   «Інгредієнти:», «Приготування:» (будь-який рядок, що закінчується двокрапкою) → підзаголовок
//   «- …»                  → пункт списку інгредієнтів
//   «1. …», «2. …»         → крок приготування
//   решта                  → звичайний абзац (порада, примітка)
// Виводиться як текст React, тож HTML у полі нічого не зламає.

type Block =
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string }

function parse(src: string): { title: string; blocks: Block[] } {
  const lines = src.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
  const title = lines.shift() ?? ''
  const blocks: Block[] = []
  for (const line of lines) {
    const last = blocks[blocks.length - 1]
    const ul = line.match(/^[-–—•]\s+(.*)$/)
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ul) {
      if (last?.kind === 'ul') last.items.push(ul[1]); else blocks.push({ kind: 'ul', items: [ul[1]] })
    } else if (ol) {
      if (last?.kind === 'ol') last.items.push(ol[1]); else blocks.push({ kind: 'ol', items: [ol[1]] })
    } else if (line.endsWith(':') && line.length <= 40) {
      blocks.push({ kind: 'h', text: line.slice(0, -1) })
    } else {
      blocks.push({ kind: 'p', text: line })
    }
  }
  return { title, blocks }
}

const GOLD = '#EF9F27'

export default function StoryRecipe({ recipe }: { recipe: string | null | undefined }) {
  if (!recipe || !recipe.trim()) return null
  const { title, blocks } = parse(recipe)
  return (
    <aside
      aria-labelledby="story-recipe-title"
      style={{
        margin: '36px 0 28px', padding: '22px 22px 18px',
        background: '#0f1e3a', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 16,
        color: '#dde6f0', fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: GOLD }}>
        Рецепт до історії
      </div>
      <h2 id="story-recipe-title" style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 24, color: '#FFF8EE', margin: '8px 0 12px' }}>
        {title}
      </h2>
      {blocks.map((b, i) => {
        if (b.kind === 'h') return <h3 key={i} style={{ fontSize: 15, color: GOLD, margin: '16px 0 6px' }}>{b.text}</h3>
        if (b.kind === 'ul') return (
          <ul key={i} style={{ margin: '0 0 8px', paddingLeft: 20, lineHeight: 1.7 }}>
            {b.items.map((t, j) => <li key={j}>{t}</li>)}
          </ul>
        )
        if (b.kind === 'ol') return (
          <ol key={i} style={{ margin: '0 0 8px', paddingLeft: 22, lineHeight: 1.7 }}>
            {b.items.map((t, j) => <li key={j} style={{ marginBottom: 6 }}>{t}</li>)}
          </ol>
        )
        return <p key={i} style={{ margin: '0 0 10px', lineHeight: 1.7 }}>{b.text}</p>
      })}
    </aside>
  )
}
