import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
// Список жанрів — один на весь проєкт, див. lib/genres.ts
import { GENRE_OPTIONS as GENRES } from '@/lib/genres'


const CATEGORIES = ['З життя', 'Містика', 'Любов', 'Воєнні', 'Історичні', 'Родинні', 'Гумор', 'Детектив', 'Психологічні', 'Дитячі']

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { authorName, title, genre, text } = await req.json()

    if (!title || !genre || !text) {
      return NextResponse.json({ error: 'title, genre, text are required' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Ти — головний редактор літературного сайту Balabony (українські художні оповідання для родини). Ретельно проаналізуй текст нижче і поверни результат ТІЛЬКИ у форматі JSON.

Автор: ${authorName || 'не вказано'}
Назва: ${title}
Жанр: ${genre}
Текст:
---
${text}
---

Окрім аналізу, ВИЗНАЧ найдоречніший жанр і категорію для цього тексту, обираючи СТРОГО зі списків (поверни рівно одне значення з кожного списку, дослівно):
Жанри: ${GENRES.join(', ')}
Категорії: ${CATEGORIES.join(', ')}

Також ВИЗНАЧ, чи історія призначена ТІЛЬКИ для дорослих (18+): графічне насильство, відверті сексуальні сцени, груба ненормативна лексика, важкі дорослі теми. Це дитячо-родинний сайт, тому при будь-якому сумніві позначай як 18+ (краще зайвий раз позначити, ніж пропустити дорослий зміст).

Поверни ТІЛЬКИ валідний JSON без markdown, без коментарів, без зайвого тексту:
{
  "plagiarism": {
    "score": <число 0-100, де 100 = повністю оригінальний>,
    "verdict": "<унікальний | частково схожий | плагіат>",
    "details": "<детальний коментар про оригінальність тексту, порівняння з відомими творами>"
  },
  "ai_detection": {
    "score": <число 0-100, де 100 = точно написано людиною>,
    "verdict": "<написано людиною | можливо ШІ | написано ШІ>",
    "details": "<коментар про ознаки живого чи машинного письма>"
  },
  "genre_match": {
    "score": <число 0-100, де 100 = ідеально відповідає жанру>,
    "verdict": "<відповідає | частково відповідає | не відповідає>",
    "details": "<коментар про відповідність жанру '${genre}', стиль, атмосферу>"
  },
  "grammar": {
    "score": <число 0-100, де 100 = без помилок>,
    "verdict": "<без помилок | незначні помилки | багато помилок>",
    "details": "<загальна характеристика мовної якості>",
    "errors": ["<конкретна помилка або опечатка 1>", "<помилка 2>"]
  },
  "suggested": {
    "genre": "<рівно один жанр зі списку жанрів вище>",
    "category": "<рівно одна категорія зі списку категорій вище>",
    "isAdult": <true якщо контент 18+, інакше false>
  },
  "overall": {
    "recommendation": "<Рекомендовано | Потребує доопрацювання | Відхилити>",
    "summary": "<загальний висновок 2-3 речення>",
    "suggestions": ["<конкретна порада 1>", "<порада 2>", "<порада 3>"]
  }
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON even if Claude wrapped it in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI повернув неочікуваний формат', raw }, { status: 500 })
    }

    let report
    try {
      report = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Не вдалося розпарсити відповідь AI', raw }, { status: 500 })
    }

    // Лишаємо лише валідні підказки зі списків — інакше select їх не підставить
    if (report && typeof report === 'object') {
      const g = report.suggested?.genre
      const c = report.suggested?.category
      report.suggested = {
        genre:    GENRES.includes(g) ? g : null,
        category: CATEGORIES.includes(c) ? c : null,
        isAdult:  report.suggested?.isAdult === true,
      }
    }

    return NextResponse.json({ report })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
