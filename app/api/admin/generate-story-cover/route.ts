// 08.11.2026 (Богдан: «роби далі» — обкладинки для опублікованих творів без обкладинки): обкладинка для звичайної
// історії автора (не казки й не серіалу «Балабони»). Claude Haiku читає текст і описує ОДНУ сцену з настроєм твору,
// Flux-dev малює живописну книжкову обкладинку 3:4 без тексту. Обкладинка одразу прописується в content.cover_url.
// Доступ — лише адмін (proxy.ts закриває /api/admin). Ціна ≈ $0.03 за картинку.
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { pickPublishedText } from '@/lib/published-text'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { storyId, onlyIfEmpty = true } = await req.json() as { storyId?: string; onlyIfEmpty?: boolean }
    if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 })
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })

    const supabase = getSupabaseAdmin()
    const { data: row, error } = await supabase
      .from('content')
      .select('id, title, text, corrected_text, humanized_text, published_version, cover_url')
      .eq('id', storyId).single()
    if (error || !row) return NextResponse.json({ error: 'story not found' }, { status: 404 })
    if (onlyIfEmpty && row.cover_url) return NextResponse.json({ skipped: true, url: row.cover_url })
    const text = pickPublishedText(row as { text: string }).slice(0, 9000)

    let scene = 'a quiet emotional moment in a Ukrainian village at golden hour'
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 220,
        messages: [{
          role: 'user',
          content: `Прочитай український твір «${row.title}» і опиши ОДНУ візуальну сцену для книжкової обкладинки — найвиразнішу й найхарактернішу для сюжету й настрою. Відповідь — англійською, 2–3 речення, лише опис зображення: хто (вік, зовнішність, одяг), де (обстановка, пора року, час доби), що відбувається, настрій і світло. Без імен, без тексту на зображенні. Якщо твір про війну чи горе — без крові, зброї в кадрі й жорстокості: передай почуття через людей, світло, предмети. Без відвертих сцен.\n\nТвір:\n${text}`,
        }],
      })
      const out = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      if (out) scene = out
    } catch { /* лишаємо загальну сцену */ }

    const seed = Math.floor(Math.random() * 2_000_000)
    const prompt = `Painterly literary book cover illustration, vertical composition. ${scene}. Rich warm oil-painting textures, cinematic soft light, emotional, tasteful, contemporary Ukrainian setting, high detail, no text, no words, no letters.`
    const negative_prompt = 'text, letters, words, captions, logos, watermarks, signatures, typography, cyrillic letters, latin letters, blood, gore, weapons, nudity, deformed hands, extra fingers, mutated hands, bad anatomy, collage, frames, panels'

    const rep = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify({ input: { prompt, negative_prompt, guidance_scale: 3.5, num_inference_steps: 28, aspect_ratio: '3:4', seed } }),
    })
    if (!rep.ok) return NextResponse.json({ error: `Replicate error: ${(await rep.text()).slice(0, 300)}` }, { status: 502 })
    let p = await rep.json()
    for (let i = 0; i < 60 && (p.status === 'starting' || p.status === 'processing'); i++) {
      await new Promise((r) => setTimeout(r, 2000))
      p = await (await fetch(`https://api.replicate.com/v1/predictions/${p.id}`, { headers: { Authorization: `Bearer ${token}` } })).json()
    }
    if (p.status !== 'succeeded') return NextResponse.json({ error: 'Generation failed or timed out' }, { status: 502 })
    const src: string = Array.isArray(p.output) ? p.output[0] : p.output
    const img = await fetch(src)
    if (!img.ok) return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
    const buf = await sharp(Buffer.from(await img.arrayBuffer())).resize(900, 1200, { fit: 'cover', position: 'attention' }).jpeg({ quality: 88 }).toBuffer()

    const fileName = `story-${storyId}-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('covers').upload(fileName, buf, { contentType: 'image/jpeg', upsert: true })
    if (upErr) return NextResponse.json({ error: `Storage error: ${upErr.message}` }, { status: 500 })
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    await supabase.from('content').update({ cover_url: publicUrl }).eq('id', storyId)
    return NextResponse.json({ url: publicUrl, scene })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
