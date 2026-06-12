import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

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
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Ти — досвідчений літературний редактор. Твоє завдання — РЕТЕЛЬНО ОЛЮДНИТИ текст: прибрати штампи, кліше, канцелярит і «воду», зробити мову свіжою, живою і природною — так, ніби писала талановита жива людина.

ВАЖЛИВО: НЕ намагайся технічно «обдурити» ШІ-детектор. Ціль — справжня жива якість тексту, а не маніпуляція метриками.

ГОЛОВНЕ — БЕЗЖАЛІСНО ПРИБИРАЙ:
- Штампи й типові звороти: «не просто X, а Y», «у глибині душі», «серце завмерло», «час ніби зупинився», «як грім серед ясного неба», «кожен у селі знав» тощо
- Канцелярит і книжні звороти: «здійснювати», «являє собою», «в результаті чого», «незважаючи на той факт» — заміняй на живі прості слова
- «Воду» й порожні підсилювачі: зайві «дуже», «справді», «насправді», «буквально», непотрібні прислівники
- Передбачувані, занадто «правильні» фінали речень і абзаців
- Повтори тих самих образів і слів-паразитів автора

ЩО РОБИТИ НАТОМІСТЬ:
1. Варіюй довжину речень — чергуй короткі (3–8 слів) з довшими, ламай монотонний ритм
2. Заміняй абстракцію конкретною деталлю, образом, дією
3. Додавай живі розмовні звороти там, де природно (особливо в репліках персонажів)
4. Загострюй гумор і характерні голоси персонажів — кожен має звучати по-своєму
5. Лиши легку неідеальність живої мови — без надполірованості${genre ? `\n6. Зберігай стиль жанру: ${genre}` : ''}

ЗБЕРЕГТИ ПОВНІСТЮ (НЕ чіпати):
- Сюжет, усіх персонажів, усі події — нічого не додавати і не прибирати
- Формат діалогів «Ім'я: репліка» (Панас:, Ганя:, Микола: …) — НЕ прибирай імена перед репліками
- Порожні рядки (відступи) між абзацами
- ЖОДНОГО Markdown: без зірочок, підкреслень, решіток — чистий текст для озвучення

ФОРМАТ ВІДПОВІДІ — рівно дві секції з маркерами, нічого більше:

===TEXT===
<ПОВНИЙ переписаний текст: абзаци та розриви рядків як у звичайному тексті — БЕЗ екранування, БЕЗ JSON>
===ENDTEXT===
===CHANGES===
[
  "<що саме прибрано/змінено і чому — конкретно>",
  "<пункт 2>",
  "<пункт 3>",
  "<пункт 4>",
  "<пункт 5>"
]
===ENDCHANGES===

Правила:
- У секції TEXT — звичайний текст (не JSON): абзаци з реальними переносами рядків
- CHANGES — валідний JSON-масив коротких рядків`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: `${prompt}\n\nТекст для переробки:\n---\n${text}\n---` }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    const humanizedText = between(raw, '===TEXT===', '===ENDTEXT===') ?? raw.trim() ?? text

    let summary: unknown[] = []
    const changesRaw = between(raw, '===CHANGES===', '===ENDCHANGES===')
    if (changesRaw) {
      const arr = changesRaw.match(/\[[\s\S]*\]/)
      if (arr) {
        try { summary = JSON.parse(arr[0]) } catch { summary = [] }
      }
    }

    return NextResponse.json({
      humanized_text:  humanizedText || text,
      changes_summary: summary,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
