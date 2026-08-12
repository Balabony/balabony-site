import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// ТЕСТ ПАРНОЇ ОБКЛАДИНКИ (Панас + Ганя в одному кадрі)
// -----------------------------------------------------------------------------
// flux-kontext-pro приймає рівно ОДНЕ input_image, тож двох канонічних облич
// штатно не подати. Обхід: склеюємо дві наявні одиночні пози в один горизонт-
// альний колаж (ліворуч Панас, праворуч Ганя) і подаємо колаж як референс,
// а в промпті просимо звести обох в одну сцену.
//
// Це РОЗВІДКА, а не робочий механізм: мета — побачити, чи Kontext узагалі
// тримає два різні обличчя з одного входу, чи змішує їх в одне. Якщо тримає —
// відібрані кадри лягають у public/pair-poses/ і вже вони стають еталонами
// для звичайної генерації (як зараз ganya-poses / panas-poses).
// =============================================================================

const PANEL_W = 768
const PANEL_H = 1152 // 2:3, як в одиночних позах

// Обидва обличчя описуємо явно: Kontext інакше «усереднює» вік і вбирає обох
// на свій розсуд. Ті самі «замки», що в generate-ganya-pose і generate-cover.
const PAIR_LOOK =
  'the man from the LEFT half of the reference image and the woman from the RIGHT half, ' +
  'two DIFFERENT people, an elderly Ukrainian village couple standing together in one scene, ' +
  'the man: exactly 63 years old, grey moustache, white embroidered shirt, dark sleeveless ' +
  'waistcoat, woven belt, plain dark work trousers; ' +
  'the woman: exactly 68 years old, NOT frail, hair mostly dark brown with grey strands ' +
  'under a floral headscarf, white embroidered blouse, long dark skirt to mid-calf, apron ' +
  '(NOT trousers); ' +
  'keep both faces exactly as in the reference image, do not merge or swap their faces, ' +
  'do not duplicate the same person twice'

const PAIR_TECH =
  'both people fully visible head to feet, standing at natural height side by side, ' +
  'camera at eye level, realistic adult proportions, well-formed hands with exactly five ' +
  'fingers, entire bodies within frame, feet visible, never cropped at the knees, ' +
  'photorealistic, cinematic warm soft lighting, sharp focus, no text, no watermark'

const NEGATIVE_PROMPT = [
  'text', 'letters', 'words', 'captions', 'logos', 'watermarks', 'signatures',
  'split screen', 'diptych', 'collage', 'side-by-side panels', 'picture frame',
  'vertical dividing line', 'two panels', 'photo border',
  'twins', 'identical faces', 'same person twice', 'merged faces',
  'three people', 'crowd', 'extra person',
  'deformed hands', 'extra fingers', 'cropped feet',
].join(', ')

function listPoses(folder: string, prefix: string): string[] {
  const dir = join(process.cwd(), 'public', folder)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.jpg') && f.startsWith(prefix))
    .sort()
}

// GET → які пози доступні для склейки
export async function GET() {
  return NextResponse.json({
    panas: listPoses('panas-poses', 'panas-'),
    ganya: listPoses('ganya-poses', 'ganya-'),
  })
}

async function buildCollage(panasFile: string, ganyaFile: string): Promise<Buffer> {
  const pPath = join(process.cwd(), 'public', 'panas-poses', panasFile)
  const gPath = join(process.cwd(), 'public', 'ganya-poses', ganyaFile)
  if (!existsSync(pPath)) throw new Error(`немає файлу ${panasFile}`)
  if (!existsSync(gPath)) throw new Error(`немає файлу ${ganyaFile}`)

  const left = await sharp(readFileSync(pPath))
    .resize(PANEL_W, PANEL_H, { fit: 'cover', position: 'top' })
    .toBuffer()
  const right = await sharp(readFileSync(gPath))
    .resize(PANEL_W, PANEL_H, { fit: 'cover', position: 'top' })
    .toBuffer()

  return sharp({
    create: {
      width: PANEL_W * 2,
      height: PANEL_H,
      channels: 3,
      background: { r: 245, g: 245, b: 240 },
    },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: PANEL_W, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function poll(token: string, prediction: { id?: string; status?: string; output?: unknown }) {
  let p = prediction
  for (let i = 0; i < 40 && (p.status === 'starting' || p.status === 'processing'); i++) {
    await new Promise(r => setTimeout(r, 1500))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${p.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    p = await res.json()
  }
  return p
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const body = await req.json()
    const panasFile = String(body.panasFile || 'panas-walking.jpg')
    const ganyaFile = String(body.ganyaFile || 'ganya-standing.jpg')
    const scene = String(body.scene || '').trim()
    const collageOnly = body.collageOnly === true

    const collage = await buildCollage(panasFile, ganyaFile)

    const supabase = getSupabaseAdmin()
    const stamp = Date.now()

    // Колаж теж кладемо в Storage — щоб було видно, що саме пішло в модель.
    const collageName = `pair-test/collage-${stamp}.jpg`
    await supabase.storage.from('covers')
      .upload(collageName, collage, { contentType: 'image/jpeg', upsert: true })
    const { data: { publicUrl: collageUrl } } =
      supabase.storage.from('covers').getPublicUrl(collageName)

    if (collageOnly) {
      return NextResponse.json({ collageUrl, url: null })
    }

    const seed = Number(body.seed) || Math.floor(Math.random() * 2_000_000)
    const prompt = [scene, PAIR_LOOK, PAIR_TECH].filter(Boolean).join(', ') + `, seed_${seed}`
    const base64Image = `data:image/jpeg;base64,${collage.toString('base64')}`

    const res = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt,
            negative_prompt: NEGATIVE_PROMPT,
            input_image: base64Image,
            seed,
            guidance_scale: 7,
            aspect_ratio: '3:2',
          },
        }),
      },
    )

    let prediction = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: prediction?.detail || 'Replicate error' }, { status: 502 })
    }
    prediction = await poll(token, prediction)
    if (prediction.status !== 'succeeded') {
      return NextResponse.json({ error: `Replicate: ${prediction.status}`, collageUrl }, { status: 502 })
    }

    const generatedUrl: string = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output
    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ url: generatedUrl, collageUrl, seed, stored: false })
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const fileName = `pair-test/pair-${seed}-${stamp}.jpg`
    const { error: upErr } = await supabase.storage.from('covers')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) {
      return NextResponse.json({ url: generatedUrl, collageUrl, seed, stored: false })
    }
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, collageUrl, seed, stored: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
