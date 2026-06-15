import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { applyGoldenFrame } from '@/lib/golden-frame'

// Жорсткий пост-кроп: лишає верхні ~68% кадру (голова+плечі+груди), відрізає
// низ із кистями рук. Гарантовано прибирає руки/пальці з Ганіних обкладинок.
async function cropAboveHands(buf: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(buf).metadata()
    const w = meta.width || 0
    const h = meta.height || 0
    if (!w || !h) return buf
    const newH = Math.max(1, Math.round(h * 0.68))
    return await sharp(buf).extract({ left: 0, top: 0, width: w, height: newH }).toBuffer()
  } catch {
    return buf
  }
}

// =============================================================================
// СТАРИЙ FALLBACK (на випадок коли в cover_plan немає запису для slug)
// =============================================================================
const POSE_FILES = [
  'panas-walking', 'panas-sitting', 'panas-thinking', 'panas-back',
  'panas-crouching', 'panas-reaching', 'panas-lying', 'panas-running',
  'panas-laughing', 'panas-reading', 'panas-window-night', 'panas-digging',
  'panas-surprised', 'panas-praying', 'panas-arguing', 'panas-sleeping',
  'panas-notebook', 'panas-quarrel', 'panas-tree', 'panas-chickens',
  'panas-neighbor', 'panas-holding', 'panas-packages',
]

// =============================================================================
// КАТАЛОГ ЛОКАЦІЙ (35) — фрази для промпту Flux
// =============================================================================
const LOCATION_PROMPTS: Record<string, string> = {
  'old-house-interior': 'interior of an old Ukrainian village house, whitewashed clay stove (pich), wooden ceiling beams, embroidered icons on the wall',
  'old-house-exterior': 'exterior of a white-painted clay village house, thatched roof, wooden window shutters',
  'kitchen-rustic':     'rustic Ukrainian village kitchen, wooden table, ceramic bowls, embroidered towel (rushnyk), loaf of bread',
  'summer-kitchen':     'open-air summer kitchen separate from the house, open fire, hanging pots',
  'entry-hall':         'entry hall (sini) of a village house, boots on floor, sacks, old wooden chest, icon above door',
  'attic':              'dusty attic with cobwebs, old wooden chests, ceiling beams, faint light through small window',
  'yard':               'village courtyard with a wooden bench under a tree, wooden fence, chicken pecking in dust',
  'porch':              'wooden porch with carved railings, small table with tea or moonshine',
  'gate':               'standing by wooden village gate, weathered fence posts, rusted chain',
  'garden':             'vegetable garden with rows of potatoes, tomatoes, carrots, wooden hoe',
  'orchard':            'small orchard with apple and cherry trees, fallen fruit on grass',
  'vineyard':           'small village vineyard, grape vines on wooden trellises, hanging grape clusters',
  'chicken-coop':       'wooden chicken coop with hens, perches, scattered grain',
  'barn':               'wooden barn interior with hay, a cow or goat, wooden manger',
  'cellar':             'dim earthen cellar with shelves of pickled jars, wooden barrels, oil lamp',
  'well':               'old wooden well with crane (zhuravel), wooden bucket',
  'woodpile':           'stack of chopped firewood, axe stuck in a log',
  'bee-yard':           'small bee yard with several wooden hives, jar of honey',
  'field':              'wide open Ukrainian field, golden wheat or rye, distant horizon',
  'meadow':             'wildflower meadow with daisies and grasses',
  'haystacks':          'haystacks in a field, wooden rake, scythe leaning',
  'forest-edge':        'edge of a forest, mushrooms in moss, dappled twilight',
  'forest-deep':        'deep forest with moss, ferns, light shafts through canopy',
  'river-pond':         'small village river or pond, wooden footbridge, reeds, reflection in water',
  'windmill':           'old wooden windmill on a hill, weathered blades',
  'village-road':       'unpaved village road with wooden fence (tyn) alongside, burdock leaves',
  'village-square':     'village center square with wooden benches, notice board',
  'church-yard':        'outside a small Ukrainian wooden church, blue domes, cemetery gate',
  'village-club':       'village house of culture, wooden stage, simple wooden walls',
  'shop-front':         'small village shop, wooden porch, crates',
  'bus-stop':           'rural bus stop with wooden shelter',
  'cemetery':           'small village cemetery, wooden crosses, embroidered towels tied to grave',
  'school':             'old village school exterior, wooden desk visible through window',
  'post-office':        'tiny village post office, painted mailbox, stack of newspapers',
  'bridge':             'wooden footbridge over a small stream, rotten plank',
}

