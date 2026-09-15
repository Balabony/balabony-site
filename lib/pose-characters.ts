// FILE: lib/pose-characters.ts
//
// КАНОН ПЕРСОНАЖІВ ДЛЯ ГЕНЕРАТОРА ПОЗ.
//
// Раніше цей канон жив двічі: app/api/admin/generate-panas-pose і
// generate-ganya-pose — два файли по ~195 рядків, у яких збігалося все, крім
// опису героя, переліку поз і папки. Будь-яка правда про потік (двокроковість,
// опитування Replicate, заливка в Storage) існувала у двох редакціях, і
// виправлення в одній мовчки не потрапляло в другу.
//
// ЩО НАВМИСНО НЕ ЗВЕДЕНО ДО СПІЛЬНОГО
// Промпти перенесені ДОСЛІВНО, разом із відмінностями, які на перший погляд
// виглядають як недогляд:
//   • POSE_TECH у Гані просить «slender build, small head», у Панаса —
//     «normal-length legs, lean build»; у Панаса ще й розгорнута заборона
//     декорацій (no house, no garden, no fence);
//   • еталон Гані знімається на повний зріст у 2:3, Панаса — поясним
//     портретом у 3:4.
// Обидва тексти вистраждані підбором: у Гані спідницю доводилося рятувати
// повним зростом, бо Kontext добудовував штани. Звести їх «до одного
// правильного» означало б наново ловити ті самі збої, тому тут вони лишаються
// різними — але в одному місці, де різницю видно.

export type PoseDef = { label: string; phrase: string }

export type CharacterConfig = {
  /** Ключ в адресі: ?character=panas */
  key: 'panas' | 'ganya'
  /** Як звати в інтерфейсі. */
  title: string
  /** Префікс файлів: public/<folder>/<filePrefix>-<pose>.jpg */
  folder: string
  filePrefix: string
  /** Тека в Storage для згенерованого. */
  genFolder: string
  /** Опис вигляду — «замок» обличчя й одягу. Можна перевизначити з UI. */
  defaultLook: string
  /** Технічні вимоги до кадру пози. */
  poseTech: string
  /** Готовий еталон, якщо він уже є (Панас). Порожньо — генеруємо з нуля. */
  defaultRefUrl: string
  /** Пропорції кадру для еталона й для пози. */
  refAspect: string
  poseAspect: string
  /** Як будується промпт еталона. */
  refPrompt: (look: string, seed: number) => string
  /** Початок промпта пози — тримає обличчя тим самим. */
  keepFacePrefix: string
  poses: Record<string, PoseDef>
}

// ── ПАНАС ───────────────────────────────────────────────────────────────────
// КАНОН (звірено з наявними позами): міцний сільський дід приблизно 63-65
// років, НЕ старезний; обличчя засмагле, бадьора весела усмішка; борода
// СЕРЕДНЬОЇ довжини, акуратна, СИВА З ТЕМНИМИ ПАСМАМИ (не суцільно біла, не
// довга патріаршна); коротке сиве волосся; вишиванка під темною жилеткою;
// маленький ДЕРЕВ'ЯНИЙ хрестик на шнурку (не золотий); плетений пояс.

const PANAS_LOOK =
  'a robust cheerful Ukrainian village grandfather, around 63 years old, NOT very old, ' +
  'sturdy and energetic, tanned weathered face with laugh lines and a lively warm smile, ' +
  'a medium-length neatly-trimmed beard that is grey mixed with darker strands ' +
  '(NOT a long fully-white patriarch beard), short greying hair, bright lively eyes, ' +
  'wearing a white embroidered Ukrainian shirt (vyshyvanka) with red-and-black ' +
  'embroidery at the collar, under a dark sleeveless waistcoat (zhyletka), ' +
  'a small plain WOODEN cross on a cord (not gold), a woven belt at the waist, ' +
  'photorealistic, cinematic warm soft lighting'

const PANAS_TECH =
  'full figure from head to feet, standing at full natural height, camera at eye level, ' +
  'realistic adult human body proportions, normal-length legs, lean build, head ' +
  'proportional to the body, dignified upright posture, well-formed hands with exactly ' +
  'five fingers on each hand and anatomically correct, entire body within frame, ' +
  'feet fully visible, never cropped at the knees or ankles, ' +
  'plain neutral seamless studio background, light grey backdrop, no scenery, ' +
  'no house, no garden, no flowers, no fence, soft even studio lighting, ' +
  'natural proportions, sharp focus, no text, no watermark'

// Фірмовий предмет Панаса — СИНІЙ БЛОКНОТ, куди він записує «винаходи».
const NOTEBOOK =
  'a dark navy-blue hardcover notebook (his trademark notebook for inventions and ' +
  'plans), held in his hand or tucked under his arm, clearly a small thick notebook, ' +
  'not a book, not a tablet, not a phone'

