import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorSlug } from '@/lib/author-slug'

/**
 * Що читати далі — під текстом твору.
 *
 * Дві причини, і обидві важать однаково. Читачеві: дочитавши історію, він
 * упирається в порожнечу, і єдиний вихід — кнопка «Більше історій» на весь
 * каталог. Пошуковикові: 994 сторінки творів не мали між собою жодного
 * посилання, тож Google обходив їх лише через каталог і карту сайту, а вагу
 * між ними не передавав зовсім.
 *
 * Блок серверний: посилання потрапляють у HTML, а не з'являються в браузері.
 */

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

type Item = { id: string; slug: string | null; title: string; author_name: string | null; genre: string | null }

async function fetchItems(params: {
  excludeId: string
  authorName?: string | null
  genre?: string | null
  limit: number
}): Promise<Item[]> {
  const { excludeId, authorName, genre, limit } = params
  try {
    const supabase = getSupabaseAdmin()
    let q = supabase
      .from('content')
      .select('id, slug, title, author_name, genre')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .neq('id', excludeId)
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (authorName) q = q.eq('author_name', authorName)
    if (genre) q = q.eq('genre', genre)

    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Item[]
  } catch {
    return []
  }
}

function Card({ item }: { item: Item }) {
  return (
    <a
      href={`/stories/${item.slug ?? item.id}`}
      style={{
        display: 'block',
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none',
        color: '#f5f0e8',
      }}
    >
      <span style={{ display: 'block', fontSize: 16, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>
        {item.title}
      </span>
      <span style={{ fontSize: 12, color: 'var(--on-dark-muted, #8899bb)', fontFamily: FONT }}>
        {[item.author_name, item.genre].filter(Boolean).join(' · ')}
      </span>
    </a>
  )
}

function Section({ title, items, more }: { title: string; items: Item[]; more?: { href: string; label: string } }) {
  if (items.length === 0) return null
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: GOLD, margin: 0, fontFamily: FONT }}>{title}</h2>
        {more && (
          <a href={more.href} style={{ fontSize: 13, color: 'var(--on-dark-muted, #8899bb)', textDecoration: 'none', fontFamily: FONT }}>
            {more.label} →
          </a>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
        {items.map((i) => <Card key={i.id} item={i} />)}
      </div>
    </section>
  )
}

export default async function RelatedStories({
  storyId,
  authorName,
  genre,
}: {
  storyId: string
  authorName: string | null
  genre: string | null
}) {
  const [byAuthor, byGenre] = await Promise.all([
    authorName ? fetchItems({ excludeId: storyId, authorName, limit: 4 }) : Promise.resolve([]),
    genre ? fetchItems({ excludeId: storyId, genre, limit: 8 }) : Promise.resolve([]),
  ])

  // Твори автора вже показані вище — у добірці за жанром їх не дублюємо.
  const shown = new Set(byAuthor.map((i) => i.id))
  const similar = byGenre.filter((i) => !shown.has(i.id)).slice(0, 4)

  if (byAuthor.length === 0 && similar.length === 0) return null

  return (
    <>
      <Section
        title={authorName ? `Ще від автора: ${authorName}` : 'Ще від автора'}
        items={byAuthor}
        more={authorName ? { href: `/avtor/${authorSlug(authorName)}`, label: 'Усі твори автора' } : undefined}
      />
      <Section title={genre ? `Схожі: ${genre}` : 'Схожі історії'} items={similar} />
    </>
  )
}
