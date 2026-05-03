import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const prompt = `Підготуй текст для озвучки (TTS). Правила:

ВИДАЛИ:
- Будь-які ремарки в круглих дужках: (сміється), (зітхає), (здивовано), (тихо), (голосно), (пауза), (схвильовано) тощо
- Будь-які позначки в квадратних дужках: [пауза], [тихо], [здивовано] тощо
- Stage directions в зірочках: *зітхає*, *сміється* тощо
- Будь-які вказівки для дикторів або режисерів
- Порожні рядки що залишились після видалення ремарок (більше одного порожнього рядка підряд заміни на один)

ЗАЛИШ БЕЗ ЗМІН:
- Весь діалог персонажів слово в слово
- Всю нарацію та авторський текст слово в слово
- Розбивку на абзаци
- Лапки та тире в діалогах

Поверни ТІЛЬКИ очищений текст без жодних коментарів, пояснень або вступних слів.

ТЕКСТ:
"""
${text}
"""`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }, { apiVersion: 'v1beta' })
    const result = await model.generateContent(prompt)
    const cleanedText = result.response.text().trim()
    return NextResponse.json({ cleanedText })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
