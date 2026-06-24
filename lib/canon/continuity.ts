// lib/canon/continuity.ts
// Кімната сценариста, Ф2 — спільне ЯДРО AI-continuity.
// Використовується двома ендпойнтами:
//   /api/admin/continuity-check  — один епізод на вимогу (кнопка «Хронологія»);
//   /api/admin/continuity-batch  — пакетний реаудит усього корпусу.
// Тут уся логіка: збір recap попередніх епізодів + canon_bible, промпт, виклик
// Gemini, розбір. Ендпойнти лишаються тонкими.

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ContIssue {
  severity: 'error' | 'warn'
  issue: string
  source?: string
}
export interface VoiceIssue {
  character: string
  issue: string
}
export interface ContFindings {
  continuity: ContIssue[]
  voices: VoiceIssue[]
  summary: string
}

export interface ContinuityResult {
  id: string
  title: string | null
  season: number | null
  episode: number | null
  prevCount: number
  findings: ContFindings
}

export type ContinuityOutcome =
  | { ok: true; data: ContinuityResult }
  | { ok: false; error: string; overloaded: boolean; status: number }

// Надійний парсер JSON від Gemini: зрізає ```json-огорожі, ловить перший {...},
// прибирає висячі коми.
export function parseGeminiJson(raw: string): Record<string, unknown> | null {
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

function rank(season: number | null, episode: number | null): number {
  return (season ?? 0) * 1000 + (episode ?? 0)
}
function epTag(season: number | null, episode: number | null): string {
  return `S${season ?? '?'}E${episode ?? '?'}`
}

interface PrevEp { season: number | null; episode: number | null; title: string | null; recap: string }

// Аналіз ОДНОГО епізоду проти всієї попередньої історії + канону.
// supabase — адмін-клієнт; apiKey — GEMINI_API_KEY; id — content.id.
export async function analyzeEpisodeContinuity(
  supabase: SupabaseClient,
  apiKey: string,
  id: string,
): Promise<ContinuityOutcome> {
  // 1. Поточний епізод.
  const { data: ep, error: epErr } = await supabase
    .from('content')
    .select('id, title, text, corrected_text, season_number, episode_number')
    .eq('id', id)
    .single()

  if (epErr || !ep) {
    return { ok: false, error: epErr?.message ?? 'Епізод не знайдено', overloaded: false, status: 404 }
  }

  const sourceText =
    ((ep.corrected_text as string | null) ?? '').trim() ||
    ((ep.text as string | null) ?? '').trim()

  if (!sourceText) {
    return { ok: false, error: 'Текст епізоду порожній', overloaded: false, status: 422 }
  }

  const curRank = rank(ep.season_number, ep.episode_number)

  // 2. recap усіх епізодів раніше за поточний (канон-пам'ять історії).
  const { data: allRows } = await supabase
    .from('content')
    .select('title, recap, season_number, episode_number')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .not('recap', 'is', null)

  const prev: PrevEp[] = (allRows ?? [])
    .filter(r => (r.recap as string | null)?.trim() && rank(r.season_number, r.episode_number) < curRank)
    .map(r => ({ season: r.season_number, episode: r.episode_number, title: r.title, recap: String(r.recap).trim() }))
    .sort((a, b) => rank(a.season, a.episode) - rank(b.season, b.episode))

  // Найраніший епізод — нема з чим звіряти.
  if (prev.length === 0) {
    return {
      ok: true,
      data: {
        id: ep.id, title: ep.title, season: ep.season_number, episode: ep.episode_number,
        prevCount: 0,
        findings: { continuity: [], voices: [], summary: 'Найраніший епізод — попередньої історії для звірки немає.' },
      },
    }
  }

  // 3. canon_bible — імена/факти (може бути порожнім).
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
      return {
        ok: true,
        data: {
          id: ep.id, title: ep.title, season: ep.season_number, episode: ep.episode_number,
          prevCount: prev.length,
          findings: { continuity: [], voices: [], summary: 'AI повернув нерозбірливу відповідь — спробуйте ще раз.' },
        },
      }
    }

    return {
      ok: true,
      data: {
        id: ep.id, title: ep.title, season: ep.season_number, episode: ep.episode_number,
        prevCount: prev.length,
        findings: {
          continuity: Array.isArray(parsed.continuity) ? (parsed.continuity as ContIssue[]) : [],
          voices: Array.isArray(parsed.voices) ? (parsed.voices as VoiceIssue[]) : [],
          summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        },
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка AI'
    const overloaded = /503|overload|unavailable/i.test(msg)
    return { ok: false, error: msg, overloaded, status: overloaded ? 503 : 500 }
  }
}
