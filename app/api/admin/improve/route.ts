import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Олюднення довгої серії (~1800 слів) у Gemini триває довше за дефолтний ліміт.
export const maxDuration = 60

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]


type Suggestion = { before: string; after: string; reason: string }

// Гнучкий пошук фрагмента: апострофи/тире/пробіли — будь-які варіанти.
// Потрібно, щоб «було» від Gemini збігалося з реальним текстом, навіть якщо
// модель злегка змінила апостроф чи кількість пробілів.
function flexRe(fragment: string): RegExp | null {
  const esc = fragment
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // екрануємо regex-метасимволи
    .replace(/['’ʼ`´]/g, "['’ʼ`´]")          // будь-який апостроф
    .replace(/[—–−-]/g, '[—–−-]')             // будь-яке тире/дефіс
    .replace(/\s+/g, '\\s+')                  // гнучкі пробіли
  try {
    return new RegExp(esc)
  } catch {
    return null
  }
}

function existsInText(text: string, fragment: string): boolean {
  const re = flexRe(fragment)
  return !!re && re.test(text)
}

// Витягаємо JSON-масив навіть якщо модель обгорнула його в ```json … ``` або
// додала вступні слова.
function parseSuggestions(raw: string): Suggestion[] {
  let s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return []
  s = s.slice(start, end + 1)
  let arr: unknown
  try {
    arr = JSON.parse(s)
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  const out: Suggestion[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const before = typeof o.було === 'string' ? o.було : typeof o.before === 'string' ? o.before : ''
    const after = typeof o.стало === 'string' ? o.стало : typeof o.after === 'string' ? o.after : ''
    const reason = typeof o.причина === 'string' ? o.причина : typeof o.reason === 'string' ? o.reason : ''
    if (before.trim() && after.trim() && before.trim() !== after.trim()) {
      out.push({ before: before.trim(), after: after.trim(), reason: reason.trim() })
    }
  }
  return out
}

// Фрагмент має бути коротким: одне речення/частина речення, не цілий абзац.
// Інакше «олюднення» вироджується в переписування всього тексту.
function isGranular(before: string): boolean {
  const f = before.trim()
  if (f.length > 240) return false
  // більше одного завершеного речення всередині — забагато
  const enders = (f.match(/[.!?…]\s+\p{Lu}/gu) ?? []).length
  return enders <= 1
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text, recommendations } = await request.json() as { text?: string; recommendations?: string[] }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const recList = (recommendations ?? []).map((r, i) => `${i + 1}. ${r}`).join('\n')

  const prompt = `Ти — редактор художньої прози українською. Перед тобою фрагмент авторського серіалу «Тиша». Текст уже якісний; твоя задача — знайти ТОЧКОВІ місця, де формулювання можна зробити природнішим, живішим або чистішим, НЕ переписуючи текст і НЕ змінюючи зміст.

ПРАВИЛА КАНОНУ «Тиші» (за ними оцінюй):
${recList}

ЩО ШУКАТИ:
— важкі/канцелярські звороти, які можна сказати простіше;
— невиправдані повтори слів поряд;
— зайві слова, що розжовують очевидне й убивають інтригу;
— неприродність у діалозі (так люди не кажуть);
— збій ритму (надто довге накручене речення можна розбити).

ЧОГО НЕ РОБИТИ:
— не вигадуй нових подій, персонажів, деталей чи магії;
— не зачіпай те, що й так добре звучить (краще менше пропозицій, ніж штучні);
— не міняй формат реплік «Імʼя: текст»;
— не пропонуй заміни заради заміни. Якщо текст чистий — поверни порожній масив [].

ФОРМАТ ВІДПОВІДІ — ЛИШЕ валідний JSON-масив, без пояснень, без markdown:
[
  { "було": "<точна фраза, СКОПІЙОВАНА з тексту дослівно, разом з розділовими знаками>", "стало": "<покращений варіант цієї фрази>", "причина": "<коротко, 3–6 слів, чому краще>" }
]

КРИТИЧНО ВАЖЛИВО:
— поле "було" має бути ТОЧНОЮ підрядковою копією з тексту (символ у символ), інакше пропозицію відкинуть;
— один "було" = МАКСИМУМ одне речення (краще частина речення). НІКОЛИ не бери абзац чи кілька речень разом;
— якщо в тексті є кілька місць для покращення — дай КІЛЬКА окремих дрібних пропозицій, а не одну велику;
— якщо хочеш змінити два місця в одному реченні — зроби дві окремі пропозиції з короткими "було".

Текст:
"""
${text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
          // Вимикаємо внутрішнє "думання" — інакше довга серія висить.
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: SAFETY,
      } as Parameters<typeof genAI.getGenerativeModel>[0],
      { apiVersion: 'v1beta' }
    )
    const result = await model.generateContent(prompt)
    const rawOut = result.response.text()
    const parsed = parseSuggestions(rawOut)

    // Валідація: лишаємо тільки ті пропозиції, чиє «було» реально є в тексті.
    // Це відсіює галюцинації (фрази, яких у тексті нема).
    const validated = parsed.filter((s) => isGranular(s.before) && existsInText(text, s.before))
    const dropped = parsed.length - validated.length

    return NextResponse.json({ suggestions: validated, dropped })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
