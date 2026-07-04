// Банк промптів обкладинок «Тиша» (Максим) — авто-варіанти за номером серії.
// Обличчя береться з еталона Максима (kontext тримає його), у промпт іде сцена + канон-база.
// Правило: ЗАВЖДИ лише Максим, обличчя освітлене й видиме (без других фігур/силуетів).

export const MAKSYM_REF =
  'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/tysha-gen/maksym-ref-417595-1782551508689.jpg'

const SOLO = 'solo shot of one person only, no other people, SAME EXACT face as the reference photo, identical facial features, symmetric natural eyes looking naturally, evenly and brightly lit face, no dark shadows on the face, bright scene'

// E1–E4 — цивільний (до війни / полігон), E5+ — форма без нашивок.
const CIV =
  `Maksym, thin lean young man, dark messy hair, narrow face, hollow cheeks, clean-shaven, plain civilian casual clothes, no uniform, ${SOLO}, photorealistic, no watermark`
const MIL =
  `Maksym, thin lean young man about 22, dark messy hair, narrow face, hollow cheeks, clean-shaven, plain Ukrainian pixel camo uniform, NO patches, NO name tapes, NO insignia, NO text on clothing, ${SOLO}, photorealistic, no watermark`

// Сцена по номеру серії (season 1). Усі сцени — сольні, обличчя видно.
// E31 «Мед» — про Олю, не про Максима → нема.
const SCENES: Record<number, string> = {
  1: 'sitting alone in a classroom with a book, quiet withdrawn, soft young face, close-up',
  2: 'a tense worried phone call in a hospital corridor, face lit, waist-up',
  3: 'at home by a window at night, resolute quiet stare, warm lamp light on his face, close-up',
  4: 'leaving at a night train station with a backpack, face lit by station lamps, waist-up',
  5: 'aiming a rifle prone at a shooting range, focused, daylight, face visible, full body',
  6: 'in a trench, first-battle shock, pale dirty lit face, distant explosions, close-up',
  7: 'digging a trench in a bare field, burned village chimneys behind, grey overcast, face lit, full body',
  8: 'wading through misty swamp reeds, rifle in hands, moving forward, face lit, three-quarter view',
  9: 'sitting in a ruined school classroom holding a paper letter, chalkboard behind, soft window light on his face, waist-up',
  10: 'sitting alone in a dugout deep in thought, warm lamp light on his face, pensive, waist-up',
  11: 'standing uneasy holding a medal, muddy trench line, overcast, face lit, waist-up',
  12: 'a tense hand-to-hand training stance, focused, daylight, face visible, half-body',
  13: 'writing a letter at a table, warm lamp light on his face, pensive, close-up',
  14: 'holding a letter, geared up on a muddy road, mixed mood, face lit, three-quarter',
  15: 'carrying a wounded man on his back, strain on his lit face, rain, full body, focus on Maksym',
  16: 'standing before distant fire and smoke, holding a photo, grief, warm light on his face, waist-up',
  17: 'kneeling and pressing a wound, tense, his face lit, high angle',
  18: 'standing alone at dusk looking at a note in his hand, haunted, blue hour, face lit, close-up',
  19: 'holding a radio and a notebook, solemn, dugout, warm light on his face, waist-up',
  20: 'lying awake at night listening, hand near ear, starry sky, face lit by moonlight, close-up',
  21: 'moving through a ruined village at night, listening intently, hand near ear, face lit by moonlight, tense',
  22: 'in a bright hospital corridor, heavy expression, out of place, white walls, face lit, waist-up',
  23: 'holding a rifle case, conflicted, dugout, warm light on his face, waist-up',
  24: 'standing by a volunteer van loaded with drones, tired faint smile, muddy road, face lit, waist-up',
  25: 'looking up tensely for a drone, hand shielding eyes, bare treeline, overcast, face lit, low angle',
  26: 'alone after combat, staring at his own hands, spent, dim room with light on his face, close-up',
  27: 'a quiet tense phone call, dugout, a letter in his pocket, warm light on his face, waist-up',
  28: 'aiming a sniper rifle prone, focused reading the wind, bare field, face visible, three-quarter',
  29: 'lying prone listening, hand near ear, ruined building, tense, face lit, close-up',
  30: 'clutching a radio, sleepless at night, empty stare, dugout, face lit, close-up',
  // 31 — «Мед», серія про Олю
  32: 'in a fighting stance under pressure, dynamic, dust, face lit, low angle',
  33: 'crawling the last few metres, mud, tension, face lit, full body',
  34: 'a raw desperate close-combat stance, dim with light on his face, motion',
  35: 'entering a ruined building, rifle raised, cautious, face lit by a shaft of light, tense',
  36: 'standing in a hospital ward, prosthetics in the corner, heavy silence, white light, face lit, waist-up',
  37: 'giving quiet orders, resolute, dugout, warm light on his face, waist-up',
  38: 'standing attentive at a field command post, focused, face lit, half-body',
  39: 'carrying a stretcher, grief on his lit face, grey field, full body, focus on Maksym',
  40: 'staring bitterly at ill-fitting gear and papers, office light on his face, waist-up',
  41: 'a quiet reflective portrait, hollow thousand-yard stare, cold light on his face, close-up',
  42: 'eating from a mess tin in a dugout, bittersweet, warm candle glow on his face, waist-up',
  43: 'in civilian clothes doing an ordinary delivery job, out of place, daylight, face lit',
  44: 'at an office desk with a fallen soldier documents, heavy, light on his face, waist-up',
  45: 'crawling out to drag a wounded man, mud, tension, face lit, full body, focus on Maksym',
  46: 'worn down, dugout wall with tally marks behind, exhausted, face lit, close-up',
  47: 'small lit figure against a wide grey field, overwhelmed, high angle, face visible',
  48: 'watching tensely through binoculars, restrained, bare treeline, overcast, face lit',
  49: 'a grim expression on ruined ground, muted colours, face lit, waist-up',
  50: 'mute, unable to speak, hollow stare, quiet, face lit, close-up',
  51: 'standing in the field, resolute, talking, face lit, waist-up',
  52: 'a reflective muted-memory tone portrait, soft flashback light on his face, close-up',
  53: 'extreme close-up on his lit eyes, reading someone, tense',
  54: 'standing firm giving a warning, in a trench, face lit, half-body',
  55: 'alone holding a sniper rifle, cold distant look, bare field at dusk, face lit, waist-up',
  56: 'detached, watching his own life like a film, surreal quiet, cold light on his face, close-up',
}

export function hasCoverPrompt(ep: number | null | undefined): boolean {
  return !!ep && ep in SCENES
}

export function buildCoverPrompt(ep: number | null | undefined): string {
  if (!ep || !(ep in SCENES)) return ''
  const base = ep <= 4 ? CIV : MIL
  return `${base}, ${SCENES[ep]}`
}
