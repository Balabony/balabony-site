import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Розставлення ПРОПУЩЕНИХ крапок — довга серія, даємо до 60 c.
export const maxDuration = 60

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
]

type Suggestion = { before: string; after: string; reason: string }

// «Скелет»: лише літери+цифри в нижньому регістрі. Якщо у «було» і «стало»
// він однаковий — модель НЕ міняла слів, лише крапку/регістр/пробіл.
function skeleton(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

// Гнучкий пошук фрагмента (апострофи/тире/пробіли — будь-які) — щоб «було» збігалося.
function flexRe(fragment: string): RegExp | null {
  const esc = fragment.trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/['’ʼ`´]/g, "['’ʼ`´]")
    .replace(/[—–−-]/g, '[—–−-]')
    .replace(/\s+/g, '\\s+')
  try { return new RegExp(esc) } catch { return null }
}
function existsInText(text: string, fragment: string): boolean {
  const re = flexRe(fragment)
  return !!re && re.test(text)
}

function parseSuggestions(raw: string): Suggestion[] {
  let s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return []
  s = s.slice(start, end + 1)
  let arr: unknown
  try { arr = JSON.parse(s) } catch { return [] }
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

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const prompt = `Ти — коректор-пунктуатор української мови. Перед тобою фрагмент авторського серіалу «Тиша».

ЄДИНЕ ЗАВДАННЯ: знайти місця, де ПРОПУЩЕНА крапка в кінці речення (два речення злиплися без крапки), і запропонувати правку. Часта помилка — велика літера всередині речення без крапки перед нею: «…не слухаючи подяк Мати спершу ніяковіла» → «…не слухаючи подяк. Мати спершу ніяковіла».

ЩО МОЖНА в полі "стало":
— поставити крапку на межі двох речень;
— виправити велику/малу літеру рівно на цій межі.

ЩО КАТЕГОРИЧНО ЗАБОРОНЕНО:
— міняти, додавати, прибирати БУДЬ-ЯКІ слова (жодного — навіть закінчення);
— чіпати коми, тире, лапки;
— НЕ став крапку при інверсії (підмет після присудка — одне речення: «нарешті приїхала Оля»);
— НЕ чіпай формат реплік «Імʼя: текст».
Якщо сумніваєшся — НЕ пропонуй (краще пропустити, ніж розірвати ціле речення).

ФОРМАТ — ЛИШЕ валідний JSON-масив, без markdown, без пояснень:
[
  { "було": "<точна фраза з тексту дослівно, 3-6 слів навколо межі>", "стало": "<та сама фраза з поставленою крапкою>", "причина": "пропущена крапка" }
]

КРИТИЧНО:
— "було" — ТОЧНА підрядкова копія з тексту (символ у символ), 3-6 слів, щоб місце було унікальним;
— "стало" відрізняється від "було" ЛИШЕ крапкою й регістром — ті самі слова;
— якщо пропущених крапок нема — поверни [].

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
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: SAFETY,
      } as Parameters<typeof genAI.getGenerativeModel>[0],
      { apiVersion: 'v1beta' }
    )
    const result = await model.generateContent(prompt)
    const rawOut = result.response.text()
    const parsed = parseSuggestions(rawOut)

    // ЗАПОБІЖНИК на КОЖНУ правку: «було» має бути в тексті; слова в «стало» —
    // ті самі (скелет однаковий). Інакше відкидаємо саме цю правку.
    const validated = parsed.filter(
      (s) => existsInText(text, s.before) && skeleton(s.before) === skeleton(s.after)
    )
    const dropped = parsed.length - validated.length
    return NextResponse.json({ suggestions: validated, dropped })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
