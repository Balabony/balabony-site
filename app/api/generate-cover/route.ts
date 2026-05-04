import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 300

// Parse season/episode from seriesId like "s3-ep47" → { season: 3, episode: 47 }
function parseSeriesId(id: string): { season: number | null; episode: number | null } {
  const m = id.match(/s(\d+)[_-]ep(\d+)/i)
  if (!m) return { season: null, episode: null }
  return { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) }
}

function buildOverlaySvg(w: number, h: number, season: number | null, episode: number | null): Buffer {
  const label = season && episode ? `С${season} · СЕРІЯ ${episode}` : ''
  const gradY = Math.round(h * 0.52)
  const gradH = h - gradY
  const lineY = h - 76
  const titleY = h - 40
  const subtitleY = h - 16

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#0a0a1a" stop-opacity="0"/>
      <stop offset="45%"  stop-color="#0a0a1a" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="#0a0a1a" stop-opacity="0.97"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${gradY}" width="${w}" height="${gradH}" fill="url(#bg)"/>
  <line x1="${Math.round(w * 0.18)}" y1="${lineY}" x2="${Math.round(w * 0.82)}" y2="${lineY}" stroke="#FFD700" stroke-width="0.8" opacity="0.55"/>
  <text x="${Math.round(w / 2)}" y="${titleY}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${Math.round(w * 0.072)}"
    font-weight="bold"
    fill="#FFD700"
    letter-spacing="${Math.round(w * 0.012)}">БАЛАБОНИ</text>
  ${label ? `<text x="${Math.round(w / 2)}" y="${subtitleY}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${Math.round(w * 0.034)}"
    fill="#FFD700"
    opacity="0.75"
    letter-spacing="${Math.round(w * 0.006)}">${label}</text>` : ''}
</svg>`

  return Buffer.from(svg)
}

export async function POST(req: NextRequest) {
  try {
    const { seriesId, title, description } = await req.json()

    if (!seriesId || !title) {
      return NextResponse.json({ error: 'seriesId and title are required' }, { status: 400 })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    // Read base image and convert to base64 data URI
    const imagePath = join(process.cwd(), 'public', 'dad-panas.jpg')
    const imageBuffer = readFileSync(imagePath)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    // Build prompt with Balabony platform style
    const scene = description?.trim() || title
    const prompt = [
      `Ukrainian grandfather in embroidered shirt, ${scene},`,
      'traditional Ukrainian village background, warm artistic illustration style,',
      'portrait shot, face and upper chest only, no hands visible, no arms, close-up portrait,',
      'in Balabony platform style: dark dramatic background, golden accents, rich deep colors,',
      'Ukrainian folk illustration style, cinematic lighting, book cover art quality,',
      'professional publishing design',
    ].join(' ')

    // Call Replicate flux-kontext-pro
    const replicateRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt, input_image: base64Image } }),
      }
    )

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()

    // Poll if Prefer:wait didn't resolve
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

    // Download generated image
    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
    }
    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Composite Balabony text overlay using sharp
    const { width = 1024, height = 1024 } = await sharp(rawBuffer).metadata()
    const overlaySvg = buildOverlaySvg(width, height, ...Object.values(parseSeriesId(seriesId)) as [number | null, number | null])

    const composited = await sharp(rawBuffer)
      .composite([{ input: overlaySvg, blend: 'over' }])
      .jpeg({ quality: 92 })
      .toBuffer()

    // Upload to Supabase Storage
    const supabase = getSupabaseAdmin()
    const fileName = `${seriesId}-${Date.now()}.jpg`

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
