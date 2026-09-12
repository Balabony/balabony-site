/**
 * Українське відмінювання після числівника.
 *
 * Потрібне тому, що «від 1 серій» і «вам до нього 24 серій» читаються як
 * недбалість — а сторінка продає товар за 550 грн.
 *
 * plural(1, 'серія', 'серії', 'серій') → 'серія'
 * plural(3, ...) → 'серії'
 * plural(24, ...) → 'серії'
 * plural(5, ...) → 'серій'
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

/** Число разом зі словом: «24 серії». */
export function withPlural(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`
}
