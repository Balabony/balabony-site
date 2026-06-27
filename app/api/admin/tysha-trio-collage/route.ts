import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// КОЛАЖ ТРІЙЦІ «ТИША» — БЕЗ генерації, чиста композиція канонних портретів.
// Максим спереду по центру (великий, чіткий), Роман ліворуч-позаду й Сашко
// праворуч-позаду (менші, приглушені, розмиті). Тло темне в стилі Тиші.
// Обличчя 100% канонні — це не AI-генерація, а накладання готових фото (sharp).
// =============================================================================

const W = 1280
const H = 720
const BG = '#0a1628'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Не вдалося завантажити ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Фото → овальна феатер-вирізка (краї плавно зникають у тлі, без прямокутника).
async function ovalPortrait(
  buf: Buffer,
  w: number,
  h: number,
  opts: { brightness?: number; blur?: number } = {},
): Promise<Buffer> {
  let img = sharp(buf).resize(w, h, { fit: 'cover', position: 'top' })
  if (opts.brightness && opts.brightness !== 1) img = img.modulate({ brightness: opts.brightness })
  if (opts.blur) img = img.blur(opts.blur)
  const base = await img.png().toBuffer()

  // Феатер-маска: білий овал у центрі → прозорий до країв.
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><radialGradient id="g" cx="50%" cy="42%" r="60%">` +
    `<stop offset="50%" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  )

  return sharp(base)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const urlMaksym = String(body.refMaksym || '')
    const urlRoman = String(body.refRoman || '')
    const urlSashko = String(body.refSashko || '')
    if (!urlMaksym || !urlRoman || !urlSashko) {
      return NextResponse.json({ error: 'Потрібні всі три URL еталонів' }, { status: 400 })
    }

    const [bM, bR, bS] = await Promise.all([fetchBuf(urlMaksym), fetchBuf(urlRoman), fetchBuf(urlSashko)])

    // Друзі — позаду, менші, приглушені (brightness) і трохи розмиті (blur).
    const roman = await ovalPortrait(bR, 440, 600, { brightness: 0.5, blur: 6 })
    const sashko = await ovalPortrait(bS, 440, 600, { brightness: 0.5, blur: 6 })
    // Максим — спереду, великий, чіткий, повна яскравість.
    const maksym = await ovalPortrait(bM, 600, 720, { brightness: 1 })

    const canvas = sharp({
      create: { width: W, height: H, channels: 3, background: BG },
    })

    const out = await canvas
      .composite([
        { input: roman, left: 40, top: 120 },                    // позаду ліворуч
        { input: sashko, left: W - 440 - 40, top: 120 },         // позаду праворуч
        { input: maksym, left: Math.round((W - 600) / 2), top: 0 }, // спереду по центру (останній = зверху)
      ])
      .jpeg({ quality: 88 })
      .toBuffer()

    const supabase = getSupabaseAdmin()
    const fileName = `tysha-gen/trio-collage-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, out, { contentType: 'image/jpeg', upsert: true })
    if (upErr) return NextResponse.json({ error: `Storage: ${upErr.message}` }, { status: 502 })

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
