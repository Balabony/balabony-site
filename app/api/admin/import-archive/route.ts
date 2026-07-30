import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Імпорт архіву Сторріса в Балабони.
 *
 * Кожна історія лягає чернеткою з іменем автора в author_name; author_id
 * лишається порожнім, доки автор не зареєструється — тоді прив’язуємо окремо.
 *
 * Повторний запуск нічого не дублює: у writer_note першим сегментом
 * записано мітку storriss:<id>, і рядки з такою міткою пропускаються.
 *
 * Мітка звіряється ТОЧНО (split_part по ' · '), а не через like '%…%':
 * пошук за шаблоном збігався з будь-яким довшим числом — storriss:12
 * ловило storriss:120, storriss:125, і нові історії мовчки зникали.
 *
 * Лічильники роздільні: added — вставлено, duplicates — уже були,
 * failed — не вдалося. Інакше «пропущено» змішує дублі з помилками
 * і виглядає так, ніби імпорт нічого не зробив.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type Item = {
  source_id?: number | string
  source_url?: string | null
  title?: string
  author?: string
  pen_name?: string | null
  text?: string
  image_url?: string | null
  published_at?: string | null
  category?: string | null
  tags?: string | null
  is_pay?: string | null
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '',
}

function slugify(s: string): string {
  const out = s.toLowerCase().split('').map(ch => TRANSLIT[ch] ?? ch).join('')
  return out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'istoriia'
}

function slugFromUrl(url: string | null | undefined, title: string): string {
  if (url) {
    const tail = url.split('/').filter(Boolean).pop()
    if (tail && /^[a-z0-9-]+$/i.test(tail)) return tail.toLowerCase().slice(0, 80)
  }
  return slugify(title)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })

  let items: Item[]
  try {
    const body = (await req.json()) as { items?: Item[] }
    items = Array.isArray(body.items) ? body.items : []
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (items.length === 0) return NextResponse.json({ ok: false, error: 'Порожня партія' }, { status: 400 })
  if (items.length > 30) return NextResponse.json({ ok: false, error: 'Не більше 30 за раз' }, { status: 400 })

  let added = 0
  let duplicates = 0
  let failed = 0
  const problems: string[] = []

  for (const it of items) {
    const title = (it.title ?? '').trim()
    const text = (it.text ?? '').trim()
    const author = (it.author ?? '').trim()

    if (!title || !text || !author) { failed++; problems.push(`без назви або тексту: ${title || it.source_id}`); continue }

    const sourceId = String(it.source_id ?? '').trim()
    if (!sourceId) { failed++; problems.push(`без source_id: ${title.slice(0, 40)}`); continue }

    const mark = `storriss:${sourceId}`

    const dup = await dbQuery(
      `select id from content where split_part(writer_note, ' · ', 1) = $1 limit 1`,
      [mark],
    )
    if (dup.rowCount && dup.rowCount > 0) { duplicates++; continue }

    let slug = slugFromUrl(it.source_url, title)
    for (let i = 0; i < 12; i++) {
      const busy = await dbQuery(`select id from content where slug = $1 limit 1`, [slug])
      if (!busy.rowCount) break
      slug = `${slugFromUrl(it.source_url, title)}-${i + 2}`
    }

    const note = [
      mark,
      it.source_url ? `джерело: ${it.source_url}` : '',
      it.published_at ? `у газеті: ${String(it.published_at).slice(0, 10)}` : '',
      it.pen_name ? `псевдонім: ${it.pen_name}` : '',
      it.tags ? `теги: ${it.tags}` : '',
    ].filter(Boolean).join(' · ')

    try {
      await dbQuery(
        `insert into content
           (type, status, audio_status, slug, title, text, author_name, category,
            cover_url, is_free, is_adult, is_premium, images, writer_note)
         values ('story', 'draft', 'pending', $1, $2, $3, $4, $5, $6, $7, false, false, '[]'::jsonb, $8)`,
        [slug, title, text, author, it.category ?? null, it.image_url ?? null, it.is_pay === 'free', note],
      )
      added++
    } catch (e) {
      failed++
      problems.push(`${title.slice(0, 40)}: ${(e as Error).message.slice(0, 90)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    duplicates,
    failed,
    skipped: duplicates + failed,
    problems: problems.slice(0, 10),
  })
}
