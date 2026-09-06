import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isAdminRequest } from '@/lib/require-admin'

// =============================================================================
// КАТАЛОГ ПОЗ (22 існуючі. Коли додасте нові — допишіть сюди.)
// =============================================================================
const POSES: Record<string, string> = {
  'panas-walking':       'іде кудись, подорож, прогулянка',
  'panas-sitting':       'сидить, відпочиває, розмірковує спокійно',
  'panas-thinking':      'думає, вирішує задачу, здивований ситуацією',
  'panas-back':          'дивиться вдалину, чекає, спостерігає, самотність',
  'panas-crouching':     'щось розглядає на землі, городні роботи, пошук',
  'panas-reaching':      'тягнеться до чогось високого, дістає з полиці',
  'panas-lying':         'відпочиває на природі, дивиться в небо, мріє',
  'panas-running':       'тікає, женеться, поспішає, щось термінове',
  'panas-laughing':      'радість, кумедна ситуація, гумор, успіх',
  'panas-reading':       'читає, вивчає щось, вечірня сцена',
  'panas-window-night':  'нічна сцена, безсоння, очікування, туга',
  'panas-digging':       'копає, садить, ховає, знаходить у землі',
  'panas-surprised':     'шок, несподівана подія, відкриття, переляк',
  'panas-praying':       'молитва, вдячність, горе, духовний момент',
  'panas-arguing':       'конфлікт, суперечка, відстоює позицію',
  'panas-sleeping':      'втомився, дрімає, сни, ліниво',
  'panas-notebook':      'пише, планує, винаходить, веде записи',
  'panas-quarrel':       'гаряча сварка, злість, скандал',
  'panas-tree':          'пригода, ховається, застряг, дитячий момент',
  'panas-chickens':      'фермерський побут, тварини, щоденна рутина',
  'panas-neighbor':      'плітки, розмова через тин, сусідська комунікація',
  'panas-holding':       "знахідка, розглядає об'єкт, отримав подарунок",
  // TODO: додати нові пози після їх генерації:
  // 'panas-at-table', 'panas-with-phone', 'panas-with-paper', 'panas-with-gany',
  // 'panas-celebrating', 'panas-with-musician', 'panas-on-bicycle', 'panas-at-church',
  // 'panas-arms-crossed', 'panas-pointing', 'panas-on-stool', 'panas-with-tools',
  // 'panas-fixing', 'panas-toasting', 'panas-with-official', 'panas-in-storm',
  // 'panas-pondering-night', 'panas-with-livestock',
}

// =============================================================================
// КАТАЛОГ ЛОКАЦІЙ (35)
// =============================================================================
const LOCATIONS: Record<string, string> = {
  // Хата і подвір'я
  'old-house-interior': 'стара українська хата зсередини, піч-побілка, ікони, дерев\'яні балки',
  'old-house-exterior': 'біла мазана хата ззовні, солом\'яний дах',
  'kitchen-rustic':     'сільська кухня, дерев\'яний стіл, миски, рушники',
  'summer-kitchen':     'літня кухня окремо від хати, відкритий вогонь',
  'entry-hall':         'сіни, чоботи, мішки, скриня, ікона над дверима',
  'attic':              'горище, павутиння, старі речі, скрині',
  'yard':               'подвір\'я з лавкою під деревом, паркан',
  'porch':              'ґанок з різьбленням, столик',
  'gate':               'біля воріт, дерев\'яні стовпи',
  // Господарство
  'garden':             'город, грядки, картопля, помідори',
  'orchard':            'садок з яблунями і вишнями',
  'vineyard':           'виноградник, лоза, грона',
  'chicken-coop':       'курник, кури, насест',
  'barn':               'хлів, сіно, корова, ясла',
  'cellar':             'погріб, банки на полицях, бочки, темно',
  'well':               'колодязь з журавлем, дерев\'яне відро',
  'woodpile':           'дровітня, дрова стосом, сокира',
  'bee-yard':           'пасіка, вулики',
  // Поле і природа
  'field':              'поле, нива, простір до горизонту',
  'meadow':             'луг, дикі квіти',
  'haystacks':          'копиці сіна, граблі',
  'forest-edge':        'край лісу, гриби, сутінь',
  'forest-deep':        'глибокий ліс, мох, папороть',
  'river-pond':         'річка або ставок, місток, очерет',
  'windmill':           'старий вітряний млин',
  // Село — громадські місця
  'village-road':       'сільська ґрунтова дорога, тин уздовж',
  'village-square':     'центр села, площа, лавки',
  'church-yard':        'біля церкви, маківки',
  'village-club':       'будинок культури, плакати',
  'shop-front':         'сільський магазин, вивіска, ґанок',
  'bus-stop':           'автобусна зупинка',
  'cemetery':           'сільський цвинтар, хрести, рушники',
  'school':             'стара сільська школа',
  'post-office':        'пошта, поштова скринька',
  'bridge':             'дерев\'яний місток над струмком',
}

