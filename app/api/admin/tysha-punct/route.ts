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

// «Скелет» тексту: лише літери й цифри в нижньому регістрі, без пробілів/розділових.
// Якщо скелет входу й виходу збігається — модель НЕ міняла слів, лише крапки/регістр/пробіли.
function skeleton(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:\w+)?\s*/i, '').replace(/```$/i, '').trim()
}

function countEnders(s: string): number {
  return (s.match(/[.!?…]/gu) ?? []).length
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const prompt = `Ти — коректор-пунктуатор української мови. Перед тобою фрагмент авторського серіалу «Тиша».

ЄДИНЕ ЗАВДАННЯ: розставити ПРОПУЩЕНІ крапки в кінці речень і виправити велику/малу літеру на межах речень.

ЩО МОЖНА робити:
— ставити крапку там, де закінчилося одне речення й починається інше (часта помилка — два речення злиплися без крапки: «…не слухаючи подяк Мати спершу ніяковіла» → «…не слухаючи подяк. Мати спершу ніяковіла»);
— якщо після поставленої крапки слово було з малої — зробити його з великої; якщо всередині речення стоїть зайва велика — зробити малою;
— ставити крапку в кінці абзацу, якщо її бракує.

ЩО КАТЕГОРИЧНО ЗАБОРОНЕНО:
— міняти, додавати чи прибирати БУДЬ-ЯКІ слова — жодного;
— чіпати коми, тире, лапки — їх НЕ додавай і НЕ прибирай;
— переписувати, скорочувати, покращувати стиль;
— міняти порядок слів чи речень;
— чіпати формат реплік «Імʼя: текст» (двокрапку після імені лишай як є);
— НЕ став крапку там, де це одне речення з інверсією (підмет після присудка: «нарешті приїхала Оля» — це ОДНЕ речення, крапки НЕ треба).

Якщо сумніваєшся, чи це межа речення — НЕ став крапку (краще пропустити, ніж розірвати ціле речення).

ФОРМАТ ВІДПОВІДІ: поверни ВЕСЬ текст повністю, з тими самими словами в тому самому порядку, лише з виправленими крапками й регістром. Без коментарів, без markdown, без лапок навколо.

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
          maxOutputTokens: 16384,
          temperature: 0,
          thinkingConfig: { thinkingBudget: 0 },
        },
        safetySettings: SAFETY,
      } as Parameters<typeof genAI.getGenerativeModel>[0],
      { apiVersion: 'v1beta' }
    )
    const result = await model.generateContent(prompt)
    const out = stripFences(result.response.text())

    if (!out) return NextResponse.json({ error: 'Порожня відповідь моделі' }, { status: 502 })

    // ЗАПОБІЖНИК: модель сміла міняти лише крапки/регістр/пробіли. Якщо «скелет»
    // тексту (літери+цифри) змінився — отже зачепила слова → відхиляємо.
    if (skeleton(out) !== skeleton(text)) {
      return NextResponse.json(
        { error: 'AI змінив слова, а не лише крапки — правку відхилено. Спробуй ще раз.', rejected: true },
        { status: 200 }
      )
    }

    const added = countEnders(out) - countEnders(text)
    return NextResponse.json({ text: out, added: Math.max(0, added) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