const SEASON_PROMPTS: Record<string, string> = {
  'spring':  'spring atmosphere, fresh green grass, blossoming branches, muddy puddles after rain',
  'summer':  'summer atmosphere, lush green vegetation, heavy warmth, dust in the air',
  'autumn':  'autumn atmosphere, golden and rust-colored leaves, pumpkins, harvested fields',
  'winter':  'winter atmosphere, fresh snow on ground, frost patterns, smoke from chimney',
}

const TIME_OF_DAY_PROMPTS: Record<string, string> = {
  'golden-hour': 'warm golden hour lighting, soft directional sunlight from low angle, deep amber tones, long soft shadows, cinematic',
  'morning':     'soft morning light, dewy grass, low mist, fresh cool tones, just-risen sun',
  'night':       'night scene, dark blue tones, single warm light source (oil lamp, candle, moon), high contrast shadows',
  'midday':      'bright midday sun, clear sky, crisp defined shadows, vivid natural colours',
  'overcast':    'soft overcast daylight, diffused even light, muted gentle tones, no harsh shadows',
  'blue-hour':   'blue hour twilight, cool dusk tones, deep blue sky, warm window glow in the distance',
  'lamplight':   'warm interior lamplight, cosy amber glow, soft pools of light, intimate evening mood',
}

// Fallback константа якщо timeOfDay='golden-hour' (старий код)
const GOLDEN_HOUR_LIGHTING = TIME_OF_DAY_PROMPTS['golden-hour']

// =============================================================================
// КАДРУВАННЯ — посилено щоб Панас не виглядав гномом
// =============================================================================
// Світлі освітлення для ВИПАДКОВОГО вибору — обличчя завжди добре видно.
// Темні (night, lamplight, blue-hour) лишаються лише якщо їх явно задав план серії.
const SAFE_LIGHTING = [
  TIME_OF_DAY_PROMPTS['golden-hour'],
  TIME_OF_DAY_PROMPTS['morning'],
  TIME_OF_DAY_PROMPTS['midday'],
  TIME_OF_DAY_PROMPTS['overcast'],
]

// Варіанти кадрування — усі зрізані ВИЩЕ кистей рук (по груди / голова-плечі),
// щоб у кадр не потрапляли руки з пальцями (часте джерело артефактів Flux),
// а обличчя завжди було видно.
const FRAMING_VARIANTS = [
  'head and shoulders portrait, cropped at mid-chest above the hands, hands not visible, face well lit and clearly visible, natural human proportions',
  'close-up portrait, head and upper chest only, hands out of frame, expressive well-lit face, shallow depth of field, natural human proportions',
  'upper-body portrait from the chest up, cropped above the hands, hands not visible, face clearly visible and well lit, natural human proportions',
]

// Ракурс камери — легке «обертання», але обличчя завжди видно (без чистого профілю).
const ANGLE_VARIANTS = [
  'facing the camera, frontal view, face clearly visible',
  'three-quarter view, body turned slightly to one side, face still toward camera',
  'turned slightly away, looking back over the shoulder toward the camera, face visible',
  'slight low camera angle, dignified grounded perspective, face clearly lit',
]

