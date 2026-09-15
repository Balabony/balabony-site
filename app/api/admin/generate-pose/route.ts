import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getCharacter } from '@/lib/pose-characters'

// =============================================================================
// ГЕНЕРАТОР БАЗОВИХ ПОЗ (Flux на Replicate) — один на всіх персонажів.
// -----------------------------------------------------------------------------
// Замінює generate-panas-pose і generate-ganya-pose: потік у них був той самий,
// різнилися лише опис героя, перелік поз і тека. Канон переїхав у
// lib/pose-characters.ts, сюди лишилася механіка.
//
// Двокроковий потік:
//   mode='reference' → text-to-image (flux-1.1-pro): еталонні портрети, з яких
//                      обираєш канонічний вигляд.
//   mode='pose'      → image-to-image (flux-kontext-pro): з обраного еталона
//                      кожна поза, обличчя лишається тим самим.
//
// КЛЮЧОВЕ: пози генеруються на ЧИСТОМУ НЕЙТРАЛЬНОМУ фоні. Тоді generate-cover
// (kontext) накладає будь-яку локацію з LOCATION_PROMPTS — фон не «запечений».
//
// Результат заливається в Supabase Storage: URL від Replicate живе близько
// години, а посилання має пережити вечір роботи.
// Готові пози завантажуєш і кладеш у public/<folder>/ як <prefix>-<pose>.jpg
//
// Виклик: GET /api/admin/generate-pose?character=panas
//         POST { character, mode, pose, referenceImageUrl, description, seed }
// =============================================================================

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// GET → перелік поз і типовий опис вигляду для UI
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const c = getCharacter(req.nextUrl.searchParams.get('character'))
  if (!c) return NextResponse.json({ error: 'Невідомий персонаж' }, { status: 400 })

  const poses = Object.entries(c.poses).map(([key, v]) => ({
    key,
    label: v.label,
    fileName: `${c.filePrefix}-${key}.jpg`,
  }))

  return NextResponse.json({
    poses,
    defaultLook: c.defaultLook,
    defaultRefUrl: c.defaultRefUrl,
    folder: c.folder,
  })
}

async function pollReplicate(token: string, prediction: { id?: string; status?: string; output?: unknown }) {
  for (let i = 0; i < 40 && (prediction.status === 'starting' || prediction.status === 'processing'); i++) {
    await new Promise(r => setTimeout(r, 1500))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    prediction = await poll.json()
  }
  return prediction
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    const c = getCharacter(body.character)
    if (!c) return NextResponse.json({ error: 'Невідомий персонаж' }, { status: 400 })

    const mode: 'reference' | 'pose' = body.mode === 'pose' ? 'pose' : 'reference'
    const look: string = (body.description && String(body.description).trim()) || c.defaultLook

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const seed: number = Number.isFinite(body.seed) ? Number(body.seed) : Math.floor(Math.random() * 2_000_000)

    let endpoint = ''
    let input: Record<string, unknown> = {}
    let tag = ''

    if (mode === 'reference') {
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions'
      input = {
        prompt: c.refPrompt(look, seed),
        aspect_ratio: c.refAspect,
        output_format: 'jpg',
        safety_tolerance: 2,
        seed,
      }
      tag = 'ref'
    } else {
      const poseKey = String(body.pose || '')
      const pose = c.poses[poseKey]
      const referenceImageUrl = String(body.referenceImageUrl || '')
      if (!pose) return NextResponse.json({ error: 'Невідома поза' }, { status: 400 })
      if (!referenceImageUrl) return NextResponse.json({ error: 'Спочатку обери еталон' }, { status: 400 })

      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions'
      input = {
        prompt: `${c.keepFacePrefix}now ${pose.phrase}, ${c.poseTech}, seed_${seed}`,
        input_image: referenceImageUrl,
        aspect_ratio: c.poseAspect,
        output_format: 'jpg',
        safety_tolerance: 2,
        seed,
      }
      tag = poseKey
    }

    const replicateRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({ input }),
    })

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()
    prediction = await pollReplicate(token, prediction)

    if (prediction.status !== 'succeeded' || !prediction.output) {
      return NextResponse.json({ error: 'Генерація не вдалась або вийшов час очікування' }, { status: 502 })
    }

    const generatedUrl: string = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Не вдалося завантажити згенероване зображення' }, { status: 502 })
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const supabase = getSupabaseAdmin()
    const fileName = `${c.genFolder}/${tag}-${seed}-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) {
      // Сторадж не дав — повертаємо прямий URL Replicate: на сесію вистачить,
      // а робота не спиняється через збій зберігання.
      return NextResponse.json({ url: generatedUrl, seed, stored: false })
    }
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, seed, stored: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
