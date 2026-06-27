import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// КОЛАЖ-ПОСТЕР ТРІЙЦІ «ТИША» — БЕЗ генерації, чиста композиція канонних фото.
// Принцип кіно-постера: ГЕРОЙ великий і чіткий спереду; решта — дрібніші,
// темні, розмиті, втоплені в тінь; зверху холодний грейд + радіальна вінєтка,
// що з'їдає краї в чорне (ховає шви) + нижній градієнт під назву.
// Обличчя 100% канонні (накладання готових фото через sharp), не AI.
// =============================================================================

const W = 1280
const H = 720
const BG = '#060d18'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Не вдалося завантажити ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// Фото → овальна феатер-вирізка з тісною маскою (краї тануть, без прямокутника).
async function ovalPortrait(
  buf: Buffer,
  w: number,
  h: number,
  opts: { brightness?: number; saturation?: number; blur?: number } = {},
): Promise<Buffer> {
  let img = sharp(buf).resize(w, h, { fit: 'cover', position: 'top' })
  const mod: { brightness?: number; saturation?: number } = {}
  if (opts.brightness != null) mod.brightness = opts.brightness
  if (opts.saturation != null) mod.saturation = opts.saturation
  if (Object.keys(mod).length) img = img.modulate(mod)
  if (opts.blur) img = img.blur(opts.blur)
  const base = await img.png().toBuffer()

  // Тісна феатер-маска: суцільний центр до 40% → прозоро до краю.
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><radialGradient id="g" cx="50%" cy="44%" r="56%">` +
    `<stop offset="40%" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  )

  return sharp(base)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

// Верхній шар: холодний тон + радіальна вінєтка + нижній градієнт під назву.
function overlaySvg(): Buffer {
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs>` +
    `<radialGradient id="vig" cx="50%" cy="44%" r="72%">` +
    `<stop offset="42%" stop-color="${BG}" stop-opacity="0"/>` +
    `<stop offset="100%" stop-color="${BG}" stop-opacity="0.92"/>` +
    `</radialGradient>` +
    `<linearGradient id="bot" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0%" stop-color="${BG}" stop-opacity="0.96"/>` +
    `<stop offset="42%" stop-color="${BG}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `</defs>` +
    // холодний тон по всьому кадру
    `<rect width="100%" height="100%" fill="#0e2740" opacity="0.12"/>` +
    // радіальна вінєтка
    `<rect width="100%" height="100%" fill="url(#vig)"/>` +
    // нижній затемнювач під назву
    `<rect width="100%" height="100%" fill="url(#bot)"/>` +
    `</svg>`,
  )
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

    // Друзі — дрібні, ТЕМНІ, розмиті, знебарвлені; глибоко в тіні, по боках знизу.
    const roman = await ovalPortrait(bR, 360, 470, { brightness: 0.32, saturation: 0.5, blur: 11 })
    const sashko = await ovalPortrait(bS, 360, 470, { brightness: 0.32, saturation: 0.5, blur: 11 })
    // Максим — великий, чіткий, спереду по центру, з виходом за верх/низ.
    const maksym = await ovalPortrait(bM, 560, 720, { brightness: 1.05 })

    const out = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
      .composite([
        { input: roman, left: 30, top: 245 },                  // позаду ліворуч-знизу
        { input: sashko, left: W - 360 - 30, top: 245 },       // позаду праворуч-знизу
        { input: maksym, left: Math.round((W - 560) / 2), top: 0 }, // спереду по центру
        { input: overlaySvg(), left: 0, top: 0 },              // грейд + вінєтка + низ
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