// Детермінований вибір за seed (різні salt → незалежні осі різноманітності)
function pickBySeed<T>(arr: T[], seed: number, salt: number): T {
  return arr[Math.floor(seed / salt) % arr.length]
}

// =============================================================================
// NEGATIVE PROMPT — посилено проти артефактів Flux
// =============================================================================
const NEGATIVE_PROMPT = [
  // Текст / надписи
  'text', 'letters', 'words', 'captions', 'logos', 'watermarks', 'signatures',
  'typography', 'written words', 'BALABONI', 'БАЛАБОНИ', 'titles', 'subtitles',
  'label', 'labels', 'writing', 'font', 'alphabet', 'numbers', 'digits',
  'inscription', 'cyrillic letters', 'latin letters', 'foreign script',
  'gibberish text', 'ornamental text', 'decorative lettering', 'handwriting',
  'graffiti', 'newspaper text', 'poster text', 'overlaid text', 'burned-in text',
  'banner', 'headline', 'book title', 'book cover text', 'sign with text',
  'propaganda poster', 'political poster', 'soviet poster', 'wall poster',

  // Гібридні / спотворені об'єкти
  'hybrid tools', 'fused tools', 'merged tools', 'two tools combined into one',
  'shovel-hoe hybrid', 'malformed tool', 'impossible tool',
  'floating objects', 'levitating objects', 'objects in mid-air',

  // Спотворена анатомія
  'distorted hands', 'malformed hands', 'extra fingers', 'missing fingers',
  'fused fingers', 'extra limbs', 'extra arms', 'deformed anatomy',
  'hand merging with face', 'hand inside head', 'hand merged with object',

  // Пропорції / масштаб (гном-проблема)
  'small figure', 'tiny person', 'dwarf proportions', 'doll-like proportions',
  'shrunken body', 'oversized head', 'tiny torso', 'miniature person',
  'distant figure', 'subject too small', 'figure lost in scene',

  // Композиція
  'picture-in-picture', 'frame within frame', 'photo inside photo',
  'image within image', 'mise en abyme',
  'pure back view on dark background', 'lonely silhouette no context',

  // Обрізання кінцівок (проблема «обрізані ноги»)
  'cropped legs', 'legs cut off', 'feet cut off', 'cut-off feet',
  'amputated legs', 'amputated feet', 'figure cropped at the knees',
  'cropped at the ankles', 'cropped at the shins', 'limbs cut by frame edge',
  'feet outside the frame', 'awkward body crop',

  // Якість
  'blurry face', 'plastic skin', 'doll face', 'wax figure', 'mannequin',
  'low quality', 'jpeg artifacts', 'oversaturated',
].join(', ')

// =============================================================================
// FALLBACK analyzeScene (старий код для серій яких немає в cover_plan)
// =============================================================================
async function analyzeSceneFallback(title: string, description: string) {
  const fallbackPose = POSE_FILES[Math.floor(Math.random() * POSE_FILES.length)] + '.jpg'
  const fallbackScene = description?.trim() || title

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return { scene: fallbackScene, poseFile: fallbackPose, keyObject: null, objectOwner: null, locationPrompt: '', seasonPrompt: '', timePrompt: GOLDEN_HOUR_LIGHTING }

  try {
    const client = new Anthropic({ apiKey: anthropicKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Проаналізуй опис серії та поверни JSON.
ПОЗИ: ${POSE_FILES.join(', ')}
Поверни ТІЛЬКИ JSON:
{"scene":"<одне речення до 15 слів>","pose":"<назва без .jpg>","keyObject":"<предмет або null>","objectOwner":"self" або "other" або null}
Назва: ${title}
Опис: ${description}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''))
    const poseKey = String(parsed.pose || '').replace(/\.jpg$/, '')
    const poseFile = POSE_FILES.includes(poseKey) ? poseKey + '.jpg' : fallbackPose
    const scene = String(parsed.scene || '').trim() || fallbackScene
    const keyObject = parsed.keyObject && parsed.keyObject !== 'null'
      ? String(parsed.keyObject).trim()
      : null
    const objectOwner = keyObject
      ? (parsed.objectOwner === 'other' ? 'other' : 'self')
      : null
    return { scene, poseFile, keyObject, objectOwner, locationPrompt: '', seasonPrompt: '', timePrompt: GOLDEN_HOUR_LIGHTING }
  } catch {
    return { scene: fallbackScene, poseFile: fallbackPose, keyObject: null, objectOwner: null, locationPrompt: '', seasonPrompt: '', timePrompt: GOLDEN_HOUR_LIGHTING }
  }
}

