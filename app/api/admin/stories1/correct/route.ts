import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
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

Поверни ТІЛЬКИ валідний JSON без markdown і без коментарів:
{
  "corrected_text": "<ПОВНИЙ виправлений текст — зберігай усі абзаци та розриви рядків>",
  "changes": [
    {
      "id": 1,
      "original": "<точна фраза з оригінального тексту>",
      "corrected": "<нова фраза яка є в corrected_text>",
      "reason": "<коротке пояснення>"
    }
  ]
}

Правила:
- Максимум 15 правок
- Правь лише суттєві помилки та стилістично невдалі місця
- corrected_text відрізняється від оригіналу тільки у виправлених місцях
- original — точна підрядкова фраза з оригінального тексту
- corrected — точна підрядкова фраза яка є в corrected_text замість original

Текст:
---
${text}
---`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI повернув неочікуваний формат', raw }, { status: 500 })
    }

    let result
    try {
      result = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI', raw }, { status: 500 })
    }

    return NextResponse.json({
      corrected_text: result.corrected_text ?? text,
      changes:        result.changes ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
