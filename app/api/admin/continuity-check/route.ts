import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Кімната сценариста, Ф2a — AI-continuity по ОДНОМУ епізоду.
// На відміну від механічного /api/admin/canon-check (Ф1, без AI) та пакетного
// /api/admin/cross-review (уривки кількох серій), цей ендпойнт перевіряє ОДИН
// епізод проти ВСІЄЇ попередньої історії: бере recap усіх епізодів, що йдуть
// раніше за нього (канон-пам'ять), + рядки canon_bible (імена/факти) і просить
// Gemini знайти суперечності подіям/фактам з ПОСИЛАННЯМ на епізод-джерело,
// а також збої голосу/тону персонажів.
//
// POST { id } → { id, title, season, episode, prevCount, findings }

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Надійний парсер JSON від Gemini (дзеркало cross-review): зрізає ```json-огорожі,
// ловить перший {...}, прибирає висячі коми.
function parseGeminiJson(raw: string): Record<string, unknown> | null {
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim()
  try { return JSON.parse(stripped) as Record<string, unknown> } catch {}
  const m = stripped.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) as Record<string, unknown> } catch {}
    try { return JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as Record<string, unknown> } catch {}
  }
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown> } catch {}
  }
  return null
}

interface PrevEp {
  season: number | null
  episode: number | null
  title: string | null
  recap: string
}

// Ранг для впорядкування: сезон важить більше за серію. null → 0.
function rank(season: number | null, episode: number | null): number {
  return (season ?? 0) * 1000 + (episode ?? 0)
}

function epTag(season: number | null, episode: number | null): string {
  return `S${season ?? '?'}E${episode ?? '?'}`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  let id: string | undefined
  try {
    const body = await req.json()
    id = body?.id
  } catch {
    return NextResponse.json({ error: 'Невалідний запит' }, { status: 400 })
  }
  if (!id) {
    return NextResponse.json({ error: 'Не вказано id епізоду' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 1. Поточний епізод.
  const { data: ep, error: epErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('id', id)
    .single()

  if (epErr || !ep) {
    return NextResponse.json({ error: epErr?.message ?? 'Епізод не знайдено' }, { status: 404 })
  }

  const sourceText =
    ((ep.corrected_text as string | null) ?? '').trim() ||
    ((ep.text as string | null) ?? '').trim()

  if (!sourceText) {
    return NextResponse.json({ error: 'Текст епізоду порожній' }, { status: 422 })
  }

  const curRank = rank(ep.season_number, ep.episode_number)

  // 2. recap усіх епізодів, що йдуть РАНІШЕ за поточний (канон-пам'ять історії).
  //    ~95 рядків по 2-3 речення — спокійно влазить в один контекст Gemini,
  //    vector search не потрібен.
  const { data: allRows } = await supabase
    .from('content')
    .select('title, recap, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .not('recap', 'is', null)

  const prev: PrevEp[] = (allRows ?? [])
    .filter(r => (r.recap as string | null)?.trim() && rank(r.season_number, r.episode_number) < curRank)
    .map(r => ({
      season: r.season_number,
      episode: r.episode_number,
      title: r.title,
      recap: String(r.recap).trim(),
    }))
    .sort((a, b) => rank(a.season, a.episode) - rank(b.season, b.episode))

  // Перший епізод історії — нема з чим звіряти.
  if (prev.length === 0) {
    return NextResponse.json({
      id: ep.id,
      title: ep.title,
      season: ep.season_number,
      episode: ep.episode_number,
      prevCount: 0,
      findings: { continuity: [], voices: [], summary: 'Найраніший епізод — попередньої історії для звірки немає.' },
    })
  }

  // 3. canon_bible — імена/факти для контексту (може бути порожнім).
  const { data: canonRows } = await supabase
    .from('canon_bible')
    .select('kind, key, canonical, forbidden')

  const canonLines = (canonRows ?? [])
    .map(r => {
      const forb = Array.isArray(r.forbidden) && r.forbidden.length
        ? ` (не плутати з: ${(r.forbidden as string[]).join(', ')})`
        : ''
      return `- [${r.kind}] ${r.key}: ${r.canonical}${forb}`
    })
    .join('\n')

  const historyBlock = prev
    .map(p => `${epTag(p.season, p.episode)} «${p.title ?? ''}»: ${p.recap}`)
    .join('\n')

  const prompt = `Ти — редактор-сценарист україномовного серіалу «Балабони» (життя українського села, гумор). Твоє завдання — перевірити НОВИЙ епізод на узгодженість із попередньою історією та каноном. Поверни ТІЛЬКИ JSON без markdown.

КАНОН (імена, факти, відповідності):
${canonLines || '(біблія порожня)'}

ПОПЕРЕДНЯ ІСТОРІЯ (короткі резюме епізодів у хронологічному порядку):
${historyBlock}

НОВИЙ ЕПІЗОД ${epTag(ep.season_number, ep.episode_number)} «${ep.title ?? ''}» — повний текст:
"""
${sourceText}
"""

Перевір і поверни JSON такої структури:
{
  "continuity": [
    { "severity": "error" | "warn", "issue": "<суть суперечності>", "source": "<епізод-джерело, напр. S2E14, або 'канон'>" }
  ],
  "voices": [
    { "character": "<ім'я>", "issue": "<у чому збій голосу/тону: говорить не у своєму характері, чужа катчфраза тощо>" }
  ],
  "summary": "<1-2 речення загального висновку>"
}

Правила:
1. continuity — лише РЕАЛЬНІ суперечності подіям/фактам попередніх епізодів або канону (напр.: персонаж, що раніше поїхав/помер, тут діє без пояснень; змінилися родинні зв'язки, клички тварин, імена). Для кожної вкажи source — епізод, з яким конфлікт, або "канон".
2. severity: "error" — пряма суперечність факту; "warn" — підозра/нечітко.
3. voices — лише явні збої характеру/тону персонажа.
4. НЕ вигадуй проблем. Якщо все узгоджено — повертай порожні масиви й коротке summary.
5. Не оцінюй якість сюжету, орфографію чи довжину — лише узгодженість.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const parsed = parseGeminiJson(raw)

    if (!parsed) {
      return NextResponse.json({
        id: ep.id, title: ep.title, season: ep.season_number, episode: ep.episode_number,
        prevCount: prev.length,
        findings: { continuity: [], voices: [], summary: 'AI повернув нерозбірливу відповідь — спробуйте ще раз.' },
        rawError: true,
      })
    }

    return NextResponse.json({
      id: ep.id,
      title: ep.title,
      season: ep.season_number,
      episode: ep.episode_number,
      prevCount: prev.length,
      findings: {
        continuity: Array.isArray(parsed.continuity) ? parsed.continuity : [],
        voices: Array.isArray(parsed.voices) ? parsed.voices : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      },
    })
  } catch (err: unknown) {
    // Gemini іноді віддає 503 (перевантаження) — фронт може повторити.
    const msg = err instanceof Error ? err.message : 'Помилка AI'
    const overloaded = /503|overload|unavailable/i.test(msg)
    return NextResponse.json(
      { error: msg, overloaded },
      { status: overloaded ? 503 : 500 },
    )
  }
}