// =============================================================================
// ГЕРОЄ-ЗАЛЕЖНА ЛОГІКА (Панас / Ганя)
// =============================================================================
const GANYA_POSE_FILES = [
  'ganya-standing', 'ganya-cooking', 'ganya-notebook', 'ganya-reading',
  'ganya-talking', 'ganya-sitting', 'ganya-surprised', 'ganya-laughing',
  'ganya-scolding', 'ganya-holding', 'ganya-baking', 'ganya-praying',
]

// Хто головний у кадрі серії — дід Панас чи баба Ганя.
// За замовчуванням (непевність) — panas, щоб не ламати наявне.
async function detectProtagonist(title: string, text: string): Promise<'panas' | 'ganya'> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !text) return 'panas'
  try {
    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Серіал «Балабони» — комедія характерів, де ДВИГУН майже кожної серії — Панасові «винаходи»/авантюри, що стикаються зі здоровим глуздом села. За замовчуванням головний у кадрі — ПАНАС.

Постав ganya ЛИШЕ якщо серія — це насамперед історія БАБИ ГАНІ: центральна дія в кадрі — те, що РОБИТЬ або ЗАТІВАЄ сама Ганя (її кухня, готування, випічка, книга рецептів, її власний задум чи господарський проєкт), і саме вона рушій сюжету.

Це НЕ робить Ганю головною (тоді panas): вона просто присутня, свариться, кричить «АНУ ЦИТЬ!», лає Панаса чи реагує на його витівку; або сюжет крутиться навколо техніки/винаходу/схеми (5G, блокчейн, дрон, «Матриця», Голлівуд, інтернет тощо) — це майже завжди Панас, навіть якщо її імʼя в назві.

Якщо непевно або обоє нарівні — panas. Подумай: чию ДІЮ має показувати обкладинка.

Відповідай ОДНИМ словом: panas або ganya.

Назва: ${title}
Текст:
${text.slice(0, 2500)}`,
      }],
    })
    const out = msg.content[0]?.type === 'text' ? msg.content[0].text.toLowerCase() : ''
    return (out.includes('ganya') || out.includes('ганя')) ? 'ganya' : 'panas'
  } catch {
    return 'panas'
  }
}

// Підбір пози Гані з її каталогу за текстом серії.
async function analyzeGanya(title: string, text: string): Promise<{ pose: string; scene: string; keyObject: string | null }> {
  const fallback = { pose: 'ganya-standing', scene: title, keyObject: null as string | null }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return fallback
  const semantics = `
- ganya-standing: нейтрально стоїть
- ganya-cooking: готує, біля каструлі/печі
- ganya-notebook: пише в записник (рецепти, нотатки)
- ganya-reading: читає книгу або рецепт
- ganya-talking: розмовляє, жестикулює
- ganya-sitting: сидить спокійно
- ganya-surprised: здивована, шок
- ganya-laughing: сміється, радість
- ganya-scolding: свариться, мружить око, помахує ополоником
- ganya-holding: тримає або розглядає предмет
- ganya-baking: місить тісто, пече
- ganya-praying: молиться, духовний момент`
  try {
    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Обкладинка серії «Балабони» про бабу Ганю. Обери позу з каталогу та опиши сцену.\nПОЗИ:${semantics}\nПоверни ТІЛЬКИ JSON без пояснень:\n{"pose":"<ganya-...>","scene":"<одне речення до 15 слів: що Ганя робить у кадрі, без імен інших персонажів>","keyObject":"<предмет-символ серії 1-4 слова, або null>"}\nНазва: ${title}\nТекст:\n${text.slice(0, 3000)}`,
      }],
    })
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''))
    const pose = GANYA_POSE_FILES.includes(parsed.pose) ? parsed.pose : 'ganya-standing'
    const scene = String(parsed.scene || '').trim() || title
    const keyObject = parsed.keyObject && parsed.keyObject !== 'null' ? String(parsed.keyObject).trim() : null
    return { pose, scene, keyObject }
  } catch {
    return fallback
  }
}

