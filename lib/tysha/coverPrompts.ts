// Банк промптів обкладинок «Тиша» (Максим) — щоб генерувати авто-варіанти
// за номером серії. Обличчя береться з еталона Максима (kontext тримає його),
// у промпт іде тільки сцена + канон-база.

export const MAKSYM_REF =
  'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/tysha-gen/maksym-ref-417595-1782551508689.jpg'

// Канон-база. E1–E4 — цивільний (до війни / полігон), E5+ — форма без нашивок.
const CIV =
  'Maksym, thin lean young man, dark messy hair, narrow face, hollow cheeks, clean-shaven, plain civilian casual clothes, no uniform, photorealistic, no watermark'
const MIL =
  'Maksym, thin lean young man about 22, dark messy hair, narrow face, hollow cheeks, clean-shaven, plain Ukrainian pixel camo uniform, NO patches, NO name tapes, NO insignia, NO text on clothing, photorealistic, no watermark'

// Сцена по номеру серії (season 1). E31 «Мед» — серія про Олю, не про Максима → нема.
const SCENES: Record<number, string> = {
  1: 'civilian teenager sitting alone in a classroom with a book, quiet withdrawn, soft young face, close-up',
  2: 'civilian, tense phone call in a hospital corridor, worried, waist-up',
  3: 'civilian at home by a window at night, resolute quiet stare, dim light, close-up',
  4: 'civilian young man leaving at a night train station with a backpack, dim lamps, three-quarter from behind',
  5: 'lying prone at a shooting range with an instructor, learning to aim, daylight, full body',
  6: 'in a trench, first-battle shock, pale dirty face, distant explosions, close-up',
  7: 'digging a trench in a bare field, burned village chimneys behind, grey overcast sky, full body',
  8: 'wading through misty swamp reeds under fire, rifle in hands, moving forward, three-quarter view',
  9: 'sitting in a ruined school classroom holding a paper letter, chalkboard behind, soft window light, waist-up',
  10: 'two men talking seriously in a dugout by candlelight, over-shoulder, warm dim light',
  11: 'standing uneasy receiving an award, muddy trench line, overcast, waist-up',
  12: 'training hand-to-hand with an older mentor in a yard, tense, low angle',
  13: 'writing a letter by candlelight in a dugout, pensive, close-up on hands and face',
  14: 'holding a letter then geared up moving out on a muddy road, mixed mood, three-quarter',
  15: 'carrying a wounded comrade through a shelterbelt, straining, rain, full body',
  16: 'silhouette against fire and smoke, holding a photo, grief, backlit',
  17: 'kneeling over a badly wounded commander, tourniquet, chaos, high angle',
  18: 'standing alone at dusk looking at a note in his hand, haunted, blue hour, close-up',
  19: 'receiving a radio and notebook from a legless commander, solemn, dugout, over-shoulder',
  20: 'lying awake at night listening, hand near ear, starry sky, quiet, close-up',
  21: 'moving through a ruined village at night, listening intently, tense, silhouette',
  22: 'in a hospital corridor, heavy conversation, out of place, white walls, waist-up',
  23: 'holding a rifle case just given to him, conflicted, dugout, warm light, waist-up',
  24: 'embracing a one-armed friend by a volunteer van loaded with drones, muddy road, full body',
  25: 'looking up tensely for a drone, hand shielding eyes, bare treeline, overcast, low angle',
  26: 'alone after close combat, staring at his own hands, spent, dim light, close-up',
  27: 'on the phone quiet and tense, dugout, a letter in his pocket, warm dim light, waist-up',
  28: 'aiming a sniper rifle prone, focused reading the wind, bare field, three-quarter view',
  29: 'lying beside a sniper, listening, hand near ear, ruined building, tense, close-up',
  30: 'clutching a radio, sleepless at night, empty stare, dugout, close-up',
  // 31 — «Мед», серія про Олю
  32: 'pinned down fighting off two attackers, dynamic, dust, low angle',
  33: 'crawling the last few metres under fire, mud, tension, full body',
  34: 'close hand-to-hand struggle, raw and desperate, dim light, motion blur',
  35: 'entering a dark ruined building, rifle raised, cautious, silhouette',
  36: 'visiting a hospital ward, prosthetics in the corner, heavy silence, white light, waist-up',
  37: 'a commander speaking quietly to tired soldiers in a dugout, over-shoulder',
  38: 'standing beside a female commander at a field command post, deferring, half-body',
  39: 'carrying a stretcher with a fallen comrade across a grey field, grief, full body',
  40: 'staring bitterly at ill-fitting gear and papers, office light, waist-up',
  41: 'quiet reflective portrait, hollow thousand-yard stare, cold light, close-up',
  42: 'eating from a mess tin in a dugout, bittersweet, warm candle glow, waist-up',
  43: 'a veteran in civilian clothes doing an ordinary delivery job, out of place, daylight',
  44: 'at an office desk with documents of a fallen soldier, heavy, harsh fluorescent light',
  45: 'crawling out to drag a wounded man back, mud, tension, full body',
  46: 'worn down counting days, dugout wall with tally marks behind, exhausted, close-up',
  47: 'overwhelmed by the scale, a wide field of stretchers behind, high angle, small figure',
  48: 'watching helplessly through binoculars, restrained, bare treeline, overcast',
  49: 'covering his nose grimly on ruined ground, muted colours, waist-up',
  50: 'mute and unable to speak, hollow stare, silent, close-up',
  51: 'two commanders talking as equals in the field, over-shoulder',
  52: 'reflective older memory tone, muted flashback light, close-up',
  53: 'extreme close-up on his eyes, reading someone, tense',
  54: 'steadying a reckless young soldier, firm, in a trench, half-body',
  55: 'alone with the sniper rifle, cold and distant, bare field at dusk, waist-up',
  56: 'detached, watching his own life like a film, surreal quiet, cold light, close-up',
}

// Чи є серія про Максима (для яких можна авто-генерувати).
export function hasCoverPrompt(ep: number | null | undefined): boolean {
  return !!ep && ep in SCENES
}

// Повний промпт сцени для серії (канон-база + сцена). '' якщо серії нема в банку.
export function buildCoverPrompt(ep: number | null | undefined): string {
  if (!ep || !(ep in SCENES)) return ''
  const base = ep <= 4 ? CIV : MIL
  return `${base}, ${SCENES[ep]}`
}
