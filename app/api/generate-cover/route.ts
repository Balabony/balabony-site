import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { applyGoldenFrame } from '@/lib/golden-frame'

// SDK-тип не має responseModalities/imageConfig — розширюємо локально
// (так само, як у /api/admin/tysha-trio-gemini).
type GenConfigWithModalities = GenerationConfig & {
  responseModalities?: string[]
  imageConfig?: { aspectRatio?: string }
}

// Генерація в Replicate триває 30-90 с (є цикл опитування до 30×3 с нижче),
// а Vercel за замовчуванням обриває функцію значно раніше — частина генерацій
// падала саме через це, а не через модель. 300 с — стеля Vercel Pro.
export const maxDuration = 300

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

const POSE_FILES = [
  'panas-walking', 'panas-sitting', 'panas-thinking', 'panas-back',
  'panas-crouching', 'panas-reaching', 'panas-lying', 'panas-running',
  'panas-laughing', 'panas-reading', 'panas-window-night', 'panas-digging',
  'panas-surprised', 'panas-praying', 'panas-arguing', 'panas-sleeping',
  'panas-notebook', 'panas-quarrel', 'panas-tree', 'panas-chickens',
  'panas-neighbor', 'panas-holding', 'panas-packages',
]

// ── ДВА ЕТАЛОНИ ОДЯГУ ПАНАСА (рішення Богдана 12.08.2026) ───────────────────
// Студійні пози в public/panas-poses зняті в ТЕМНІЙ безрукавці — це 'vest-black'
// і він лишається типовим. Оливковий жилет із ширшою вишивкою ('vest-olive')
// живе окремим еталонним кадром і вмикається явно, параметром outfit.
// Без цього розділення генерація тягне костюм із випадкового кадру, і на 102
// серіях набирається три різні лінійки Панаса замість однієї.
const PANAS_OUTFITS = {
  'vest-black': {
    prompt:
      'white embroidered shirt with a narrow red-and-black pattern on the collar and cuffs, ' +
      'dark sleeveless waistcoat, woven belt, small wooden cross on a cord, ' +
      'plain dark work trousers',
    reference: 'panas-reference-headshot.jpg',
  },
  'vest-olive': {
    prompt:
      'linen embroidered shirt with a wide red-and-black pattern across the chest and sleeves, ' +
      'olive-green sleeveless waistcoat, small wooden cross on a cord, ' +
      'plain olive-green work trousers',
    reference: 'panas-reference-olive.jpg',
  },
} as const

type PanasOutfit = keyof typeof PANAS_OUTFITS

const GANYA_OUTFIT =
  'embroidered blouse, dark skirt down to mid-calf, apron and floral headscarf'

// ── ЖИВІ ІСТОТИ В keyObject ─────────────────────────────────────────────────
// key_object у cover_plan задумувався як ПРЕДМЕТ (синій блокнот, глек, сокира),
// і формулювання «в руках або поруч» для предмета працює. Але в плані трапляються
// і тварини — страус, коза Манька, корова Лиса, кури. Прогін 13.08.2026 на s2e29
// показав, чим це закінчується: модель послухалась буквально й посадила страусеня
// в розгорнуту книжку, а на другому кадрі намалювала страуса на пів кадру.
// Тому тварин відокремлюємо: вони стоять на землі поруч, у природному масштабі,
// і ніколи не опиняються в руках.
const ANIMAL_ROOTS = [
  'страус', 'кіз', 'коза', 'козу', 'козою', 'цап',
  'коров', 'бик', 'теля', 'телят',
  'кур', 'куриц', 'півень', 'півня', 'квочк', 'курча',
  'гус', 'качк', 'індик', 'індич',
  'свин', 'порос', 'кабан',
  'кін', 'кон', 'лошат', 'осел',
  'пес', 'соба', 'цуцен', 'кіт', 'кот', 'кішк', 'кошен',
  'вівц', 'баран', 'ягн', 'кріл', 'заєц', 'зайц',
  'бджол', 'вул', 'лелек', 'бусол', 'голуб', 'ворон',
]

function isAnimal(word: string): boolean {
  const w = word.toLowerCase()
  return ANIMAL_ROOTS.some(root => w.includes(root))
}

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