// Імена поз ТОЧНО збігаються з файлами public/panas-poses/panas-<key>.jpg —
// generate-cover шукає їх за цими іменами, перейменування ламає обкладинки.
const PANAS_POSES: Record<string, PoseDef> = {
  'walking':      { label: 'Йде',                 phrase: `walking forward calmly along, ${NOTEBOOK}` },
  'sitting':      { label: 'Сидить',              phrase: `sitting on a plain wooden bench, hands on knees, ${NOTEBOOK} beside him, calm` },
  'thinking':     { label: 'Думає',               phrase: `one hand at his chin in thought, looking up pondering, ${NOTEBOOK} in the other hand` },
  'back':         { label: 'Зі спини',            phrase: 'seen from behind, hands clasped behind his back, looking ahead, standing' },
  'crouching':    { label: 'Присів',              phrase: 'crouching down on his heels, examining something on the ground with curiosity' },
  'reaching':     { label: 'Тягнеться',           phrase: 'reaching out with one hand as if pointing or grasping something, engaged' },
  'lying':        { label: 'Лежить',              phrase: `lying back relaxed and content, looking up, ${NOTEBOOK} resting on his chest` },
  'running':      { label: 'Біжить',              phrase: 'hurrying forward in a brisk comic half-run, one arm swinging, eager' },
  'laughing':     { label: 'Сміється',            phrase: 'laughing heartily, head tilted slightly back, joyful open smile' },
  'reading':      { label: 'Читає',               phrase: 'reading an open newspaper held in both hands, focused, slight smile' },
  'window-night': { label: 'Біля вікна (ніч)',    phrase: 'standing thoughtfully as if by a window at night, lit by a single warm lamp, contemplative' },
  'digging':      { label: 'Копає',               phrase: 'kneeling on one knee, digging into the soil with a wooden-handled spade, determined' },
  'surprised':    { label: 'Здивований',          phrase: `eyes wide with surprise, both arms raised slightly, mouth open, ${NOTEBOOK} in one hand` },
  'praying':      { label: 'Молиться',            phrase: 'hands gently clasped together, head bowed, calm reverent expression' },
  'arguing':      { label: 'Сперечається',        phrase: `gesturing emphatically with one hand as if making a point, lively, ${NOTEBOOK} in the other` },
  'sleeping':     { label: 'Спить',               phrase: 'dozing peacefully sitting up, eyes closed, head tilted, content half-smile' },
  'notebook':     { label: 'Пише в блокноті',     phrase: `sitting and writing in ${NOTEBOOK} with a pen, focused and pleased with an idea` },
  'quarrel':      { label: 'Свариться',           phrase: 'both hands raised in animated mock-argument, eyebrows up, comic indignation' },
  'tree':         { label: 'Біля дерева',         phrase: 'standing relaxed with one hand resting against a plain tree trunk, easy smile' },
  'chickens':     { label: 'З курми',             phrase: 'crouching and offering a hand low as if feeding two hens at his feet, warm' },
  'neighbor':     { label: 'Із сусідом',          phrase: 'leaning on a plain wooden fence rail, talking warmly and gesturing, sociable' },
  'holding':      { label: 'Тримає предмет',      phrase: `holding ${NOTEBOOK} in both hands, examining it with curiosity` },
  'packages':     { label: 'З пакунками',         phrase: 'holding a small parcel or box in both hands, looking at it with curious anticipation' },
}

// ── ГАНЯ ────────────────────────────────────────────────────────────────────
// 12.08.2026: перший еталон виходив на 78-80 років — помітно старший за канонні
// 68 і за Панаса (63), хоча вони пара. Причина в самому слові «elderly»: без
// обмеження воно тягне генерацію в глибоку старість. Тому те саме заперечення,
// що працює в Панаса («NOT very old»), плюс «elderly» прибрано як слово.

const GANYA_LOOK =
  'a warm Ukrainian village grandmother, exactly 68 years old, NOT very old, ' +
  'NOT frail, still strong and active, upright and energetic posture, ' +
  'of average height and slender build, kind lively face with only light soft ' +
  'wrinkles and smooth full cheeks, healthy fresh complexion, gentle warm smile, ' +
  'hair still mostly dark brown with grey strands (NOT fully white), partly tucked ' +
  'under a floral headscarf (khustka), wearing a white ' +
  'embroidered Ukrainian blouse (vyshyvanka), a long dark skirt down to mid-calf ' +
  'and an apron over the skirt (NOT trousers), photorealistic, cinematic warm soft lighting'

const GANYA_TECH =
  'full figure from head to feet, standing at full natural height, camera at eye level, ' +
  'realistic adult human body proportions, long legs, slender build, small head ' +
  'relative to the body, dignified upright posture, well-formed hands with exactly ' +
  'five fingers on each hand and anatomically correct, entire body within frame, ' +
  'feet fully visible, never cropped at the knees or ankles, plain neutral studio ' +
  'background, soft even lighting, natural proportions, sharp focus, no text, no watermark'