// =============================================================================
// ENDPOINT
// =============================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { seriesId, title, description } = body

    if (!seriesId || !title) {
      return NextResponse.json({ error: 'seriesId and title are required' }, { status: 400 })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const supabase = getSupabaseAdmin()

    // 1. План обкладинки (поза/локація/сезон). Локація/сезон/час — не залежать від героя.
    const { data: planRow } = await supabase
      .from('cover_plan')
      .select('*')
      .eq('slug', seriesId)
      .single()

    // 1b. Текст серії — потрібен для авто-детекту героя та підбору пози Гані.
    let episodeText = (description || '').trim()
    if (!episodeText) {
      const { data: c } = await supabase
        .from('content').select('corrected_text').eq('slug', seriesId).single()
      episodeText = (c?.corrected_text || '').trim()
    }

    // 1c. Який герой на обкладинці:
    //   - 'panas'|'ganya' із запиту — пріоритет (ручне перевизначення);
    //   - 'auto' — Haiku визначає за текстом;
    //   - нічого — за замовчуванням panas (стара поведінка, без сюрпризів).
    const requested = String(body.character || '').toLowerCase()
    let character: 'panas' | 'ganya' = 'panas'
    if (requested === 'panas' || requested === 'ganya') character = requested
    else if (requested === 'auto') character = await detectProtagonist(title, episodeText)

    // Seed — один на всю генерацію (кадр, ракурс, світло, фон, Replicate).
    const seed = Math.floor(Math.random() * 2_000_000)

    let scene: string
    let poseFile: string
    let keyObject: string | null
    let objectOwner: 'self' | 'other' | null
    let usedPose: string
    let usedLocation: string | null = planRow?.location ?? null
    let usedSeason: string | null = planRow?.season ?? null
    let usedTimeOfDay: string | null = planRow?.time_of_day ?? null

    let locationPrompt = planRow ? (LOCATION_PROMPTS[planRow.location] || '') : ''
    let seasonPrompt   = planRow ? (SEASON_PROMPTS[planRow.season] || '') : ''
    let timePrompt     = planRow ? (TIME_OF_DAY_PROMPTS[planRow.time_of_day] || GOLDEN_HOUR_LIGHTING) : GOLDEN_HOUR_LIGHTING

    if (character === 'ganya') {
      // Ганя: поза з її каталогу за текстом серії (план Панаса не використовуємо для пози).
      // Предмет (keyObject) НЕ додаємо: руки ми й так зрізаємо.
      const g = await analyzeGanya(title, episodeText)
      poseFile = `${g.pose}.jpg`
      usedPose = g.pose
      scene = g.scene || title
      keyObject = null
      objectOwner = null
      // Різноманіття: фон/сезон/світло обираємо за seed (у Гані немає власного плану),
      // щоб портрети не повторювались — інший образ, ракурс, фон щоразу.
      const locKeys = Object.keys(LOCATION_PROMPTS)
      const seasonKeys = Object.keys(SEASON_PROMPTS)
      const gLoc = pickBySeed(locKeys, seed, 3)
      const gSeason = pickBySeed(seasonKeys, seed, 5)
      locationPrompt = LOCATION_PROMPTS[gLoc] || ''
      seasonPrompt = SEASON_PROMPTS[gSeason] || ''
      timePrompt = pickBySeed(SAFE_LIGHTING, seed, 7)
      usedLocation = gLoc
      usedSeason = gSeason
      usedTimeOfDay = 'seed'
    } else if (planRow) {
      // Панас із плану
      poseFile = `${planRow.pose}.jpg`
      usedPose = planRow.pose
      scene = planRow.scene_detail || title
      keyObject = planRow.key_object
      objectOwner = planRow.object_owner as 'self' | 'other' | null
    } else {
      // Панас fallback
      const fb = await analyzeSceneFallback(title, description || '')
      poseFile = POSE_FILES[Math.floor(Math.random() * POSE_FILES.length)] + '.jpg'
      usedPose = poseFile.replace(/\.jpg$/, '')
      scene = fb.scene
      keyObject = null
      objectOwner = null
    }

    // 2. Завантажити базову позу з папки відповідного героя
    const poseFolder = character === 'ganya' ? 'ganya-poses' : 'panas-poses'
    const imagePath = join(process.cwd(), 'public', poseFolder, poseFile)
    const imageBuffer = readFileSync(imagePath)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    // 3. Скласти промпт
    let objectPrefix = ''
    if (keyObject && objectOwner === 'other') {
      objectPrefix = `${keyObject} as a small detail at edge of frame, partially visible, hinting at another presence, `
    } else if (keyObject) {
      const poss = character === 'ganya' ? 'her' : 'his'
      objectPrefix = `${keyObject} clearly visible in ${poss} hands or directly beside ${character === 'ganya' ? 'her' : 'him'}, `
    }

    // Різноманітність обкладинок: ракурс + кадр завжди варіюємо за seed;
    // освітлення варіюємо, лише якщо план не задав власне (інакше поважаємо план).
    const lightingFinal = (timePrompt && timePrompt !== GOLDEN_HOUR_LIGHTING)
      ? timePrompt
      : pickBySeed(SAFE_LIGHTING, seed, 7)
    const framingFinal = pickBySeed(FRAMING_VARIANTS, seed, 13)
    const angleFinal   = pickBySeed(ANGLE_VARIANTS, seed, 29)

    // Збираємо промпт: scene → location → season → light → framing → angle
    const promptParts = [
      objectPrefix + scene,
      locationPrompt,
      seasonPrompt,
      lightingFinal,
      framingFinal,
      angleFinal,
    ].filter(Boolean).join(', ')
    const prompt = `${promptParts}, seed_${seed}`

    // 4. Викликати Replicate (Flux Kontext Pro)
    const replicateRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt, negative_prompt: NEGATIVE_PROMPT, input_image: base64Image, seed, guidance_scale: 7 } }),
      }
    )

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()

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

    // 5. Завантажити, обробити golden frame, залити в Storage
    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
    }
    const downloaded = Buffer.from(await imgRes.arrayBuffer())
    const rawBuffer = character === 'ganya' ? await cropAboveHands(downloaded) : downloaded
    const finalBuffer = await applyGoldenFrame(rawBuffer)

    const fileName = `${seriesId}-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    // 6. Записати cover_url + cover_meta в content
    const coverMeta = {
      character,
      pose: usedPose,
      location: usedLocation,
      season: usedSeason,
      timeOfDay: usedTimeOfDay,
      scene,
      keyObject,
      objectOwner,
      seed,
      fileName,
      generatedAt: new Date().toISOString(),
      fromPlan: !!planRow,
    }

    await supabase
      .from('content')
      .update({ cover_url: publicUrl, cover_meta: coverMeta })
      .eq('slug', seriesId)

    return NextResponse.json({
      url: publicUrl,
      character,
      fileName,
      scene,
      poseFile,
      keyObject,
      objectOwner,
      fromPlan: !!planRow,
      location: usedLocation,
      season: usedSeason,
      timeOfDay: usedTimeOfDay,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
