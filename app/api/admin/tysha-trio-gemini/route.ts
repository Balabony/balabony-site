import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import sharp from 'sharp'

// =============================================================================
// ТРІЙЦЯ «ТИША» через Nano Banana (gemini-2.5-flash-image).
// Бере 3 канонні фото як вхід і зводить у ОДИН цілісний кадр, тримаючи обличчя
// краще за flux-мульти-референс. Не склейка — модель малює спільну сцену.
// =============================================================================

// SDK-тип не має responseModalities/imageConfig — розширюємо локально.
type GenConfigWithModalities = GenerationConfig & {
  responseModalities?: string[]
  imageConfig?: { aspectRatio?: string }
}

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

async function fetchInline(url: string): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Не вдалося завантажити ${url}`)
  const buf = Buffer.from(await r.arrayBuffer())
  const mimeType = r.headers.get('content-type') || 'image/jpeg'
  return { inlineData: { data: buf.toString('base64'), mimeType } }
}

// Акуратно «замазує» нашивки: м'яко розмиває горизонтальну смугу на грудях/торсі
// (де Gemini домальовує нашивки), з плавними краями. Обличчя лишається чітким —
// читається як кінематографічний фокус на лиці.
async function smudgeChest(buf: Buffer): Promise<Buffer> {
  const meta = await sharp(buf).metadata()
  const W = meta.width || 0
  const H = meta.height || 0
  if (!W || !H) return buf
  const blurred = await sharp(buf).blur(13).modulate({ brightness: 0.96 }).toBuffer()
  const topPct = 53
  const botPct = 87
  const mask = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="${topPct - 7}%" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="${topPct}%" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="${botPct}%" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="${Math.min(botPct + 9, 100)}%" stop-color="#fff" stop-opacity="0"/>` +
    `</linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  )
  const band = await sharp(blurred).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  return await sharp(buf).composite([{ input: band, left: 0, top: 0 }]).jpeg({ quality: 90 }).toBuffer()
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })

  try {
    const body = await req.json()
    const solo = body.solo === true
    const extra = (body.sceneText && String(body.sceneText).trim()) || ''

    const genAI = new GoogleGenerativeAI(apiKey)
    const generationConfig: GenConfigWithModalities = {
      responseModalities: ['Image'],
      imageConfig: { aspectRatio: '3:4' },
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image', generationConfig }, { apiVersion: 'v1beta' })

    let result
    if (solo) {
      // СОЛО — Максим-воїн, вертикаль 3:4, обличчя з еталона.
      const urlM = String(body.refMaksym || '')
      if (!urlM) return NextResponse.json({ error: 'Потрібен URL еталона Максима' }, { status: 400 })
      const imgM = await fetchInline(urlM)
      // Автоваріація фону — щоразу інша деталь оточення, навіть на тому самому пресеті.
      const bgVariations = [
        'a different ruined street with collapsed houses behind him',
        'broken military vehicles and rubble in the blurred background',
        'a shattered concrete wall close behind, distant smoke',
        'burnt trees and a destroyed fence in the background',
        'a half-collapsed building with a hole in the wall behind',
        'distant fires and thick smoke on the horizon',
        'an empty cratered road stretching behind him',
        'piles of rubble and twisted metal in the background',
        'a foggy ruined village barely visible behind',
        'scattered debris and a damaged rooftop in the distance',
        'a bombed-out school or church in the far background',
        'low grey clouds over a flattened neighbourhood',
      ]
      const bgPick = bgVariations[Math.floor(Math.random() * bgVariations.length)]
      // Автоваріація ПОЗИ/ракурсу — щоразу інша, але обличчя завжди в кадрі.
      const poseVariations = [
        'three-quarter view, head turned slightly to one side',
        'looking off to the side into the distance, profile-ish angle',
        'glancing back over his shoulder toward the camera',
        'slight low-angle shot looking up at him, heroic feel',
        'slight high-angle shot looking down at him, vulnerable feel',
        'head tilted down a little, eyes raised to the camera',
        'looking upward at the sky, chin slightly lifted',
        'turned mostly in profile, gazing forward',
        'sitting, leaning forward with elbows on knees, calm face (hands out of frame)',
        'leaning his shoulder against something, relaxed weary posture',
        'three-quarter back view, face turned to show his profile',
        'close intense face, looking directly and seriously at the camera',
        'gazing downward in thought, eyes lowered',
        'head turned sharply to the left, alert expression',
        'head turned sharply to the right, watchful expression',
        'slightly crouched, looking ahead with tension',
        'standing tall and straight, calm steady gaze to the side',
        'wind in his hair, eyes narrowed, looking into the distance',
        'half-shadowed face, one side lit, dramatic side light',
        'tired soft expression, gazing slightly past the camera',
      ]
      const posePick = poseVariations[Math.floor(Math.random() * poseVariations.length)]
      const prompt =
        `You are given one reference photo of a real young man. ` +
        `Use the reference ONLY to copy his FACIAL IDENTITY (same face, same features). ` +
        `Do NOT copy the reference's pose, framing or composition — create a COMPLETELY NEW, DIFFERENT original photograph ` +
        `with the specific pose described below. ` +
        `VERTICAL 3:4 portrait (taller than wide), photorealistic, same man's face. ` +
        `He is a Ukrainian soldier wearing plain pixelated digital camouflage military uniform. ` +
        `IMPORTANT: his chest, shoulders and whole uniform are completely BLANK and smooth — absolutely NO patches, NO name tapes, ` +
        `NO badges, NO insignia, NO chevrons, NO flags, NO embroidered text, NO labels of any kind anywhere on the uniform. Plain clean camouflage fabric only. ` +
        `His face is CLEAN — NO camouflage face paint, NO dark war-paint stripes, NO smears or marks on his face (light natural dust is ok). ` +
        (extra ? `Scene: ${extra}. ` : 'Scene: weary serious expression, overcast cold light, dust haze. ') +
        `Background detail: ${bgPick}. ` +
        `POSE (must clearly follow this, NOT a plain front headshot): ${posePick}. ` +
        `Cinematic war-drama mood, photorealistic, balanced exposure (not too dark). ` +
        `FRAMING (critical): his head and face must stay fully inside the frame and clearly visible, ` +
        `framed from roughly the chest up, no hands or fingers visible, do not crop his head or cut off his face. ` +
        `No text, no captions, no logos, no watermark. Adult man.`
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, { text: 'Reference photo (the man):' }, imgM] }],
      })
    } else {
      // ТРІЙЦЯ друзів.
      const urlM = String(body.refMaksym || '')
      const urlR = String(body.refRoman || '')
      const urlS = String(body.refSashko || '')
      if (!urlM || !urlR || !urlS) {
        return NextResponse.json({ error: 'Потрібні всі три URL еталонів' }, { status: 400 })
      }
      const [imgM, imgR, imgS] = await Promise.all([fetchInline(urlM), fetchInline(urlR), fetchInline(urlS)])
      const prompt =
        `You are given three separate reference photos of three different real young men, all friends. ` +
        `Combine all three into ONE single cohesive, warm, natural group photo — like a real candid photo of three close friends together. ` +
        `VERTICAL 3:4 portrait orientation (taller than wide), photorealistic, single unified scene with soft natural daylight (NOT a collage, no photo frames, no panels, no separate boxes). ` +
        `Keep each man's face EXACTLY as in his own reference photo — do not change their identities or features. ` +
        `COMPOSITION (follow strictly): a balanced waist-up group shot. All THREE men are roughly the SAME size, ` +
        `grouped very close together and slightly staggered to fill a TALL vertical frame, heads near each other, shoulder to shoulder. ` +
        `Man from photo 1 (thin, pale, dark messy hair) in the centre; man from photo 2 (athletic, blond) on the left; ` +
        `man from photo 3 (wavy brown hair, glasses) on the right. ` +
        `FRAMING (critical): every man's WHOLE HEAD and FULL FACE must be completely inside the frame, ` +
        `with clear empty space above all three heads and a margin on the left and right edges. ` +
        `Frame them from the SHOULDERS up only — their hands, arms and crossed arms are NOT visible and stay completely out of frame. ` +
        `Do NOT show any hands or fingers. ` +
        `Do NOT crop or cut off any head, any face, or anyone at the edges. All three faces fully visible, eyes and foreheads visible. ` +
        `Warm friendly alive mood, all three well-lit and equally prominent. ` +
        (extra ? `Scene: ${extra}. ` : 'Plain softly-blurred outdoor background. ') +
        `No text, no captions, no logos, no watermark. All three are adults.`
      result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { text: 'Reference photo 1 (friend, centre):' }, imgM,
              { text: 'Reference photo 2 (friend, side):' }, imgR,
              { text: 'Reference photo 3 (friend, side):' }, imgS,
            ],
          },
        ],
      })
    }

    const parts = result.response.candidates?.[0]?.content?.parts || []
    const imgPart = parts.find((p) => p.inlineData?.data)
    if (!imgPart?.inlineData?.data) {
      const textPart = parts.find((p) => p.text)?.text || 'модель не повернула зображення'
      return NextResponse.json({ error: `Gemini: ${textPart}` }, { status: 502 })
    }

    const rawBuf = Buffer.from(imgPart.inlineData.data, 'base64')
    const rawMime = imgPart.inlineData.mimeType || 'image/png'
    // Для воєнного solo — акуратно замазуємо нашивки на грудях.
    const outBuf = solo ? await smudgeChest(rawBuf) : rawBuf
    const mime = solo ? 'image/jpeg' : rawMime
    const ext = mime.includes('png') ? 'png' : 'jpg'

    const supabase = getSupabaseAdmin()
    const fileName = `tysha-gen/trio-gemini-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, outBuf, { contentType: mime, upsert: true })
    if (upErr) return NextResponse.json({ error: `Storage: ${upErr.message}` }, { status: 502 })

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
