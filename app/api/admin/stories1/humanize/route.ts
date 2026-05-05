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
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Ти — редактор художньої прози. Твоє завдання — зробити текст живішим і природнішим.

ВАЖЛИВО: НЕ намагайся технічно "обдурити" ШІ-детектор. Твоя ціль — зробити текст справді живим, а не маніпулювати метриками. Пиши так, як писала б жива людина.

ЩО ЗМІНИТИ:
1. Варіюй довжину речень — чергуй короткі (3–8 слів) з довшими. Уникай монотонного ритму
2. Ламай симетрію абзаців — не кожен абзац = завершена думка. Нехай думка інколи "перетікає"
3. Додавай розмовні звороти де природньо, але без надмірності
4. Замінюй прямолінійні висновки на конкретну деталь або образ
5. Прибирай ШІ-кліше: "це не просто X, це Y", "він/вона — останній хто...", занадто "правильні" фінали
6. Додай легку неідеальність — думка може повторитись іншими словами, фраза може бути трохи незавершеною
7. Уникай надполірованості — жива мова має нерівності${genre ? `\n8. Зберігай стиль жанру: ${genre}` : ''}

ЩО ЗБЕРЕГТИ ПОВНІСТЮ:
- Сюжет, всіх персонажів, всі події — нічого не додавати і не прибирати
- Основну тему та ідею
- Структуру: кількість абзаців може змінитись незначно, але не кардинально

Поверни ТІЛЬКИ валідний JSON без markdown і коментарів:
{
  "humanized_text": "<повний переписаний текст — зберігай розриви рядків між абзацами>",
  "changes_summary": [
    "<що саме змінено і чому — пункт 1, просто і конкретно>",
    "<пункт 2>",
    "<пункт 3>",
    "<пункт 4>",
    "<пункт 5>"
  ]
}

Текст для переробки:
---
${text}
---`

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI повернув неочікуваний формат', raw }, { status: 500 })

    let result
    try { result = JSON.parse(jsonMatch[0]) }
    catch { return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI', raw }, { status: 500 }) }

    return NextResponse.json({
      humanized_text:   result.humanized_text   ?? text,
      changes_summary:  result.changes_summary   ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
