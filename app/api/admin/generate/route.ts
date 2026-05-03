import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `Ти — письменник аудіоісторій для літніх людей і дітей. Пиши в українському стилі, схожому на народні казки. Персонаж Дід Панас — мудрий дідусь з гумором. Зберігай стиль попередніх серій. Текст має бути живим, теплим, з характерними діалогами. Уникай кліше. Обсяг — 800–1200 слів.`

interface GenerateBody {
  title?: string
  season?: string
  episode?: string
  character?: string
  genre?: string
  summary?: string
  styleContext?: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const body = await request.json() as GenerateBody
  const { title, season, episode, character, genre, summary, styleContext } = body

  const parts: string[] = ['Напиши нову серію аудіоісторії з такими параметрами:']
  if (title)        parts.push(`Назва: ${title}`)
  if (season)       parts.push(`Сезон: ${season}`)
  if (episode)      parts.push(`Серія: ${episode}`)
  if (character)    parts.push(`Персонаж: ${character}`)
  if (genre)        parts.push(`Жанр: ${genre}`)
  if (summary)      parts.push(`\nКороткий опис / тизер:\n${summary}`)
  if (styleContext) parts.push(`\nСтиль та контекст (уривки попередніх серій або опис стилю):\n${styleContext}`)
  parts.push('\nНапиши повний текст серії. Починай одразу з тексту, без вступних слів.')

  const userMessage = parts.join('\n')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    }, { apiVersion: 'v1beta' })

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: userMessage }] },
      ],
    })
    const text = result.response.text()

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
