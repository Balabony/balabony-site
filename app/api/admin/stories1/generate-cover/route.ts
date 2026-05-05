import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function buildOverlaySvg(w: number, h: number): Buffer {
  const inset = Math.round(Math.min(w, h) * 0.018)
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}"
    fill="none" stroke="white" stroke-width="1.5" opacity="0.82"/>
</svg>`
  return Buffer.from(svg)
}

export async function POST(req: NextRequest) {
  try {
    const { storyId, title, genre, photoBase64 } = await req.json()

    if (!storyId || !photoBase64) {
      return NextResponse.json({ error: 'storyId and photoBase64 required' }, { status: 400 })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const seed = Math.floor(Math.random() * 2_000_000)
    const prompt = `Illustrated book cover artwork, ${genre} story titled "${title}", painterly style, cinematic lighting, all faces fully visible and not cropped, square composition, seed_${seed}`
    const negative_prompt = `text, letters, words, typography, captions, titles, subtitles, watermark, logo, signature, label, writing, font, alphabet, numbers, digits, inscription`

    const replicateRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt, negative_prompt, input_image: photoBase64, seed } }),
      }
    )

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()

    if (!prediction.output && prediction.id && prediction.status !== 'failed') {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        prediction = await poll.json()
        if (prediction.status === 'succeeded' || prediction.status === 'failed') break
      }
    }

    if (prediction.status === 'failed' || !prediction.output) {
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

    // Resize to 1024×1024 square, add white frame overlay
    const squareBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: 'cover', position: 'centre' })
      .toBuffer()

    const overlaySvg = buildOverlaySvg(1024, 1024)
    const composited = await sharp(squareBuffer)
      .composite([{ input: overlaySvg, blend: 'over' }])
      .jpeg({ quality: 92 })
      .toBuffer()

    const supabase = getSupabaseAdmin()
    const fileName = `story-${storyId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, composited, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl, fileName })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
