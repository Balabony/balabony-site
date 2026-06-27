import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// =============================================================================
// ГЕНЕРАТОР ОБКЛАДИНОК «ТИША» (Flux на Replicate)
// -----------------------------------------------------------------------------
// Двокроковий потік (дзеркалить generate-panas-pose), щоб обличчя ТРИМАЛОСЯ
// однаковим на всіх серіях — критично для Максима (серії 4+ — він на війні):
//   mode='reference' → flux-1.1-pro (text→image): кілька еталонних ПОРТРЕТІВ
//                      персонажа (4:5, чисте обличчя), з яких Богдан обирає канон.
//   mode='cover'     → flux-kontext-pro (image→image): з обраного еталона робимо
//                      обкладинку 16:9 у заданих обставинах, ЗБЕРІГАЮЧИ обличчя.
//
// КАНОН облич (робочі дефолти, редаговані через body.description):
//   maksym — ~18, худий, книжковий, темне волосся, тихий чутливий погляд (оповідач)
//   roman  — ~19, атлетичний, світле волосся, відкрите впевнене обличчя
//   sashko — ~18, в окулярах, інтелігентний приязний вигляд
// Усі — ДОРОСЛІ (18-19). Жодних дітей. Вигадані обличчя, не реальні люди.
// 18+ драма, але БЕЗ графічної кривавості — атмосфера, не gore.
// Результат заливається в Supabase Storage (covers) і повертається стабільним URL.
// Роут НЕ пише cover_url у БД — присвоєння серії робить окремо адмін-UI.
// =============================================================================

const CHARACTERS: Record<string, { label: string; look: string }> = {
  maksym: {
    label: 'Максим',
    look:
      'a thin bookish Ukrainian young man, exactly 18 years old, an adult, lean slight build, ' +
      'dark hair, pale thoughtful intelligent face, quiet sensitive watchful eyes, ' +
      'introspective expression, plain modern casual clothes',
  },
  roman: {
    label: 'Роман',
    look:
      'an athletic Ukrainian young man, exactly 19 years old, an adult, strong fit build, ' +
      'light blond hair, open confident friendly face, warm direct gaze, ' +
      'plain modern casual clothes',
  },
  sashko: {
    label: 'Сашко',
    look:
      'a Ukrainian young man, exactly 18 years old, an adult, average build, ' +
      'wearing glasses, intelligent kind slightly reserved face, calm gaze, ' +
      'plain modern casual clothes',
  },
}

// Обставини для обкладинки (cover mode). «friend» — мирний живий портрет
// для серій 1-3; решта — воєнні обставини Максима (серії 4+), стримано, без gore.
const SCENES: Record<string, { label: string; phrase: string }> = {
  'friend': {
    label: 'Портрет друга (мирний)',
    phrase:
      'a lifelike close portrait in soft natural daylight, calm everyday peacetime mood, ' +
      'plain softly-blurred neutral background, gentle realistic expression',
  },
  'trench-rain': {
    label: 'Окоп, дощ',
    phrase:
      'in a muddy front-line trench under cold grey rain, wearing a plain unmarked military ' +
      'jacket, tired tense face, dim overcast light, no insignia, no weapons shown',
  },
  'night-post': {
    label: 'Нічний пост',
    phrase:
      'standing alone on a night watch, faint cold blue light on his face, deep shadows, ' +
      'listening intently into the darkness, exhausted alert expression, no weapons shown',
  },
  'aftermath': {
    label: 'Тиша після',
    phrase:
      'sitting still amid distant dust and haze after an event, vacant exhausted thousand-yard ' +
      'stare, muted desaturated palette, quiet and restrained, no blood, no wounds, no gore',
  },
  'ruins': {
    label: 'Серед руїн',
    phrase:
      'walking through a quiet ruined street far in the background, small lone figure, ' +
      'overcast cold light, dust in the air, somber, no violence shown',
  },
  'helping': {
    label: 'Допомагає побратиму',
    phrase:
      'crouching to steady and help an unseen comrade, focused caring tense face, ' +
      'dim field light, restrained and human, no blood, no wounds, no gore',
  },
}

