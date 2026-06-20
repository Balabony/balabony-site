import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Генерує обкладинку КАЗКИ з нуля (text-to-image), бо фото немає.
// Крок 1: Claude описує одну візуальну сцену з тексту казки.
// Крок 2: Flux малює м'яку акварельну книжкову ілюстрацію.
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

    // 1) Claude → короткий візуальний опис сцени (англійською, для Flux)
    let scene = 'a gentle magical scene from a Ukrainian fairy tale'
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Прочитай українську казку і опиши ОДНУ візуальну сцену для обкладинки. Відповідь — англійською, одне речення, лише видимі об'єкти, персонажі, природа, настрій. Без тексту чи написів на зображенні. Без людей у небезпеці. Назва: "${title}". Текст:\n${String(text).slice(0, 3000)}`,
        }],
      })
      const out = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      if (out) scene = out
    } catch { /* лишаємо дефолтну сцену */ }

    // 2) Flux text-to-image — без вхідного фото
    const seed = Math.floor(Math.random() * 2_000_000)
    const prompt = `Soft watercolor children's storybook illustration. ${scene}. Hand-painted, warm gentle dreamy colors, whimsical, cozy, picture-book art, no text, no words, no letters, seed_${seed}`
    const negative_prompt = `text, letters, words, captions, logos, watermarks, signatures, typography, written words, cyrillic letters, latin letters, deformed hands, extra fingers, mutated hands, bad anatomy, extra limbs, photorealistic, photograph, scary, horror, dark, creepy, violent, gore, blood, ugly, distorted faces`

    const replicateRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt, negative_prompt, guidance_scale: 3.5, num_inference_steps: 28, width: 1024, height: 1024, seed } }),
      }
    )

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()
    for (let i = 0; i < 40 && (prediction.status === 'starting' || prediction.status === 'processing'); i++) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      prediction = await poll.json()
    }

    if (prediction.status !== 'succeeded') {
      return NextResponse.json({ error: 'Generation failed or timed out' }, { status: 502 })
    }

    const generatedUrl: string = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output

    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
    }
    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

    const finalBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 })
      .toBuffer()

    const supabase = getSupabaseAdmin()
    const fileName = `fairytale-${storyId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    // Одразу прописуємо обкладинку в історію — щоб не треба було повторно «Схвалити».
    await supabase.from('content').update({ cover_url: publicUrl }).eq('id', storyId)

    return NextResponse.json({ url: publicUrl, fileName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
