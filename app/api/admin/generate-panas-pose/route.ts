import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// ГЕНЕРАТОР БАЗОВИХ ПОЗ ДІДА ПАНАСА (Flux на Replicate)
// -----------------------------------------------------------------------------
// Двокроковий потік (дзеркалить generate-ganya-pose):
//   mode='reference' → text-to-image (flux-1.1-pro): кілька еталонних портретів,
//                      з яких ти обираєш канонічний вигляд Панаса.
//   mode='pose'      → image-to-image (flux-kontext-pro): з обраного еталона
//                      генеруємо кожну позу, зберігаючи ТЕ САМЕ обличчя.
// КЛЮЧОВЕ: усі пози — на ЧИСТОМУ НЕЙТРАЛЬНОМУ фоні (plain neutral studio
// background). Тоді generate-cover (kontext) зможе НАКЛАСТИ будь-яку локацію
// з каталогу LOCATION_PROMPTS — фон більше не "запечений" у позу.
// Результат заливається в Supabase Storage (стабільний URL) і повертається.
// Готові пози ти завантажуєш і кладеш у public/panas-poses/ як panas-<pose>.jpg
// =============================================================================

// Базовий «замок» вигляду — щоб обличчя/одяг були однакові на всіх позах.
// Канон Панаса: дід ~70, біла борода, вишиванка + темна жилетка, хрестик.
const DEFAULT_LOOK =
  'a warm elderly Ukrainian village grandfather, around 70 years old, of average ' +
  'height and lean build, kind weathered face with soft wrinkles, full neatly-kept ' +
  'grey-white beard, short grey hair, lively intelligent eyes, wearing a white ' +
  'embroidered Ukrainian shirt (vyshyvanka) under a dark sleeveless waistcoat ' +
  '(zhyletka), a small wooden cross on a cord, a woven belt at the waist, ' +
  'photorealistic, cinematic warm soft lighting'

// Спільні «технічні» вимоги до базової пози — повна фігура, ЧИСТИЙ фон,
// і головне: НЕ обрізати ноги/ступні (урок з обкладинок Панаса).
const POSE_TECH =
  'full figure from head to feet, standing at full natural height, camera at eye level, ' +
  'realistic adult human body proportions, normal-length legs, lean build, head ' +
  'proportional to the body, dignified upright posture, well-formed hands with exactly ' +
  'five fingers on each hand and anatomically correct, entire body within frame, ' +
  'feet fully visible, never cropped at the knees or ankles, ' +
  'plain neutral seamless studio background, light grey backdrop, no scenery, ' +
  'no house, no garden, no flowers, no fence, soft even studio lighting, ' +
  'natural proportions, sharp focus, no text, no watermark'

// Фірмовий предмет Панаса — СИНІЙ БЛОКНОТ (твердий темно-синій нотатник),
// куди він записує свої «винаходи» та плани. Тримає його або пише в ньому.
const NOTEBOOK =
  'a dark navy-blue hardcover notebook (his trademark notebook for inventions and ' +
  'plans), held in his hand or tucked under his arm, clearly a small thick notebook, ' +
  'not a book, not a tablet, not a phone'

