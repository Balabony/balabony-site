// lib/canon/mechanical.ts
// Кімната сценариста, Ф1 — МЕХАНІЧНІ канон-перевірки (без AI).
// Чиста функція: текст + рядки canon_bible → список знахідок.
// Споживається ендпойнтом /api/admin/canon-check. AI-перевірки (continuity,
// голоси, тон) — окремо у Ф2.

import { CHARACTERS } from '@/lib/characters'

export interface CanonRow {
  kind: string
  key: string
  canonical: string
  forbidden: string[]
  notes?: string | null
}

export type Severity = 'error' | 'warn' | 'info'

export interface Finding {
  rule: string
  severity: Severity
  message: string
  excerpt?: string
}

// Латиниця, яку В ТЕКСТІ ДОЗВОЛЕНО (бренди-абревіатури, технічне).
const LATIN_ALLOW = new Set([
  'qr','gps','olx','wi','fi','wifi','sms','4k','5g','3g','lte','usb','tv','id','ok',
  'http','https','www','com','ua','net','org',
])

// Штамп-зачини (доповнюються canon_bible kind=format key=зачин).
const DEFAULT_CLICHE_OPENERS = [
  'усе почалося з того', 'все почалося з того', 'усе почалося', 'все почалося',
  'одного разу', 'якось', 'жив собі',
]

// Міські формули в селі (доповнюються canon_bible rule «село реалізм»).
const DEFAULT_CITY_FORMULAS = [
  'сусід по будинку', 'за стіною', 'через стіну', 'квартир', 'під\u02bcїзд', "під'їзд", 'поверх',
]

const KNOWN = new Set(CHARACTERS.map(c => c.toLowerCase()))

function norm(s: string): string {
  return s.toLowerCase().replace(/[\u02bc\u2019']/g, "'").trim()
}

export function checkCanon(text: string, canon: CanonRow[] = []): Finding[] {
  const out: Finding[] = []
  if (!text || !text.trim()) {
    return [{ rule: 'порожньо', severity: 'error', message: 'Текст епізоду порожній.' }]
  }

  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.map(l => l.trim()).filter(Boolean)

  // ── 1. Заборонені форми з canon_bible (вкляв≠вклав, Лиса≠Лиска тощо) ──
  // Міські формули обробляються окремо (нижче) — щоб «поверх» тощо не дублювались,
  // тут пропускаємо forbidden, що належать правилу «село реалізм».
  const lower = norm(text)
  const cityRuleEarly = canon.find(c => c.kind === 'rule' && c.key === 'село реалізм')
  const cityForbiddenSet = new Set((cityRuleEarly?.forbidden ?? []).map(norm))
  for (const row of canon) {
    if (row.kind === 'rule' && row.key === 'село реалізм') continue
    for (const bad of row.forbidden ?? []) {
      const b = norm(bad)
      if (!b || cityForbiddenSet.has(b)) continue
      if (lower.includes(b)) {
        out.push({
          rule: 'заборонена форма',
          severity: 'error',
          message: `«${bad}» → канон: «${row.canonical}» (${row.key})`,
          excerpt: bad,
        })
      }
    }
  }

  // ── 2. Латиниця (крім дозволених абревіатур / @юзернеймів / посилань) ──
  const latinSeen = new Set<string>()
  for (const m of text.matchAll(/[A-Za-z][A-Za-z\-]*/g)) {
    const tok = m[0]
    const before = text[m.index! - 1] ?? ''
    if (before === '@' || before === '/' || before === '.') continue // @user, url
    if (LATIN_ALLOW.has(tok.toLowerCase())) continue
    if (/^\d/.test(tok)) continue
    if (latinSeen.has(tok.toLowerCase())) continue
    latinSeen.add(tok.toLowerCase())
    out.push({
      rule: 'латиниця',
      severity: 'error',
      message: `Латиниця в тексті: «${tok}». Бренди — кирилицею (вайбер/тікток/ютуб).`,
      excerpt: tok,
    })
  }

  // ── 3. Формат реплік: «Імʼя:» + ловля нарації-двокрапки / нових імен ──
  for (const ln of nonEmpty) {
    // діалог через тире
    if (/^[—–-]\s+\S/.test(ln)) {
      out.push({ rule: 'формат репліки', severity: 'warn', message: 'Репліка через тире — канон вимагає «Імʼя: репліка».', excerpt: ln.slice(0, 60) })
      continue
    }
    const m = ln.match(/^([^:]{2,60}):\s/)
    if (!m) continue
    const prefix = m[1].trim()
    // прибираємо лапки/«незворушно» — беремо лише перед комою
    const namePart = prefix.split(',')[0].trim()
    if (KNOWN.has(namePart.toLowerCase())) continue // чистий «Імʼя:»
    // багатослівний префікс, перший токен — відомий персонаж → нарація-двокрапка
    const first = namePart.split(/\s+/)[0]
    if (namePart.includes(' ') && KNOWN.has(first.toLowerCase())) {
      out.push({ rule: 'нарація-двокрапка', severity: 'warn', message: `«${namePart}:» — схоже на нарацію з двокрапкою. Має бути «${first}: репліка», а дію винести в нарацію.`, excerpt: prefix.slice(0, 50) })
    } else if (!namePart.includes(' ') && /^[А-ЯІЇЄҐ]/.test(namePart)) {
      out.push({ rule: 'новий персонаж?', severity: 'warn', message: `Спікер «${namePart}» не в біблії персонажів. Новий герой — додати в canon_bible / characters.ts?`, excerpt: namePart })
    }
  }

  // ── 4. Штамп-зачин ──
  const openers = [...DEFAULT_CLICHE_OPENERS, ...canon.filter(c => c.kind === 'format' && c.key === 'зачин').flatMap(c => c.forbidden)]
  const firstPara = norm(nonEmpty[0] ?? '')
  for (const op of openers) {
    if (firstPara.startsWith(norm(op))) {
      out.push({ rule: 'штамп-зачин', severity: 'warn', message: `Зачин-штамп: «${op}…». Почати інакше.`, excerpt: nonEmpty[0]?.slice(0, 60) })
      break
    }
  }

  // ── 5. Фінал — авторська нарація, не репліка ──
  const last = nonEmpty[nonEmpty.length - 1] ?? ''
  const lastM = last.match(/^([^:]{2,40}):/)
  if (lastM && KNOWN.has(lastM[1].trim().toLowerCase())) {
    out.push({ rule: 'фінал-нарація', severity: 'warn', message: 'Епізод завершується реплікою. Канон: фінал — авторська нарація без катчфраз-кнопок.', excerpt: last.slice(0, 60) })
  }

  // ── 6. Міські формули в селі ──
  const cityRule = canon.find(c => c.kind === 'rule' && c.key === 'село реалізм')
  const cityForms = [...DEFAULT_CITY_FORMULAS, ...(cityRule?.forbidden ?? [])]
  const seenCity = new Set<string>()
  for (const cf of cityForms) {
    const c = norm(cf)
    if (c && lower.includes(c) && !seenCity.has(c)) {
      seenCity.add(c)
      out.push({ rule: 'міська формула', severity: 'error', message: `«${cf}» — місто, не село. Сусіди через дорогу / тин / у сусідньому дворі.`, excerpt: cf })
    }
  }

  return out
}
