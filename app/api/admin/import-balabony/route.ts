import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// ─── Парсер docx → структура ──────────────────────────────────────────────────

interface ParsedSeries {
  filename: string
  episodeNumber: number
  title: string
  description: string
  text: string
  slug: string
  seasonNumber: number
  warnings: string[]
  wordCount: number
}

function extractEpisodeNumberFromTitle(firstLine: string): number | null {
  const match = firstLine.match(/^[Сс][а-яёіїєґА-ЯЁІЇЄҐ]*\s*№?\s*(\d+)/u)
  if (!match) return null
  const num = parseInt(match[1], 10)
  if (isNaN(num) || num < 1 || num > 200) return null
  return num
}

function extractTitleFromFirstLine(firstLine: string): string {
  const colonIdx = firstLine.indexOf(':')
  if (colonIdx >= 0) return firstLine.slice(colonIdx + 1).trim()
  return firstLine.replace(/^[Сс][а-яёіїєґА-ЯЁІЇЄҐ]*\s*№?\s*\d+\s*/u, '').trim() || firstLine.trim()
}

function parseFilename(filename: string): { orderIndex: number | null; seriesNumber: number | null } {
  const m = filename.match(/^(\d+)_[Сс][а-яёіїєґА-ЯЁІЇЄҐ]*\s*(\d+)/u)
  if (!m) return { orderIndex: null, seriesNumber: null }
  return { orderIndex: parseInt(m[1], 10), seriesNumber: parseInt(m[2], 10) }
}

function calculateSeason(episodeNumber: number): number {
  return Math.ceil(episodeNumber / 20)
}

function extractDescription(paragraphs: string[]): string {
  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) continue
    if (/^[Сс][а-яёіїєґА-ЯЁІЇЄҐ]*\s*№?\s*\d+/u.test(trimmed)) continue
    if (trimmed.length < 100 && trimmed.includes(':') && !trimmed.includes('.')) continue
    if (trimmed.length <= 160) return trimmed
    const cut = trimmed.slice(0, 160)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim() + '…'
  }
  return ''
}

async function parseBalabonyDocx(buffer: Buffer, filename: string): Promise<ParsedSeries> {
  const warnings: string[] = []
  const result = await mammoth.extractRawText({ buffer })
  const rawText = result.value.trim()
  if (!rawText) throw new Error('Документ порожній')

  const paragraphs = rawText.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0)
  if (paragraphs.length === 0) throw new Error('Нема абзаців')

  const firstLine = paragraphs[0]
  const episodeNumberFromTitle = extractEpisodeNumberFromTitle(firstLine)
  const title = extractTitleFromFirstLine(firstLine)
  const { seriesNumber: filenameSeriesNumber } = parseFilename(filename)

  let episodeNumber: number
  if (episodeNumberFromTitle !== null) {
    episodeNumber = episodeNumberFromTitle
    if (filenameSeriesNumber !== null && filenameSeriesNumber !== episodeNumberFromTitle) {
      warnings.push(`Розбіжність: файл "${filenameSeriesNumber}" vs заголовок "${episodeNumberFromTitle}"`)
    }
  } else if (filenameSeriesNumber !== null) {
    episodeNumber = filenameSeriesNumber
    warnings.push(`Номер серії взято з імені файла`)
  } else {
    throw new Error(`Не визначено номер серії: "${firstLine}" / "${filename}"`)
  }

  const description = extractDescription(paragraphs)
  if (!description) warnings.push('Description не витягнуто')

  const text = paragraphs.join('\n\n')
  const seasonNumber = calculateSeason(episodeNumber)
  const slug = `s${seasonNumber}e${String(episodeNumber).padStart(2, '0')}`
  const wordCount = text.trim().split(/\s+/).length

  return {
    filename, episodeNumber, title, description, text,
    slug, seasonNumber, warnings, wordCount,
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const dryRun = formData.get('dryRun') === 'true'

    // Усі завантажені файли
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'Жоден файл не завантажено' }, { status: 400 })
    }

    // ─── Етап 1: парсинг усіх файлів ───
    const parsed: ParsedSeries[] = []
    const errors: Array<{ filename: string; error: string }> = []

    for (const file of files) {
      // Skip Word temp files (~$_*.docx)
      if (file.name.startsWith('~$')) continue
      if (!file.name.toLowerCase().endsWith('.docx')) continue

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await parseBalabonyDocx(buffer, file.name)
        parsed.push(result)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push({ filename: file.name, error: msg })
      }
    }

    // ─── Етап 2: перевірка дублікатів slug ───
    const slugCount: Record<string, number> = {}
    for (const p of parsed) {
      slugCount[p.slug] = (slugCount[p.slug] || 0) + 1
    }
    const duplicateSlugs = Object.entries(slugCount).filter(([, n]) => n > 1)

    // ─── Етап 3: dry run завжди повертає звіт ───
    if (dryRun) {
      return NextResponse.json({
        mode: 'dryRun',
        summary: {
          total: files.length,
          parsed: parsed.length,
          errors: errors.length,
          duplicateSlugs: duplicateSlugs.length,
        },
        results: parsed.map(p => ({
          filename: p.filename,
          slug: p.slug,
          season: p.seasonNumber,
          episode: p.episodeNumber,
          title: p.title,
          description: p.description,
          wordCount: p.wordCount,
          warnings: p.warnings,
          textPreview: p.text.slice(0, 300),
        })),
        errors,
        duplicateSlugs: duplicateSlugs.map(([slug, count]) => ({
          slug,
          count,
          files: parsed.filter(p => p.slug === slug).map(p => p.filename),
        })),
      })
    }

    // ─── Етап 4: реальний імпорт. Блокуємо якщо є дублікати/помилки ───
    if (duplicateSlugs.length > 0) {
      return NextResponse.json({
        error: 'Знайдено дублікати slug. Імпорт скасовано.',
        duplicates: duplicateSlugs.map(([slug]) => slug),
      }, { status: 400 })
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Деякі файли не вдалося розпарсити. Імпорт скасовано.',
        errors,
      }, { status: 400 })
    }

    // ─── Етап 5: upsert у Supabase ───
    const supabase = getSupabaseAdmin()
    const inserted: Array<{ slug: string; title: string }> = []
    const dbErrors: Array<{ slug: string; error: string }> = []

    for (const p of parsed) {
      const row = {
        slug: p.slug,
        type: 'balabony',
        title: p.title,
        description: p.description || null,
        season_number: p.seasonNumber,
        episode_number: p.episodeNumber,
        text: p.text,
        status: 'published',
        published_version: 'original',
      }

      const { error } = await supabase
        .from('content')
        .upsert(row, { onConflict: 'slug' })

      if (error) {
        dbErrors.push({ slug: p.slug, error: error.message })
      } else {
        inserted.push({ slug: p.slug, title: p.title })
      }
    }

    return NextResponse.json({
      mode: 'commit',
      summary: {
        total: files.length,
        parsed: parsed.length,
        inserted: inserted.length,
        dbErrors: dbErrors.length,
      },
      inserted,
      dbErrors,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