// =============================================================================
// СЕЗОНИ І ЧАС ДОБИ
// =============================================================================
const SEASONS = ['spring', 'summer', 'autumn', 'winter']
const TIME_OF_DAY = ['golden-hour', 'morning', 'night']

const POSE_NAMES = Object.keys(POSES)
const LOCATION_NAMES = Object.keys(LOCATIONS)

// =============================================================================
// КОНФІГ ПЛАНУВАЛЬНИКА
// =============================================================================
const MAX_POSE_REPEATS = 3        // максимум серій на одну позу
const TEXT_EXCERPT_WORDS = 500    // скільки слів тексту відправляти в Haiku

// =============================================================================
// ТИП ВІДПОВІДІ ВІД HAIKU
// =============================================================================
type AnalyzeResult = {
  poseTop3: string[]
  location: string
  season: string
  timeOfDay: string
  sceneDetail: string
  keyObject: string | null
  objectOwner: 'self' | 'other' | null
}

async function analyzeForPlanning(
  client: Anthropic,
  slug: string,
  title: string,
  textExcerpt: string,
): Promise<AnalyzeResult | null> {
  const posesList = POSE_NAMES.map(p => `- ${p}: ${POSES[p]}`).join('\n')
  const locationsList = LOCATION_NAMES.map(l => `- ${l}: ${LOCATIONS[l]}`).join('\n')

  const prompt = `Ти плануєш візуальну обкладинку для серії українського гумористичного серіалу про діда Панаса з села Балабони. Прочитай текст серії та обери компоненти обкладинки.

ДОСТУПНІ ПОЗИ ПАНАСА:
${posesList}

ДОСТУПНІ ЛОКАЦІЇ (фон):
${locationsList}

СЕЗОНИ: spring, summer, autumn, winter
ЧАС ДОБИ: golden-hour (вечір), morning (ранок), night (ніч)

ЗАВДАННЯ:
Поверни валідний JSON БЕЗ пояснень:
{
  "poseTop5": ["<найкраща поза>", "<2-й варіант>", "<3-й>", "<4-й>", "<5-й>"],
  "location": "<одна локація>",
  "season": "<сезон>",
  "timeOfDay": "<час доби>",
  "sceneDetail": "<одне речення до 15 слів: конкретна дія Панаса в кадрі>",
  "keyObject": "<предмет-символ серії, 1-5 слів, або null>",
  "objectOwner": "self" або "other" або null
}

ВАЖЛИВО:
- poseTop5: 5 РІЗНИХ поз, ранжовані від найкращої до найгіршої. ОБОВ'ЯЗКОВО використовуй РІЗНОМАНІТТЯ — не пиши лише thinking/sitting/notebook у всі позиції. Якщо хоч якось пасують walking, holding, surprised, neighbor, digging, reaching, crouching, laughing, arguing, quarrel, praying, lying, sleeping, window-night, back, running, reading, tree, chickens, packages — включай їх у топ-5. Краще нестандартна, але правдоподібна поза, ніж 5 разів thinking.
- За що обирати позу: КОНКРЕТНА ДІЯ в кадрі, не "настрій". "Думає" — це майже завжди не дія. Що Панас РОБИТЬ фізично? Чи розмовляє через тин (neighbor)? Чи копається в землі (digging/crouching)? Чи щось тримає в руках (holding)? Чи сваритиметься з кимось (quarrel/arguing)? Чи здивовано на щось дивиться (surprised)?
- location: НЕ за замовчуванням 'yard'. Обери конкретно за сюжетом: чи це город, кухня, погріб, клуб, церква, поле, дорога, шинок?
- season + timeOfDay: відповідай реальності серії якщо вказана; інакше — додай різноманітності
- sceneDetail: тільки те що бачимо в кадрі; без імен інших персонажів
- keyObject: предмет, який можна намалювати поруч з Панасом (планшет, лист, чарка, баян, дрон, банка...). Не вигадуй якщо немає очевидного.
- objectOwner: self = у руках Панаса; other = на краю кадру, натяк на іншого; null = немає предмета

СЕРІЯ: ${title} (${slug})

ТЕКСТ:
${textExcerpt}`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Валідація — підтримуємо poseTop5 (новий) і poseTop3 (старий) для зворотньої сумісності
    const rawPoses = parsed.poseTop5 || parsed.poseTop3 || []
    const poseTop3: string[] = (Array.isArray(rawPoses) ? rawPoses : [])
      .map((p: string) => String(p).replace(/\.jpg$/, ''))
      .filter((p: string) => POSE_NAMES.includes(p))
    if (poseTop3.length === 0) return null

    const location = LOCATION_NAMES.includes(parsed.location) ? parsed.location : 'yard'
    const season = SEASONS.includes(parsed.season) ? parsed.season : 'summer'
    const timeOfDay = TIME_OF_DAY.includes(parsed.timeOfDay) ? parsed.timeOfDay : 'golden-hour'
    const sceneDetail = String(parsed.sceneDetail || '').trim() || title
    const keyObject = parsed.keyObject && parsed.keyObject !== 'null'
      ? String(parsed.keyObject).trim()
      : null
    const objectOwner = keyObject
      ? (parsed.objectOwner === 'other' ? 'other' : 'self')
      : null

    return { poseTop3, location, season, timeOfDay, sceneDetail, keyObject, objectOwner }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    // Rate limit треба пробросити нагору щоб ретраїти з паузою
    if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
      throw err
    }
    console.error(`analyzeForPlanning failed for ${slug}:`, err)
    return null
  }
}

