import { NextRequest } from 'next/server'
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'
import { MIN_WORDS, MAX_WORDS } from '@/lib/episode-metrics'

// Той самий приклад, що й у generate: thinking-модель без явного
// thinkingBudget=0 думає до першого токена → стрім падає по таймауту.
type GenConfigWithThinking = GenerationConfig & {
  thinkingConfig?: { thinkingBudget?: number }
}

export const runtime = 'edge'

const EXPAND_SYSTEM = `Ти — редактор серіалу аудіоісторій «Балабони». Тобі дають ГОТОВУ серію, яка вийшла ЗАКОРОТКОЮ. Твоє завдання — РОЗШИРИТИ її до потрібного обсягу, нічого не псуючи.

ЗАЛІЗНІ ПРАВИЛА:
• НЕ переписуй і не скорочуй наявний текст. Зберігай плавний вхід, гачок, кульмінацію (момент тиші/напруги) і фінальний висновок ПРАКТИЧНО ДОСЛІВНО — на своїх місцях, у тому ж порядку.
• Додавай обсяг ЛИШЕ всередину основної частини (між гачком і кульмінацією): 3–6 нових живих діалогових реплік і за потреби одну коротку сцену-звʼязку. Нові репліки — у голосах тих самих персонажів, з їхніми фірмовими слівцями, без нових сюжетних ліній і без натяків на продовження.
• Поглиблюй наявні комічні ситуації, а не вигадуй нові конфлікти. Фінал серії лишається тим самим і так само повністю завершеним.

ФОРМАТ (незмінний):
• Кожна репліка — окремим абзацом, починається з імені персонажа й двокрапки: «Панас: …», «Ганя: …». Авторський наратив — окремими абзацами без імені.
• Між кожним абзацом — порожній рядок.
• ЖОДНОГО Markdown (зірочки, підкреслення, решітки, лапки-виділення). ЖОДНИХ сценічних ремарок у дужках — емоції передавай словами репліки.

ОБСЯГ — СУВОРО ${MIN_WORDS}–${MAX_WORDS} слів у фінальному тексті. Цілься близько 1450. Не менше ${MIN_WORDS}. Не більше ${MAX_WORDS}.

ВИВІД: поверни ПОВНУ серію цілком (старий текст + вплетені нові репліки), готову до озвучення. Починай одразу з тексту серії, без жодних вступних слів, заголовків чи пояснень.`

interface ExpandBody { text?: string }

function stripInline(s: string): string {
  return s.replace(/[*`]/g, '')
}

function countWords(s: string): number {
  const m = s.trim().match(/\S+/g)
  return m ? m.length : 0
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response('GEMINI_API_KEY не налаштовано', { status: 500 })
  }

  const body = await request.json() as ExpandBody
  const text = (body.text ?? '').trim()
  if (!text) {
    return new Response('Порожній текст серії', { status: 400 })
  }

  const have = countWords(text)
  const userMessage =
    `Ось серія, яка вийшла закороткою — приблизно ${have} слів замість потрібних ${MIN_WORDS}–${MAX_WORDS}. ` +
    `Розший її до ${MIN_WORDS}–${MAX_WORDS} слів за правилами вище: додай нові діалогові репліки всередину основної частини, ` +
    `не чіпаючи вхід, кульмінацію і фінал. Поверни ПОВНУ серію цілком.\n\n--- СЕРІЯ ---\n${text}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    const generationConfig: GenConfigWithThinking = {
      maxOutputTokens: 10240,
      temperature: 1.0,
      thinkingConfig: { thinkingBudget: 0 },
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig,
    }, { apiVersion: 'v1beta' })

    const result = await model.generateContentStream({
      contents: [
        { role: 'user', parts: [{ text: EXPAND_SYSTEM }] },
        { role: 'user', parts: [{ text: userMessage }] },
      ],
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const t = chunk.text()
            if (t) controller.enqueue(encoder.encode(stripInline(t)))
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return new Response(msg, { status: 500 })
  }
}
