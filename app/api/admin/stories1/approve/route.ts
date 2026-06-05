import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

function transliterate(s: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',і:'i',ї:'yi',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',
    ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya',"'":'',"’":'',"`":'',
  }
  return s.toLowerCase().split('').map(ch => map[ch] ?? ch).join('')
}

const CATEGORIES = ['З життя','Містика','Любов','Воєнні','Історичні','Родинні','Гумор','Детектив','Психологічні','Дитячі']

async function autoClassify(text: string): Promise<string> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{ role: 'user', content:
        `Обери ОДНУ категорію зі списку, яка найкраще описує цю історію. Поверни ТІЛЬКИ назву категорії без пояснень.\nСписок: ${CATEGORIES.join(', ')}\nТекст:\n${text.slice(0, 2000)}`
      }],
    })
    const answer = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    return CATEGORIES.includes(answer) ? answer : 'З життя'
  } catch {
    return 'З життя'
  }
}

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

const STATUS_MAP: Record<string, string> = {
  approve:  'approved',
  reject:   'rejected',
  revision: 'revision',
}

const STATUS_MSG: Record<string, string> = {
  approved: 'Історію схвалено та опубліковано.',
  rejected: 'Історію відхилено.',
  revision: 'Відправлено на доопрацювання.',
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      authorName, title, genre, text, photoBase64, aiReport, action, adminNotes,
      correctedText, changes, publishedVersion,
      humanizedText, humanizeSummary,
      category, isAdult, editId,
    } = await req.json()

    if (!title || !genre || !text || !action) {
      return NextResponse.json({ error: 'title, genre, text, action required' }, { status: 400 })
    }

    const wordCount = text.trim().split(/\s+/).length
    const duration_minutes = Math.max(1, Math.round(wordCount / 200))

    const resolvedCategory: string = (category && CATEGORIES.includes(category))
      ? category
      : await autoClassify(text)

    const status = STATUS_MAP[action]
    if (!status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const record = {
      author_name:       authorName ?? '',
      title,
      genre,
      text,
      status,
      ai_report:         aiReport ?? null,
      ai_score:          aiReport?.overall?.recommendation ?? null,
      corrected_text:    correctedText ?? null,
      humanized_text:    humanizedText ?? null,
      humanize_summary:  humanizeSummary ?? null,
      published_version: publishedVersion ?? 'original',
      approved_at:       status === 'approved' ? new Date().toISOString() : null,
      duration_minutes,
      category:          resolvedCategory,
      is_adult:          isAdult ?? false,
    }

    let storyId: string

    if (editId) {
      // Редагування наявної історії — оновлюємо за id, slug/id/type не чіпаємо
      storyId = editId
      const { error: updateError } = await supabase
        .from('content').update(record).eq('id', editId)
      if (updateError) throw updateError
    } else {
      // Нова історія — генеруємо id та унікальний slug, вставляємо
      storyId = crypto.randomUUID()

      let slug = transliterate(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72) || storyId

      const { data: slugTaken } = await supabase
        .from('content').select('id').eq('slug', slug).maybeSingle()
      if (slugTaken) {
        slug = `${slug}-${storyId.slice(0, 6)}`
      }

      const { error: insertError } = await supabase.from('content').insert({
        id:   storyId,
        type: 'story',
        slug,
        ...record,
      })
      if (insertError) throw insertError
    }

    // Обкладинка: фото → пряме збереження; казка без фото → ШІ-ілюстрація
    if (status === 'approved') {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      const endpoint = photoBase64
        ? 'generate-cover'
        : (genre === 'Казка' ? 'generate-fairytale-cover' : null)

      if (endpoint) {
        const body = photoBase64
          ? JSON.stringify({ storyId, title, genre, category: resolvedCategory, photoBase64 })
          : JSON.stringify({ storyId, title, text })

        fetch(`${baseUrl}/api/admin/stories1/${endpoint}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
          .then(async r => {
            if (!r.ok) return
            const { url: coverUrl } = await r.json() as { url?: string }
            if (coverUrl) {
              await supabase.from('content').update({ cover_url: coverUrl }).eq('id', storyId)
            }
          })
          .catch(() => {})
      }
    }

    return NextResponse.json({
      id:      storyId,
      status,
      message: STATUS_MSG[status],
      coverGenerating: status === 'approved' && !!photoBase64,
    })
  } catch (err) {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const detail = [e?.code && `[${e.code}]`, e?.message, e?.details, e?.hint]
      .filter(Boolean).join(' · ') || (typeof err === 'string' ? err : JSON.stringify(err))
    console.error('approve error:', err)
    return NextResponse.json({ error: detail || 'Невідома помилка' }, { status: 500 })
  }
}
