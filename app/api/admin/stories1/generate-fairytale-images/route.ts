import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const COUNT = 4

const NEGATIVE = `text, letters, words, captions, logos, watermarks, signatures, typography, written words, cyrillic letters, latin letters, deformed hands, extra fingers, mutated hands, bad anatomy, extra limbs, photorealistic, photograph, scary, horror, dark, creepy, violent, gore, blood, ugly, distorted faces`

// Малює одну сцену через Flux і завантажує у сховище. Повертає public URL або null.
async function paintScene(token: string, scene: string, storyId: string, idx: number): Promise<string | null> {
  try {
    const seed = Math.floor(Math.random() * 2_000_000)
    const prompt = `Soft watercolor children's storybook illustration. ${scene}. Hand-painted, warm gentle dreamy colors, whimsical, cozy, picture-book art, consistent character design, no text, no words, no letters, seed_${seed}`

    const res = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
        body: JSON.stringify({ input: { prompt, negative_prompt: NEGATIVE, guidance_scale: 3.5, num_inference_steps: 28, width: 1024, height: 1024, seed } }),
      }
    )
    if (!res.ok) return null

    let prediction = await res.json()
    for (let i = 0; i < 40 && (prediction.status === 'starting' || prediction.status === 'processing'); i++) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      prediction = await poll.json()
    }
    if (prediction.status !== 'succeeded') return null

    const genUrl: string = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    const imgRes = await fetch(genUrl)
    if (!imgRes.ok) return null
    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

    const finalBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 })
      .toBuffer()

    const supabase = getSupabaseAdmin()
    const fileName = `fairytale-${storyId}-${idx}-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, { contentType: 'image/jpeg', upsert: true })
    if (error) return null

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    return publicUrl
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { storyId, title, text } = await req.json()
    if (!storyId || !text) {
      return NextResponse.json({ error: 'storyId and text required' }, { status: 400 })
    }
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    // 1) Claude → 4 сцени в хронологічному порядку (JSON-масив)
    let scenes: string[] = []
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Прочитай українську казку. Виокрем ${COUNT} ключові візуальні моменти в ХРОНОЛОГІЧНОМУ порядку (початок, розвиток, кульмінація, завершення). Для кожного — короткий опис АНГЛІЙСЬКОЮ, одне речення, лише видиме (персонажі, природа, дія, настрій), той самий головний герой у кожній сцені. Без тексту на зображенні, без сцен небезпеки чи насильства. Поверни ЛИШЕ JSON-масив із ${COUNT} рядків, без пояснень, без markdown. Назва: "${title}". Текст:\n${String(text).slice(0, 4000)}`,
        }],
      })
      const out = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      const cleaned = out.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) scenes = parsed.filter(s => typeof s === 'string').slice(0, COUNT)
    } catch { /* нижче — запасний варіант */ }

    while (scenes.length < COUNT) {
      scenes.push(`a gentle magical scene from the Ukrainian fairy tale "${title}", part ${scenes.length + 1}`)
    }

    // 2) Flux ×N паралельно
    const results = await Promise.all(scenes.map((s, i) => paintScene(token, s, storyId, i)))
    const images = results.filter((u): u is string => !!u)

    if (images.length === 0) {
      return NextResponse.json({ error: 'All generations failed' }, { status: 502 })
    }

    return NextResponse.json({ images })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