const TECH =
  'photorealistic, lifelike, cinematic, fine skin texture and real human detail, ' +
  'natural film grain, muted cold colour grading, realistic adult human proportions, ' +
  'well-formed hands with five fingers, sharp focus, no text, no watermark, ' +
  'not a child, no children, invented fictional person, not a real public figure'

// GET → списки для UI
export async function GET() {
  return NextResponse.json({
    characters: Object.entries(CHARACTERS).map(([key, v]) => ({ key, label: v.label, look: v.look })),
    scenes: Object.entries(SCENES).map(([key, v]) => ({ key, label: v.label })),
  })
}

async function pollReplicate(
  token: string,
  prediction: { id?: string; status?: string; output?: unknown },
) {
  for (let i = 0; i < 40 && (prediction.status === 'starting' || prediction.status === 'processing'); i++) {
    await new Promise((r) => setTimeout(r, 1500))
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
    const mode: 'reference' | 'cover' = body.mode === 'cover' ? 'cover' : 'reference'

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })

    const charKey = String(body.character || '')
    const character = CHARACTERS[charKey]
    if (!character) return NextResponse.json({ error: 'Невідомий персонаж' }, { status: 400 })

    // Дозволяємо редагувати look з UI; інакше — дефолт персонажа.
    const look: string = (body.description && String(body.description).trim()) || character.look
    const seed: number = Number.isFinite(body.seed) ? Number(body.seed) : Math.floor(Math.random() * 2_000_000)

    let endpoint = ''
    let input: Record<string, unknown> = {}
    let tag = ''

    if (mode === 'reference') {
      // Еталонне обличчя — flux-1.1-pro, поясний портрет 4:5, чистий фон.
      const prompt =
        `${look}, head and shoulders portrait, facing the camera, neutral calm expression, ` +
        `plain softly-blurred neutral background, soft even lighting, ${TECH}, seed_${seed}`
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions'
      input = { prompt, aspect_ratio: '4:5', output_format: 'jpg', safety_tolerance: 2, seed }
      tag = `${charKey}-ref`
    } else {
      // Обкладинка з еталона — flux-kontext-pro 16:9, тримає обличчя.
      const sceneKey = String(body.scene || '')
      const scene = SCENES[sceneKey]
      const referenceImageUrl = String(body.referenceImageUrl || '')
      // Дозволяємо вільний опис сцени через body.sceneText, інакше — пресет.
      const scenePhrase: string = (body.sceneText && String(body.sceneText).trim()) || scene?.phrase || ''
      if (!scenePhrase) return NextResponse.json({ error: 'Обери або опиши сцену' }, { status: 400 })
      if (!referenceImageUrl) return NextResponse.json({ error: 'Спочатку обери еталон' }, { status: 400 })

      const prompt =
        `the same young man, keep his face identical, same person, ${scenePhrase}, ` +
        `reframe as a wide cinematic 16:9 cover with the figure ` +
        `off-centre and environment around, ${TECH}, seed_${seed}`
      endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions'
      input = {
        prompt,
        input_image: referenceImageUrl,
        aspect_ratio: '16:9',
        output_format: 'jpg',
        safety_tolerance: 2,
        seed,
      }
      tag = `${charKey}-${sceneKey || 'scene'}`
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

    // Перезалив у Storage — URL Replicate живе ~годину.
    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) return NextResponse.json({ error: 'Не вдалося завантажити зображення' }, { status: 502 })
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const supabase = getSupabaseAdmin()
    const fileName = `tysha-gen/${tag}-${seed}-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) {
      return NextResponse.json({ url: generatedUrl, seed, stored: false })
    }
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, seed, stored: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