// Каталог 23 поз Панаса — імена ТОЧНО збігаються з наявними файлами
// public/panas-poses/panas-<key>.jpg, щоб generate-cover їх знаходив.
const PANAS_POSES: Record<string, { label: string; phrase: string }> = {
  'walking':       { label: 'Йде',                   phrase: `walking forward calmly along, ${NOTEBOOK}` },
  'sitting':       { label: 'Сидить',                phrase: `sitting on a plain wooden bench, hands on knees, ${NOTEBOOK} beside him, calm` },
  'thinking':      { label: 'Думає',                 phrase: `one hand at his chin in thought, looking up pondering, ${NOTEBOOK} in the other hand` },
  'back':          { label: 'Зі спини',              phrase: 'seen from behind, hands clasped behind his back, looking ahead, standing' },
  'crouching':     { label: 'Присів',                phrase: 'crouching down on his heels, examining something on the ground with curiosity' },
  'reaching':      { label: 'Тягнеться',             phrase: 'reaching out with one hand as if pointing or grasping something, engaged' },
  'lying':         { label: 'Лежить',                phrase: `lying back relaxed and content, looking up, ${NOTEBOOK} resting on his chest` },
  'running':       { label: 'Біжить',                phrase: 'hurrying forward in a brisk comic half-run, one arm swinging, eager' },
  'laughing':      { label: 'Сміється',              phrase: 'laughing heartily, head tilted slightly back, joyful open smile' },
  'reading':       { label: 'Читає',                 phrase: 'reading an open newspaper held in both hands, focused, slight smile' },
  'window-night':  { label: 'Біля вікна (ніч)',      phrase: 'standing thoughtfully as if by a window at night, lit by a single warm lamp, contemplative' },
  'digging':       { label: 'Копає',                 phrase: 'kneeling on one knee, digging into the soil with a wooden-handled spade, determined' },
  'surprised':     { label: 'Здивований',            phrase: `eyes wide with surprise, both arms raised slightly, mouth open, ${NOTEBOOK} in one hand` },
  'praying':       { label: 'Молиться',              phrase: 'hands gently clasped together, head bowed, calm reverent expression' },
  'arguing':       { label: 'Сперечається',          phrase: `gesturing emphatically with one hand as if making a point, lively, ${NOTEBOOK} in the other` },
  'sleeping':      { label: 'Спить',                 phrase: 'dozing peacefully sitting up, eyes closed, head tilted, content half-smile' },
  'notebook':      { label: 'Пише в блокноті',        phrase: `sitting and writing in ${NOTEBOOK} with a pen, focused and pleased with an idea` },
  'quarrel':       { label: 'Свариться',             phrase: 'both hands raised in animated mock-argument, eyebrows up, comic indignation' },
  'tree':          { label: 'Біля дерева',           phrase: 'standing relaxed with one hand resting against a plain tree trunk, easy smile' },
  'chickens':      { label: 'З курми',               phrase: 'crouching and offering a hand low as if feeding two hens at his feet, warm' },
  'neighbor':      { label: 'Із сусідом',            phrase: 'leaning on a plain wooden fence rail, talking warmly and gesturing, sociable' },
  'holding':       { label: 'Тримає предмет',        phrase: `holding ${NOTEBOOK} in both hands, examining it with curiosity` },
  'packages':      { label: 'З пакунками',           phrase: 'holding a small parcel or box in both hands, looking at it with curious anticipation' },
}

// GET → віддати список поз для UI
export async function GET() {
  const poses = Object.entries(PANAS_POSES).map(([key, v]) => ({
    key,
    label: v.label,
    fileName: `panas-${key}.jpg`,
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
      // Поясний портрет на ЧИСТОМУ фоні, щоб обличчя було чітке.
      const prompt =
        `${look}, head and shoulders portrait cropped at the chest, above the hands, ` +
        `hands not visible, facing the camera, realistic adult human proportions, ` +
        `plain neutral seamless studio background, light grey backdrop, soft even lighting, ` +
        `photorealistic, sharp focus, no text, no watermark, seed_${seed}`
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions'
      input = { prompt, aspect_ratio: '3:4', output_format: 'jpg', safety_tolerance: 2, seed }
      tag = 'ref'
    } else {
      // Поза з еталона — flux-kontext-pro (image-to-image, тримає обличчя).
      const poseKey = String(body.pose || '')
      const pose = PANAS_POSES[poseKey]
      const referenceImageUrl = String(body.referenceImageUrl || '')
      if (!pose) return NextResponse.json({ error: 'Невідома поза' }, { status: 400 })
      if (!referenceImageUrl) return NextResponse.json({ error: 'Спочатку обери еталон' }, { status: 400 })

      const prompt =
        `the same elderly Ukrainian grandfather, keep his face and clothes identical, ` +
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
    const fileName = `panas-gen/${tag}-${seed}-${Date.now()}.jpg`
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
