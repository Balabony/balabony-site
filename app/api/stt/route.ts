import { NextRequest, NextResponse } from 'next/server'
import { DeepgramClient } from '@deepgram/sdk'

// Тільки для адмінів — захист від чужого витрачання кредитів.
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPGRAM_API_KEY not set on server' }, { status: 500 })
  }

  try {
    // Мова параметром (?lang=uk за замовчуванням; для баскської — eu).
    const lang = req.nextUrl.searchParams.get('lang') || 'uk'

    const audio = Buffer.from(await req.arrayBuffer())
    if (!audio.length) {
      return NextResponse.json({ error: 'empty audio' }, { status: 400 })
    }

    const client = new DeepgramClient({ apiKey })

    const response = await client.listen.v1.media.transcribeFile(audio, {
      model: 'nova-2',
      language: lang,
      smart_format: true,
      punctuate: true,
    })

    // Відповідь може бути синхронною (з results) або асинхронною — беремо results, якщо є.
    const transcript =
      'results' in response
        ? (response.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '')
        : ''

    return NextResponse.json({ transcript, lang })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