// =============================================================================
// ENDPOINT
// =============================================================================
export async function POST(req: NextRequest) {
  // Роут викликає платні зовнішні моделі, тому доступний лише адмінові.
  // Раніше був відкритий: будь-хто ззовні міг палити бюджет генерацій.
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const dryRun: boolean = body?.dryRun === true

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
    }
    const client = new Anthropic({ apiKey: anthropicKey })
    const supabase = getSupabaseAdmin()

    // 1. Завантажити всі 80 серій
    const { data: series, error: selErr } = await supabase
      .from('content')
      .select('slug, title, corrected_text, season_number, episode_number')
      .eq('type', 'balabony')
      .order('season_number')
      .order('episode_number')

    if (selErr || !series) {
      return NextResponse.json({ error: `DB error: ${selErr?.message}` }, { status: 500 })
    }

    const episodes = series.filter(s => /^s[1-4]e\d+$/.test(s.slug || ''))
    console.log(`Planning for ${episodes.length} episodes...`)

    // 2. Викликати Haiku послідовно (rate limit 50K tokens/min, ~3K tokens на запит).
    // Затримка 1500ms між запитами + retry при rate_limit_error.
    const analyses: Record<string, AnalyzeResult> = {}
    const failures: string[] = []

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i]
      const words = (ep.corrected_text || '').split(/\s+/).slice(0, TEXT_EXCERPT_WORDS).join(' ')

      let attempts = 0
      let res: AnalyzeResult | null = null
      while (attempts < 3) {
        try {
          res = await analyzeForPlanning(client, ep.slug, ep.title, words)
          break
        } catch (err: unknown) {
          // analyzeForPlanning ловить помилки сама і повертає null, але про всяк
          attempts++
          const errMsg = err instanceof Error ? err.message : String(err)
          if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
            console.log(`Rate limit on ${ep.slug}, waiting 65s...`)
            await sleep(65000)
          } else {
            console.error(`${ep.slug} attempt ${attempts} failed:`, errMsg)
            await sleep(2000)
          }
        }
      }

      if (res) analyses[ep.slug] = res
      else failures.push(ep.slug)

      console.log(`Analyzed ${i + 1}/${episodes.length} (${ep.slug})`)

      // Пауза між запитами щоб залишатися в межах rate limit
      if (i < episodes.length - 1) {
        await sleep(1500)
      }
    }

    // 3. Жадібний алгоритм призначення поз з лімітом MAX_POSE_REPEATS
    const poseUsage: Record<string, number> = {}
    const plan: Record<string, AnalyzeResult & { assignedPose: string }> = {}
    const unassigned: string[] = []

    // Сортуємо серії так щоб ті у кого вузький вибір (мало варіантів) йшли першими
    const ordered = episodes
      .map(ep => ({ slug: ep.slug, analysis: analyses[ep.slug] }))
      .filter(x => x.analysis)
      .sort((a, b) => a.analysis!.poseTop3.length - b.analysis!.poseTop3.length)

    for (const { slug, analysis } of ordered) {
      let assigned: string | null = null
      for (const pose of analysis!.poseTop3) {
        if ((poseUsage[pose] || 0) < MAX_POSE_REPEATS) {
          assigned = pose
          poseUsage[pose] = (poseUsage[pose] || 0) + 1
          break
        }
      }
      if (assigned) {
        plan[slug] = { ...analysis!, assignedPose: assigned }
      } else {
        unassigned.push(slug)
      }
    }

    // 4. Якщо dryRun — повернути план без запису
    if (dryRun) {
      return NextResponse.json({
        episodesTotal: episodes.length,
        analyzed: Object.keys(analyses).length,
        analyzeFailures: failures,
        assigned: Object.keys(plan).length,
        unassigned,
        poseUsage,
        sample: Object.fromEntries(Object.entries(plan).slice(0, 5)),
      })
    }

    // 5. Записати в БД (upsert)
    const rows = Object.entries(plan).map(([slug, p]) => ({
      slug,
      pose: p.assignedPose,
      location: p.location,
      season: p.season,
      time_of_day: p.timeOfDay,
      scene_detail: p.sceneDetail,
      key_object: p.keyObject,
      object_owner: p.objectOwner,
      alternatives: { poseTop3: p.poseTop3 },
      planned_at: new Date().toISOString(),
      planning_model: 'claude-haiku-4-5-20251001',
    }))

    const { error: upErr } = await supabase
      .from('cover_plan')
      .upsert(rows, { onConflict: 'slug' })

    if (upErr) {
      return NextResponse.json({ error: `Upsert error: ${upErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      planned: rows.length,
      analyzeFailures: failures,
      unassigned,
      poseUsage,
    })
  } catch (err) {
    console.error('plan-covers error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