const GOLDEN_HOUR_LIGHTING = TIME_OF_DAY_PROMPTS['golden-hour']

const SAFE_LIGHTING = [
  TIME_OF_DAY_PROMPTS['golden-hour'],
  TIME_OF_DAY_PROMPTS['morning'],
  TIME_OF_DAY_PROMPTS['midday'],
  TIME_OF_DAY_PROMPTS['overcast'],
]

// Було три варіанти, і всі три — по суті один і той самий портрет по груди.
// Через це обкладинки виходили одноманітними, а сильне наближення щоразу
// зрізало маківку (S1E6). Тепер це справжня шкала планів — від крупного до
// повного зросту — і в КОЖНОМУ явна вимога цілої голови. Що дальший план,
// то більший запас над головою, тож ризик обрізання падає сам собою.
const HEAD_SAFE = 'the entire head fully inside the frame with clear headroom above the hair, ' +
  'top of the head never touching or crossing the upper edge'

const FRAMING_VARIANTS = [
  // крупний — але з обов'язковим повітрям над головою
  `close portrait, head and shoulders, hands out of frame, ${HEAD_SAFE}, expressive well-lit face, softly blurred background, natural human proportions`,
  // поясний
  `upper-body portrait from the chest up, cropped above the hands, hands not visible, ${HEAD_SAFE}, face clearly visible and well lit, natural human proportions`,
  // до пояса, з руками
  `medium shot from the waist up, hands may be visible and well-formed, ${HEAD_SAFE}, face clearly visible, some of the surroundings visible behind, natural human proportions`,
  // три чверті фігури
  `three-quarter shot from the knees up, full torso visible, ${HEAD_SAFE}, figure occupying most of the frame height, location clearly readable behind, natural human proportions`,
  // повний зріст
  `full-length shot, entire figure from head to feet inside the frame, ${HEAD_SAFE}, feet fully visible and never cropped, the location clearly visible around the figure, natural human proportions`,
  // фігура в середовищі, ширше
  `wide environmental shot, the figure standing within the location and clearly recognisable, full body inside the frame, ${HEAD_SAFE}, surroundings occupying much of the frame, natural human proportions`,
]

// Для Gemini беремо лише ближчу половину шкали. Прогони 13.08.2026 показали,
// що на дальніх планах він відводить камеру ще далі, ніж просять, і обличчя
// стає нечитабельним на мініатюрі обкладинки. Панорами лишаємо Replicate.
const CLOSE_FRAMING_VARIANTS = FRAMING_VARIANTS.slice(0, 4)

const ANGLE_VARIANTS = [
  'facing the camera, frontal view, face clearly visible',
  'three-quarter view, body turned slightly to one side, face still toward camera',
  'turned slightly away, looking back over the shoulder toward the camera, face visible',
  'slight low camera angle, dignified grounded perspective, face clearly lit',
  'profile view from the side, face in clear silhouette against the light',
  'slightly elevated camera angle looking gently down, face still clearly visible',
  'seen from a short distance across the space, face readable, surroundings framing the figure',
  'off-centre composition, figure to one side of the frame, the location filling the rest',
]

function pickBySeed<T>(arr: T[], seed: number, salt: number): T {
  return arr[Math.floor(seed / salt) % arr.length]
}

