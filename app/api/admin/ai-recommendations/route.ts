import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { summary } = await req.json()

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `Ти — стратегічний аналітик платформи Balabony — українського сайту коротких художніх історій для всієї родини.

Ось зведені аналітичні дані платформи:
${JSON.stringify(summary, null, 2)}

Проаналізуй ці дані та надай конкретні рекомендації УКРАЇНСЬКОЮ мовою за такими напрямками:

1. **Розвиток платформи** — що покращити у функціоналі та UX на основі поведінки користувачів
2. **Контент-стратегія** — які жанри та формати розвивати, виходячи з уподобань аудиторії
3. **Залучення аудиторії** — найефективніші канали та таргетинг виходячи з джерел трафіку
4. **Монетизація** — як оптимізувати тарифи та ціноутворення відповідно до готовності платити
5. **Утримання** — що заважає читачам та як підвищити залученість

Відповідай структуровано, конкретно, з посиланням на реальні цифри з даних. Кожен пункт — мінімум 2-3 дієві рекомендації.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ recommendations: text })
}
