import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Олюднення довгої серії (~1800 слів) у Gemini триває довше за дефолтний ліміт.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  const { text, recommendations } = await request.json() as { text?: string; recommendations?: string[] }
  if (!text?.trim()) return NextResponse.json({ error: 'Текст відсутній' }, { status: 400 })

  const recList = (recommendations ?? []).map((r, i) => `${i + 1}. ${r}`).join('\n')

  const prompt = `Покращ наступний текст українською мовою згідно з наданими рекомендаціями. Збережи оригінальний стиль, персонажів, сюжет і обсяг. Поверни ТІЛЬКИ покращений текст без пояснень, коментарів та вступних слів.

Рекомендації для покращення:
${recList}

Оригінальний текст:
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
          temperature: 0.7,
          // Вимикаємо внутрішнє "думання" — інакше переписування довгої серії висить.
          thinkingConfig: { thinkingBudget: 0 },
        },
      } as Parameters<typeof genAI.getGenerativeModel>[0],
      { apiVersion: 'v1beta' }
    )
    const result = await model.generateContent(prompt)
    const improvedText = result.response.text().trim()
    return NextResponse.json({ improvedText })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