// Фірмовий предмет Гані — дерев'яний ополоник.
// 12.08.2026: «two to three times longer than the bowl» модель прочитала як
// «чим довше, тим краще» — держак вийшов майже в зріст і вперся в підлогу,
// ставши схожим на ціпок, попри пряме «not a walking stick». Заперечення не
// працює, коли поруч стоїть відносна міра без стелі. Тому довжину прив'язано
// до передпліччя — це абсолютний орієнтир, який модель бачить у кадрі.
const LADLE =
  'a traditional Ukrainian wooden soup ladle (ополоник): a straight wooden handle ' +
  'about the length of her forearm — a short kitchen ladle that fits in one hand, ' +
  'NOT long, NOT a pole, NOT taller than her waist — ending in a deep round ' +
  'cup-shaped bowl (a small hemisphere for scooping soup), hand-carved warm-brown ' +
  'wood, the deep rounded bowl clearly visible; she holds it by the handle, ' +
  'the bowl pointing upward, the ladle raised clear of the ground and never ' +
  'touching the floor, clearly a kitchen ladle — not a walking stick, not a ' +
  'staff, not a broom, not a flat spoon, not a separate bowl'

const GANYA_POSES: Record<string, PoseDef> = {
  'standing':  { label: 'Стоїть (нейтральна)',    phrase: `standing calmly, facing the camera, one arm bent at the elbow holding ${LADLE} up at chest height, her arm NOT hanging down at her side` },
  'cooking':   { label: 'Готує (ополоник)',       phrase: `holding ${LADLE}, raised in one hand as if she has just stirred a dish, lively` },
  'notebook':  { label: 'Пише (записник)',        phrase: 'sitting at a wooden table, writing in a notebook with a pen, focused and content' },
  'reading':   { label: 'Читає',                  phrase: 'reading an open book, reading glasses low on her nose' },
  'talking':   { label: 'Розмовляє (жестикулює)', phrase: `talking and gesturing warmly with ${LADLE} in one hand` },
  'sitting':   { label: 'Сидить',                 phrase: 'sitting on a wooden bench, hands folded in her lap, calm' },
  'surprised': { label: 'Здивована',              phrase: 'eyes wide with surprise, one hand raised to her cheek' },
  'laughing':  { label: 'Сміється',               phrase: 'laughing warmly, head tilted slightly back, joyful' },
  'scolding':  { label: 'Свариться (мружить око)', phrase: `narrowing her eyes with a knowing skeptical look, one eyebrow slightly raised, both eyes open, playfully wagging ${LADLE}, mock-scolding` },
  'holding':   { label: 'Тримає предмет',         phrase: `holding ${LADLE} in both hands, examining it with curiosity` },
  'baking':    { label: 'Місить тісто',           phrase: 'kneading dough on a floured wooden table, sleeves rolled up' },
  'praying':   { label: 'Молиться',               phrase: 'hands gently together, calm reverent expression, eyes lowered' },
}

export const CHARACTERS: Record<string, CharacterConfig> = {
  panas: {
    key: 'panas',
    title: 'Дід Панас',
    folder: 'panas-poses',
    filePrefix: 'panas',
    genFolder: 'panas-gen',
    defaultLook: PANAS_LOOK,
    poseTech: PANAS_TECH,
    // Канонічний еталон Панаса вже існує — фото з public/panas-poses/.
    // Kontext бере це обличчя й ліпить кожну позу на чистому фоні.
    defaultRefUrl: 'https://balabony.com/panas-poses/panas-holding.jpg',
    refAspect: '3:4',
    poseAspect: '2:3',
    refPrompt: (look, seed) =>
      `${look}, head and shoulders portrait cropped at the chest, above the hands, ` +
      `hands not visible, facing the camera, realistic adult human proportions, ` +
      `plain neutral seamless studio background, light grey backdrop, soft even lighting, ` +
      `photorealistic, sharp focus, no text, no watermark, seed_${seed}`,
    keepFacePrefix: 'the same elderly Ukrainian grandfather, keep his face, beard and clothes identical, ',
    poses: PANAS_POSES,
  },
  ganya: {
    key: 'ganya',
    title: 'Баба Ганя',
    folder: 'ganya-poses',
    filePrefix: 'ganya',
    genFolder: 'ganya-gen',
    defaultLook: GANYA_LOOK,
    poseTech: GANYA_TECH,
    defaultRefUrl: '',
    refAspect: '2:3',
    poseAspect: '2:3',
    // Еталон Гані знімається на повний зріст навмисно: чого немає у вхідному
    // зображенні, те Kontext вигадує — і низ фігури приходив у штанях замість
    // спідниці. Модель тримається картинки сильніше, ніж тексту.
    refPrompt: (look, seed) =>
      `${look}, ${GANYA_TECH}, standing straight and facing the camera, ` +
      `arms relaxed at her sides, neutral pose, seed_${seed}`,
    keepFacePrefix: 'the same elderly Ukrainian grandmother, keep her face and clothes identical, ',
    poses: GANYA_POSES,
  },
}

/** Конфіг за ключем; невідомий ключ — null, щоб роут відповів 400, а не впав. */
export function getCharacter(key: string | null | undefined): CharacterConfig | null {
  if (!key) return null
  return CHARACTERS[key] ?? null
}

/** Перелік для перемикача в адмінці. */
export const CHARACTER_LIST = Object.values(CHARACTERS).map(c => ({ key: c.key, title: c.title }))
