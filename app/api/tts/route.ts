import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Тільки для адмінів — захист від чужого витрачання кредитів TTS.
// (Той самий патерн, що в /api/stt.)
function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// POST /api/tts
// Тіло: { id: string, text: string, voiceId?: string }
// 1) синтезує українське аудіо через ElevenLabs,
// 2) зберігає mp3 у Supabase Storage (бакет 'audio'),
// 3) пише URL у content.audio_url і ставить content.audio_status = 'ready'.
//
// ВИПРАВЛЕНО проти схеми content (міграція 20260506_001):
//   • колонка URL = audio_url (НЕ 'audio');
//   • audio_status — ENUM ('pending' | 'processing' | 'ready' | 'failed'),
//     тому під час генерації статус = 'processing' (НЕ 'generating').
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not set on server' }, { status: 500 })
  }

  try {
    const { id, text, voiceId } = await req.json()
    if (!id || !text || !String(text).trim()) {
      return NextResponse.json({ error: 'id and non-empty text required' }, { status: 400 })
    }

    // Голос за замовчуванням — український; конкретний voiceId задаємо в env
    // або передаємо в тілі запиту. Поки використовуємо multilingual-модель.
    const voice = voiceId || process.env.ELEVENLABS_VOICE_UK || 'EXAVITQu4vr4xnSDxMaL'

    const supabase = getSupabaseAdmin()

    // Позначаємо, що генерація триває (щоб у UI показати «генерується»).
    await supabase.from('content').update({ audio_status: 'processing' }).eq('id', id)

    // 1) Синтез мовлення через ElevenLabs.
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: String(text),
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!ttsRes.ok) {
      const errText = await ttsRes.text()
      await supabase.from('content').update({ audio_status: 'failed' }).eq('id', id)
      return NextResponse.json({ error: `TTS failed: ${errText}` }, { status: 502 })
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer())

    // 2) Завантаження mp3 у Supabase Storage (бакет 'audio' має існувати, public read).
    const path = `${id}.mp3`
    const { error: upErr } = await supabase.storage
      .from('audio')
      .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: true })

    if (upErr) {
      await supabase.from('content').update({ audio_status: 'failed' }).eq('id', id)
      return NextResponse.json({ error: `Storage upload failed: ${upErr.message}` }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from('audio').getPublicUrl(path)
    const audioUrl = pub.publicUrl

    // 3) Записуємо URL і статус у content.
    const { error: updErr } = await supabase
      .from('content')
      .update({ audio_url: audioUrl, audio_status: 'ready' })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: `DB update failed: ${updErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id, audioUrl, audio_status: 'ready' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
