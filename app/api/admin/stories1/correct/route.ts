import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// Витягти вміст між двома маркерами (без них). null, якщо не знайдено.
function between(s: string, a: string, b: string): string | null {
  const i = s.indexOf(a)
  if (i < 0) return null
  const j = s.indexOf(b, i + a.length)
  if (j < 0) return null
  return s.slice(i + a.length, j).trim()
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, genre } = await req.json()
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Ти — досвідчений редактор українських художніх текстів. Зроби редакторську правку: виправ стилістичні недоліки, граматичні помилки, незграбні звороти, пунктуацію. Зберігай авторський голос і стиль${genre ? ` (жанр: ${genre})` : ''}.

ФОРМАТ ВІДПОВІДІ — рівно дві секції з маркерами, нічого більше:

===TEXT===
<ПОВНИЙ виправлений текст: усі абзаци та розриви рядків як у звичайному тексті — БЕЗ екранування, БЕЗ JSON>
===ENDTEXT===
===CHANGES===
[
  { "id": 1, "original": "<точна фраза з оригіналу>", "corrected": "<нова фраза, що є у виправленому тексті>", "reason": "<коротке пояснення>" }
]
===ENDCHANGES===

Правила:
- Максимум 15 правок у списку CHANGES
- Правь лише суттєві помилки та стилістично невдалі місця
- У секції TEXT — звичайний текст (не JSON): пиши абзаци як є, з реальними переносами рядків
- CHANGES — валідний JSON-масив; кожна original/corrected — короткі підрядкові фрази (не весь текст)

Текст:
---
${text}
---`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // 1) Повний текст — звичайний текст між маркерами (не JSON).
    const correctedText = between(raw, '===TEXT===', '===ENDTEXT===') ?? raw.trim() ?? text

    // 2) Список змін — окремий маленький JSON. Якщо не парситься — не валимо все.
    let changes: unknown[] = []
    const changesRaw = between(raw, '===CHANGES===', '===ENDCHANGES===')
    if (changesRaw) {
      const arr = changesRaw.match(/\[[\s\S]*\]/)
      if (arr) {
        try { changes = JSON.parse(arr[0]) } catch { changes = [] }
      }
    }

    return NextResponse.json({
      corrected_text: correctedText || text,
      changes,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