const NEGATIVE_PROMPT = [
  'text', 'letters', 'words', 'captions', 'logos', 'watermarks', 'signatures',
  'typography', 'written words', 'BALABONI', 'БАЛАБОНИ', 'titles', 'subtitles',
  'label', 'labels', 'writing', 'font', 'alphabet', 'numbers', 'digits',
  'inscription', 'cyrillic letters', 'latin letters', 'foreign script',
  'gibberish text', 'ornamental text', 'decorative lettering', 'handwriting',
  'graffiti', 'newspaper text', 'poster text', 'overlaid text', 'burned-in text',
  'banner', 'headline', 'book title', 'book cover text', 'sign with text',
  'propaganda poster', 'political poster', 'soviet poster', 'wall poster',
  'hybrid tools', 'fused tools', 'merged tools', 'two tools combined into one',
  'shovel-hoe hybrid', 'malformed tool', 'impossible tool',
  'floating objects', 'levitating objects', 'objects in mid-air',
  'distorted hands', 'malformed hands', 'extra fingers', 'missing fingers',
  'fused fingers', 'extra limbs', 'extra arms', 'deformed anatomy',
  'hand merging with face', 'hand inside head', 'hand merged with object',
  'small figure', 'tiny person', 'dwarf proportions', 'doll-like proportions',
  'shrunken body', 'oversized head', 'tiny torso', 'miniature person',
  'distant figure', 'subject too small', 'figure lost in scene',
  'picture-in-picture', 'frame within frame', 'photo inside photo',
  'image within image', 'mise en abyme',
  'pure back view on dark background', 'lonely silhouette no context',
  'cropped head', 'head cut off', 'top of head cut off', 'headless',
  'face out of frame', 'head above the frame', 'forehead cut by frame edge',
  'skull cropped', 'hair cut by upper edge', 'decapitated framing',
  'cropped legs', 'legs cut off', 'feet cut off', 'cut-off feet',
  'amputated legs', 'amputated feet', 'figure cropped at the knees',
  'cropped at the ankles', 'cropped at the shins', 'limbs cut by frame edge',
  'feet outside the frame', 'awkward body crop',
  'blue jeans', 'denim', 'denim trousers', 'modern jeans', 'sportswear',
  'tracksuit', 'sneakers', 'modern casual clothes', 'contemporary streetwear',
  'animal held in hands', 'animal inside a book', 'animal in a basket',
  'drawing of an animal', 'illustration of an animal', 'picture of an animal',
  'animal on a book page', 'animal poster', 'animal statue', 'toy animal',
  'open book in hands', 'open album in hands', 'illustrated page',
  'oversized animal', 'giant animal', 'animal larger than the person',
  'animal covering the face', 'stuffed animal',
  'unrequested bystanders', 'random crowd', 'group of onlookers',
  'extra people in the background', 'audience watching',
  'blurry face', 'plastic skin', 'doll face', 'wax figure', 'mannequin',
  'low quality', 'jpeg artifacts', 'oversaturated',
].join(', ')

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

const GANYA_POSE_FILES = [
  'ganya-standing', 'ganya-cooking', 'ganya-notebook', 'ganya-reading',
  'ganya-talking', 'ganya-sitting', 'ganya-surprised', 'ganya-laughing',
  'ganya-scolding', 'ganya-holding', 'ganya-baking', 'ganya-praying',
]

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

// ── ДРУГИЙ РУШІЙ: GEMINI (gemini-2.5-flash-image, «Nano Banana») ────────────
// Причина появи: flux-kontext-pro приймає рівно ОДНЕ input_image і при кількох
// суб'єктах у кадрі перемальовує обличчя (парний тест 12.08.2026 провалено).
// Gemini бере КІЛЬКА референсів одночасно, тож ним можна тримати обличчя з
// еталона окремо від пози й додавати другого суб'єкта (напр. козу Маньку).
// Replicate лишається типовим — на ньому зав'язані пози, cropAboveHands,
// golden frame і cover_meta, і поки він не переміряний, з нього не з'їжджаємо.
function inlineFromFile(path: string) {
  return {
    inlineData: {
      data: readFileSync(path).toString('base64'),
      mimeType: 'image/jpeg',
    },
  }
}

// negative_prompt у Gemini немає — заборони доводиться проговорювати текстом.
const GEMINI_AVOID =
  'No blue jeans, no denim, no sportswear, no sneakers, no modern casual clothes. ' +
  'No radiators, no plastic windows, no factory curtains, no laminate flooring, ' +
  'no modern city apartment interiors. ' +
  'Natural human proportions, well-formed hands, no extra fingers or limbs. ' +
  'Any animal in the scene is a real living animal standing on the ground in correct natural scale — ' +
  'never held in the hands, never inside a book or container, never oversized, ' +
  'and never replaced by a drawing, illustration, photograph or statue of that animal. ' +
  'Do not add any people who are not described in the scene: no bystanders, no crowd, no onlookers. ' +
  'FRAMING IS CRITICAL: the man is close to the camera and fills a large part of the frame. ' +
  'Frame him from the knees up or closer — never a distant or wide establishing shot, ' +
  'never a small figure lost in the landscape. His face must be large enough to read clearly ' +
  'when the image is shown as a small thumbnail. ' +
  'Do not crop the head: the whole head stays inside the frame with clear headroom above the hair.'

