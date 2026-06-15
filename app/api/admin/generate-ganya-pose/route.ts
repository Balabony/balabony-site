import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// ГЕНЕРАТОР БАЗОВИХ ПОЗ БАБИ ГАНІ (Flux на Replicate)
// -----------------------------------------------------------------------------
// Двокроковий потік:
//   mode='reference' → text-to-image (flux-1.1-pro): кілька еталонних портретів,
//                      з яких ти обираєш канонічний вигляд Гані.
//   mode='pose'      → image-to-image (flux-kontext-pro): з обраного еталона
//                      генеруємо кожну позу, зберігаючи ТЕ САМЕ обличчя.
// Результат заливається в Supabase Storage (стабільний URL) і повертається.
// Готові пози ти завантажуєш і кладеш у public/ganya-poses/ як ganya-<pose>.jpg
// =============================================================================

// Базовий «замок» вигляду — щоб обличчя/одяг були однакові на всіх позах.
// Можна перевизначити з UI (поле опису).
const DEFAULT_LOOK =
  'a warm elderly Ukrainian village grandmother, around 68 years old, of average ' +
  'height and slender build, kind lively face with soft wrinkles, gentle smile, ' +
  'grey hair partly tucked under a floral headscarf (khustka), wearing a white ' +
  'embroidered Ukrainian blouse (vyshyvanka), a long dark skirt down to mid-calf ' +
  'and an apron over the skirt (NOT trousers), photorealistic, cinematic warm soft lighting'

// Спільні «технічні» вимоги до базової пози — повна фігура, чистий фон,
// і головне: НЕ обрізати ноги/ступні (урок з обкладинок Панаса).
const POSE_TECH =
  'full figure from head to feet, standing at full natural height, camera at eye level, ' +
  'realistic adult human body proportions, long legs, slender build, small head ' +
  'relative to the body, dignified upright posture, well-formed hands with exactly ' +
  'five fingers on each hand and anatomically correct, entire body within frame, ' +
  'feet fully visible, never cropped at the knees or ankles, plain neutral studio ' +
  'background, soft even lighting, natural proportions, sharp focus, no text, no watermark'

// Каталог стартових поз Гані (дзеркалить корисні пози Панаса).
// suffix після `ganya-` = імʼя файлу: public/ganya-poses/ganya-<key>.jpg
// Фірмовий предмет Гані — деревʼяний ополоник (суповий черпак).
// Держак ДОВГИЙ (у 2-3 рази довший за чашу), на кінці — глибока кругла чаша-півсфера.
// Тримає за держак на рівні пояса, чаша вгору, НЕ впирається в підлогу.
const LADLE =
  'a traditional Ukrainian wooden soup ladle (ополоник): a long straight wooden ' +
  'handle, two to three times longer than the bowl, ending in a deep round ' +
  'cup-shaped bowl (a small hemisphere for scooping soup), hand-carved warm-brown ' +
  'wood, the deep rounded bowl clearly visible; she holds it firmly by the long ' +
  'handle at waist height, the bowl pointing upward, lifted in her hand and not ' +
  'resting on the floor, clearly a kitchen ladle — not a walking stick, not a ' +
  'staff, not a flat spoon, not a separate bowl'

const GANYA_POSES: Record<string, { label: string; phrase: string }> = {
  'standing':   { label: 'Стоїть (нейтральна)',     phrase: `standing calmly, facing the camera, holding ${LADLE} in one hand` },
  'cooking':    { label: 'Готує (ополоник)',         phrase: `holding ${LADLE}, raised in one hand as if she has just stirred a dish, lively` },
  'notebook':   { label: 'Пише (записник)',          phrase: 'sitting at a wooden table, writing in a notebook with a pen, focused and content' },
  'reading':    { label: 'Читає',                    phrase: 'reading an open book, reading glasses low on her nose' },
  'talking':    { label: 'Розмовляє (жестикулює)',   phrase: `talking and gesturing warmly with ${LADLE} in one hand` },
  'sitting':    { label: 'Сидить',                   phrase: 'sitting on a wooden bench, hands folded in her lap, calm' },
  'surprised':  { label: 'Здивована',                phrase: 'eyes wide with surprise, one hand raised to her cheek' },
  'laughing':   { label: 'Сміється',                 phrase: 'laughing warmly, head tilted slightly back, joyful' },
  'scolding':   { label: 'Свариться (мружить око)',  phrase: `narrowing her eyes with a knowing skeptical look, one eyebrow slightly raised, both eyes open, playfully wagging ${LADLE}, mock-scolding` },
  'holding':    { label: 'Тримає предмет',           phrase: `holding ${LADLE} in both hands, examining it with curiosity` },
  'baking':     { label: 'Місить тісто',             phrase: 'kneading dough on a floured wooden table, sleeves rolled up' },
  'praying':    { label: 'Молиться',                 phrase: 'hands gently together, calm reverent expression, eyes lowered' },
}

// GET → віддати список поз для UI
export async function GET() {
  const poses = Object.entries(GANYA_POSES).map(([key, v]) => ({
    key,
    label: v.label,
    fileName: `ganya-${key}.jpg`,
  }))
  return NextResponse.json({ poses, defaultLook: DEFAULT_LOOK })
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
  try {
    const body = await req.json()
    const mode: 'reference' | 'pose' = body.mode === 'pose' ? 'pose' : 'reference'
    const look: string = (body.description && String(body.description).trim()) || DEFAULT_LOOK

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const seed: number = Number.isFinite(body.seed) ? Number(body.seed) : Math.floor(Math.random() * 2_000_000)

    let endpoint = ''
    let input: Record<string, unknown> = {}
    let tag = ''

    if (mode === 'reference') {
      // Еталонний портрет з нуля — flux-1.1-pro (text-to-image).
      // Поясний/майже на повний зріст портрет, щоб обличчя було чітке.
      const prompt =
        `${look}, head and shoulders portrait cropped at the chest, above the hands, ` +
        `hands not visible, facing the camera, realistic adult human proportions, ` +
        `plain neutral studio background, soft even lighting, photorealistic, ` +
        `sharp focus, no text, no watermark, seed_${seed}`
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions'
      input = { prompt, aspect_ratio: '3:4', output_format: 'jpg', safety_tolerance: 2, seed }
      tag = 'ref'
    } else {
      // Поза з еталона — flux-kontext-pro (image-to-image, тримає обличчя).
      const poseKey = String(body.pose || '')
      const pose = GANYA_POSES[poseKey]
      const referenceImageUrl = String(body.referenceImageUrl || '')
      if (!pose) return NextResponse.json({ error: 'Невідома поза' }, { status: 400 })
      if (!referenceImageUrl) return NextResponse.json({ error: 'Спочатку обери еталон' }, { status: 400 })

      const prompt =
        `the same elderly Ukrainian grandmother, keep her face and clothes identical, ` +
        `now ${pose.phrase}, ${POSE_TECH}, seed_${seed}`
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions'
      input = { prompt, input_image: referenceImageUrl, aspect_ratio: '2:3', output_format: 'jpg', safety_tolerance: 2, seed }
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

    // Залити в Supabase Storage — щоб URL був стабільний (Replicate-URL живе ~годину).
    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Не вдалося завантажити згенероване зображення' }, { status: 502 })
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const supabase = getSupabaseAdmin()
    const fileName = `ganya-gen/${tag}-${seed}-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) {
      // Якщо сторадж не дав — повертаємо хоч прямий URL Replicate (на сесію вистачить).
      return NextResponse.json({ url: generatedUrl, seed, stored: false })
    }
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, seed, stored: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
