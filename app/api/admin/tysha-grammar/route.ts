import { NextRequest, NextResponse } from 'next/server'

// Граматика/орфографія/коми через LanguageTool (правиловий рушій, БЕЗ AI-ляпів).
// Кілька запитів поспіль → даємо до 60 c.
export const maxDuration = 60

// За замовчуванням публічний API; для self-hosted Docker — задати LANGUAGETOOL_URL.
const LT_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check'

type Suggestion = { before: string; after: string; reason: string }

interface LTReplacement { value: string }
interface LTMatch {
  message?: string
  shortMessage?: string
  offset: number
  length: number
  replacements?: LTReplacement[]
  rule?: { id?: string; category?: { id?: string; name?: string } }
}

// Категорії, які ми вже закриваємо своєю механікою — не дублюємо.
const SKIP_CATEGORIES = new Set(['TYPOGRAPHY', 'WHITESPACE'])

// Перетворити матчі LanguageTool у правки «було→стане» з контекстом для унікальності.
export function ltMatchesToSuggestions(chunk: string, matches: LTMatch[]): Suggestion[] {
  const out: Suggestion[] = []
  for (const m of matches) {
    const rep = m.replacements?.[0]?.value
    if (rep == null) continue                                   // без заміни — застосувати нічим
    if (m.length < 0) continue
    const catId = m.rule?.category?.id ?? ''
    if (SKIP_CATEGORIES.has(catId)) continue                    // це наша зона (лапки/пробіли)

    const CTX = 14
    const start = Math.max(0, m.offset - CTX)
    const end = Math.min(chunk.length, m.offset + m.length + CTX)
    const before = chunk.slice(start, end)
    const rel = m.offset - start
    const after = before.slice(0, rel) + rep + before.slice(rel + m.length)
    if (!before.trim() || before === after) continue

    const reason = (m.shortMessage || m.message || 'граматика').trim()
    out.push({ before, after, reason })
  }
  return out
}

export async function POST(request: NextRequest) {
  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  // Шматки ~1800 символів по абзацах (ліміт довжини + щадимо rate-limit).
  const splitChunks = (s: string, maxChars = 1800): string[] => {
    const paras = s.split(/\n/)
    const chunks: string[] = []
    let cur = ''
    for (const p of paras) {
      if (cur && cur.length + p.length + 1 > maxChars) { chunks.push(cur); cur = '' }
      cur = cur ? cur + '\n' + p : p
    }
    if (cur) chunks.push(cur)
    return chunks
  }

  const existsInText = (full: string, frag: string): boolean => {
    const esc = frag.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    try { return new RegExp(esc).test(full) } catch { return false }
  }

  try {
    const chunks = splitChunks(text)
    const all: Suggestion[] = []
    let rateLimited = false

    for (const chunk of chunks) {
      const res = await fetch(LT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: chunk, language: 'uk-UA', level: 'default' }).toString(),
      })
      if (res.status === 429) { rateLimited = true; break }     // перевищено ліміт запитів
      if (!res.ok) continue
      const data = await res.json() as { matches?: LTMatch[] }
      for (const s of ltMatchesToSuggestions(chunk, data.matches ?? [])) {
        if (existsInText(text, s.before)) all.push(s)
      }
    }

    // Дедуп за «було→стане».
    const seen = new Set<string>()
    const suggestions = all.filter((s) => {
      const k = s.before + '→' + s.after
      if (seen.has(k)) return false
      seen.add(k); return true
    })

    return NextResponse.json({
      suggestions,
      chunks: chunks.length,
      note: rateLimited ? 'LanguageTool: перевищено ліміт безкоштовного API — перевірено частину. Спробуй за хвилину або підключи свій сервер.' : '',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка LanguageTool'
    return NextResponse.json({ error: `LanguageTool недоступний: ${msg}` }, { status: 502 })
  }
}