// Заборона тексту стоїть ОКРЕМО і йде ОСТАННІМ рядком промпту. Коли вона була
// першою фразою в загальному списку заборон, її вагу розмивало рештою абзацу:
// прогін 13.08.2026 на s2e29 дав псевдокирилицю на обкладинці блокнота, хоча
// «no text» у промпті було. Останню інструкцію модель тримає найкраще, тож
// текстову заборону дублюємо в кінці й проговорюємо конкретно про обкладинки.
const GEMINI_NO_TEXT =
  'CRITICAL, applies to the whole image: there must be NO writing of any kind. ' +
  'No letters, no words, no numbers, no captions, no logos, no watermarks, no signatures. ' +
  'Any book, notebook, album, sign, package or label visible in the scene has a ' +
  'completely BLANK, smooth, unmarked surface — no title, no lettering, no printed text, ' +
  'no embossed characters, no invented or gibberish script of any alphabet. ' +
  'If a notebook or book appears, show it plain and unlettered.'

async function generateWithGemini(opts: {
  apiKey: string
  posePath: string
  referencePath: string | null
  extraRefPath: string | null
  prompt: string
  outfitPrompt: string
}): Promise<Buffer> {
  const genAI = new GoogleGenerativeAI(opts.apiKey)
  const generationConfig: GenConfigWithModalities = {
    responseModalities: ['Image'],
    imageConfig: { aspectRatio: '1:1' },
  }
  const model = genAI.getGenerativeModel(
    { model: 'gemini-2.5-flash-image', generationConfig },
    { apiVersion: 'v1beta' },
  )

  const parts: Array<Record<string, unknown>> = []

  parts.push({
    text:
      'Create ONE new photorealistic photograph of an elderly Ukrainian village man. ' +
      'You are given reference photographs below. Use them ONLY for identity and wardrobe: ' +
      'the SAME face, the same beard and hair, the same clothes. ' +
      'Do NOT copy the reference framing, background or studio lighting — ' +
      'build a completely new scene as described. ' +
      `Wardrobe (must match the references exactly): ${opts.outfitPrompt}. ` +
      `Scene: ${opts.prompt}. ` +
      GEMINI_AVOID,
  })

  if (opts.referencePath) {
    parts.push({ text: 'Reference — his face and clothing (identity):' })
    parts.push(inlineFromFile(opts.referencePath))
  }
  parts.push({ text: 'Reference — the body pose to reproduce (ignore its grey studio background):' })
  parts.push(inlineFromFile(opts.posePath))
  if (opts.extraRefPath) {
    parts.push({ text: 'Reference — the second subject that must also appear in the scene:' })
    parts.push(inlineFromFile(opts.extraRefPath))
  }

  // Останній блок промпту — саме тут заборона тексту тримається найкраще.
  parts.push({ text: GEMINI_NO_TEXT })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: parts as never }],
  })

  const candidates = result.response?.candidates ?? []
  for (const cand of candidates) {
    for (const part of cand.content?.parts ?? []) {
      const inline = (part as { inlineData?: { data?: string } }).inlineData
      if (inline?.data) return Buffer.from(inline.data, 'base64')
    }
  }
  throw new Error('Gemini не повернув зображення')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { seriesId, title, description } = body

    if (!seriesId || !title) {
      return NextResponse.json({ error: 'seriesId and title are required' }, { status: 400 })
    }

    // Рушій генерації. Типовий — replicate; gemini вмикається явно.
    const rawEngine = String(body.engine || 'replicate').toLowerCase()
    if (rawEngine !== 'replicate' && rawEngine !== 'gemini') {
      return NextResponse.json(
        { error: `Невідомий engine: ${rawEngine}. Дозволено replicate або gemini.` },
        { status: 400 },
      )
    }
    const engine: 'replicate' | 'gemini' = rawEngine

    // dryRun: згенерувати й покласти у Storage, але НЕ чіпати content.
    // Gemini дає помітний розкид між прогонами на тому самому промпті, тож
    // робочий режим — зробити 2-3 варіанти й вибрати очима. Без цього прапорця
    // кожна проба одразу міняла обкладинку на живому сайті.
    const dryRun = body.dryRun === true

    const token = process.env.REPLICATE_API_TOKEN
    const geminiKey = process.env.GEMINI_API_KEY
    if (engine === 'replicate' && !token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }
    if (engine === 'gemini' && !geminiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
    }

    const supabase = getSupabaseAdmin()

    const { data: planRow } = await supabase
      .from('cover_plan')
      .select('*')
      .eq('slug', seriesId)
      .single()

    let episodeText = (description || '').trim()
    if (!episodeText) {
      const { data: c } = await supabase
        .from('content').select('corrected_text').eq('slug', seriesId).single()
      episodeText = (c?.corrected_text || '').trim()
    }

    const requested = String(body.character || '').toLowerCase()
    let character: 'panas' | 'ganya' = 'panas'
    if (requested === 'panas' || requested === 'ganya') character = requested
    else if (requested === 'auto') character = await detectProtagonist(title, episodeText)

    // Явно задана поза (body.pose, напр. 'ganya-baking') має пріоритет над тим,
    // що вибере analyzeGanya.
    //
    // 12.08.2026: у Гані реально існує 5 файлів із 12 перелічених у каталозі
    // промпту, тож модель регулярно просить відсутню (найчастіше cooking) і
    // серія падає на запасну standing. Коли Ганю ставлять на кілька серій
    // поспіль, половина обкладинок виходить тим самим кадром. Ручний вибір
    // дозволяє розвести серії по різних наявних позах.
    // Приймається тільки поза, файл якої справді лежить у public/<folder>-poses:
    // мовчазна підміна неіснуючої на standing — це те, від чого ми тут і тікаємо.
    const poseFolderName = character === 'ganya' ? 'ganya-poses' : 'panas-poses'
    let forcedPose: string | null = null
    const rawPose = String(body.pose || '').trim().replace(/\.jpg$/i, '')
    if (rawPose) {
      if (!existsSync(join(process.cwd(), 'public', poseFolderName, `${rawPose}.jpg`))) {
        return NextResponse.json(
          { error: `Поза ${rawPose}.jpg відсутня в ${poseFolderName}` },
          { status: 400 },
        )
      }
      forcedPose = rawPose
    }

    // Еталон одягу. Для Гані вибору поки немає — у неї один канонний костюм.
    const rawOutfit = String(body.outfit || 'vest-black').trim()
    if (character === 'panas' && !(rawOutfit in PANAS_OUTFITS)) {
      return NextResponse.json(
        { error: `Невідомий outfit: ${rawOutfit}. Дозволено vest-black або vest-olive.` },
        { status: 400 },
      )
    }
    const outfit = rawOutfit as PanasOutfit

    // Другий суб'єкт у кадрі (коза Манька, сусід тощо) — лише для Gemini:
    // flux-kontext приймає одне зображення і другого суб'єкта не витягує.
    let extraRefPath: string | null = null
    const rawExtraRef = String(body.extraRef || '').trim().replace(/\.jpg$/i, '')
    if (rawExtraRef) {
      if (engine !== 'gemini') {
        return NextResponse.json(
          { error: 'extraRef підтримує лише engine=gemini' },
          { status: 400 },
        )
      }
      if (!/^[a-z0-9-]+$/i.test(rawExtraRef)) {
        return NextResponse.json({ error: 'Некоректне ім\'я extraRef' }, { status: 400 })
      }
      const candidate = join(process.cwd(), 'public', 'refs', `${rawExtraRef}.jpg`)
      if (!existsSync(candidate)) {
        return NextResponse.json(
          { error: `Референс ${rawExtraRef}.jpg відсутній у public/refs` },
          { status: 400 },
        )
      }
      extraRefPath = candidate
    }

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
      const g = await analyzeGanya(title, episodeText)
      const chosen = forcedPose || g.pose
      poseFile = `${chosen}.jpg`
      usedPose = chosen
      scene = g.scene || title
      keyObject = null
      objectOwner = null
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
      const chosen = forcedPose || planRow.pose
      poseFile = `${chosen}.jpg`
      usedPose = chosen
      scene = planRow.scene_detail || title
      keyObject = planRow.key_object
      objectOwner = planRow.object_owner as 'self' | 'other' | null
    } else {
      const fb = await analyzeSceneFallback(title, description || '')
      poseFile = (forcedPose || POSE_FILES[Math.floor(Math.random() * POSE_FILES.length)]) + '.jpg'
      usedPose = poseFile.replace(/\.jpg$/, '')
      scene = fb.scene
      keyObject = null
      objectOwner = null
    }

    // ── SEED-FALLBACK ЛОКАЦІЇ/СЕЗОНУ (для Панаса, як уже зроблено для Гані) ──
    // Базові пози тепер на ЧИСТОМУ студійному фоні. Якщо план не задав локацію/
    // сезон (поле порожнє у cover_plan або серії немає в плані) — обираємо їх за
    // seed, щоб kontext наклав РІЗНИЙ фон, а не лишав сіру студію.
    if (!locationPrompt) {
      const locKeys = Object.keys(LOCATION_PROMPTS)
      const k = pickBySeed(locKeys, seed, 3)
      locationPrompt = LOCATION_PROMPTS[k] || ''
      usedLocation = k
    }
    if (!seasonPrompt) {
      const seasonKeys = Object.keys(SEASON_PROMPTS)
      const k = pickBySeed(seasonKeys, seed, 5)
      seasonPrompt = SEASON_PROMPTS[k] || ''
      usedSeason = k
    }

    const poseFolder = character === 'ganya' ? 'ganya-poses' : 'panas-poses'

    // Обрана поза може бути відсутня на диску: каталог у промпті перелічує всі
    // 12 поз, але у public/ лежать лише ті, що реально згенеровані й пройшли
    // відбір за каноном (12.08.2026: у Гані відібрано 5 із 12 — решта вийшли
    // у штанах замість спідниці). Без цієї перевірки readFileSync кидав виняток
    // і генерація обкладинки падала з 500, щойно Claude вибирав відсутню позу.
    // Запасна — нейтральна standing, вона є завжди.
    const fallbackPose = character === 'ganya' ? 'ganya-standing.jpg' : 'panas-walking.jpg'
    let imagePath = join(process.cwd(), 'public', poseFolder, poseFile)
    if (!existsSync(imagePath)) {
      console.warn(`[generate-cover] поза ${poseFile} відсутня в ${poseFolder} — беру ${fallbackPose}`)
      imagePath = join(process.cwd(), 'public', poseFolder, fallbackPose)
    }
    const imageBuffer = readFileSync(imagePath)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    let objectPrefix = ''
    if (keyObject && isAnimal(keyObject)) {
      // Тварина: на землі, поруч, у природному масштабі. Ніколи в руках.
      //
      // Прогін 13.08.2026 показав обхідний шлях: заборонивши тварину В книжці,
      // модель намалювала тварину НА сторінці книжки — формально не порушивши
      // умову. Причина в тому, що в еталонах Панас майже завжди з синім
      // блокнотом, і «страус» + «блокнот» зчіплюються в ілюстрований альбом.
      // Тому вимагаємо саме ЖИВУ істоту і прибираємо з рук розгорнуту книжку.
      const him = character === 'ganya' ? 'her' : 'him'
      const his = character === 'ganya' ? 'her' : 'his'
      objectPrefix =
        `a real live ${keyObject} physically present in the scene, standing on the ground ` +
        `beside ${him} at a natural distance, shown in correct natural scale, ` +
        `never held in ${his} hands, never inside a book, basket or any container, ` +
        `not larger than ${him}, not covering ${his} face, ` +
        `the ${keyObject} must be a living animal in the scene, ` +
        `NOT a drawing, illustration, photograph, painting, poster or statue of one, ` +
        `and ${his} hands hold no open book or album, `
    } else if (keyObject && objectOwner === 'other') {
      objectPrefix = `${keyObject} as a small detail at edge of frame, partially visible, hinting at another presence, `
    } else if (keyObject) {
      const poss = character === 'ganya' ? 'her' : 'his'
      objectPrefix = `${keyObject} clearly visible in ${poss} hands or directly beside ${character === 'ganya' ? 'her' : 'him'}, `
    }

    const lightingFinal = (timePrompt && timePrompt !== GOLDEN_HOUR_LIGHTING)
      ? timePrompt
      : pickBySeed(SAFE_LIGHTING, seed, 7)
    const framingFinal = engine === 'gemini'
      ? pickBySeed(CLOSE_FRAMING_VARIANTS, seed, 13)
      : pickBySeed(FRAMING_VARIANTS, seed, 13)
    const angleFinal   = pickBySeed(ANGLE_VARIANTS, seed, 29)

    // Одяг персонажа НЕ описувався в промпті взагалі — малося на увазі, що він
    // прийде з вхідної пози. Але flux-kontext перемальовує фігуру і вбирає діда
    // на власний розсуд: на прогоні 12.08.2026 третина обкладинок вийшла з
    // Панасом у синіх джинсах, що суперечить канону (вишиванка, темна жилетка,
    // плетений пояс). Тому одяг фіксуємо явно, посилаючись на вхідне зображення.
    const outfitPrompt = character === 'ganya'
      ? GANYA_OUTFIT
      : PANAS_OUTFITS[outfit].prompt
    const wardrobe =
      'keeping exactly the same traditional clothes as in the reference image: ' + outfitPrompt

    const promptParts = [
      objectPrefix + scene,
      locationPrompt,
      seasonPrompt,
      wardrobe,
      lightingFinal,
      framingFinal,
      angleFinal,
    ].filter(Boolean).join(', ')
    const prompt = `${promptParts}, seed_${seed}`

    let downloaded: Buffer

    if (engine === 'gemini') {
      // Еталон обличчя й одягу передається ОКРЕМИМ зображенням — саме цим
      // Gemini і відрізняється від kontext: поза береться з одного кадру,
      // ідентичність з другого, і вони не змішуються.
      let referencePath: string | null = null
      if (character === 'panas') {
        const refName = PANAS_OUTFITS[outfit].reference
        const refCandidate = join(process.cwd(), 'public', 'panas-poses', refName)
        if (!existsSync(refCandidate)) {
          return NextResponse.json(
            { error: `Еталон ${refName} відсутній у public/panas-poses` },
            { status: 400 },
          )
        }
        referencePath = refCandidate
      }

      try {
        downloaded = await generateWithGemini({
          apiKey: geminiKey as string,
          posePath: imagePath,
          referencePath,
          extraRefPath,
          prompt,
          outfitPrompt,
        })
      } catch (e) {
        return NextResponse.json({ error: `Gemini error: ${String(e)}` }, { status: 502 })
      }
    } else {
      const replicateRes = await fetch(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token as string}`,
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
            headers: { Authorization: `Bearer ${token as string}` },
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

      const imgRes = await fetch(generatedUrl)
      if (!imgRes.ok) {
        return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
      }
      downloaded = Buffer.from(await imgRes.arrayBuffer())
    }
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

    // Перед перезаписом запам'ятовуємо чинну обкладинку. Сам файл у Storage
    // не зникає (ім'я унікальне за таймстампом), але посилання на нього в БД
    // затирається — без цього відкотити невдалу генерацію не було б чим.
    const { data: prevRow } = await supabase
      .from('content').select('cover_url').eq('slug', seriesId).single()
    const previousUrl: string | null = prevRow?.cover_url ?? null

    const coverMeta = {
      character,
      engine,
      outfit: character === 'panas' ? outfit : null,
      extraRef: rawExtraRef || null,
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
      previousUrl,
    }

    if (!dryRun) {
      await supabase
        .from('content')
        .update({ cover_url: publicUrl, cover_meta: coverMeta })
        .eq('slug', seriesId)
    }

    return NextResponse.json({
      url: publicUrl,
      dryRun,
      character,
      engine,
      outfit: character === 'panas' ? outfit : null,
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
