import { createHash } from 'crypto'
import { CONTRACT_BLOCKS } from './template'

/**
 * Контрольна сума договору (п. 2.5-1).
 *
 * Договір збирається з бази наживо, тому без фіксації неможливо довести,
 * під яким саме текстом і яким складом переліку автор поставив підпис:
 * сьогодні в переліку 126 творів, за пів року може бути 300.
 *
 * У суму входить усе, що робить договір саме цим договором:
 *   1. текст шаблону (редакція умов);
 *   2. підставлені значення (номер, дата, реквізити сторін);
 *   3. склад переліку творів — назви й ідентифікатори, впорядковані.
 *
 * Порядок рядків і формат розділювачів фіксовані: та сама редакція
 * і той самий перелік мусять давати ту саму суму через рік.
 */

export type ContractVars = Record<string, string>

export type WorkRow = {
  content_id: string | null
  title: string | null
}

const SEP = '\u001f' // роздільник полів
const NL = '\u001e'  // роздільник рядків

/** Текст шаблону без підстановок — окремо, щоб бачити зміну редакції умов. */
export function templateFingerprint(): string {
  const body = CONTRACT_BLOCKS.map((b) => `${b.k}${SEP}${b.t}`).join(NL)
  return createHash('sha256').update(body, 'utf8').digest('hex')
}

/** Канонічний рядок, від якого рахується сума. Придатний і для звірки очима. */
export function buildCanonicalText(vars: ContractVars, works: WorkRow[]): string {
  const filled = CONTRACT_BLOCKS
    .map((b) => `${b.k}${SEP}${b.t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '')}`)
    .join(NL)

  // Перелік упорядковуємо самі: порядок вибірки з бази не гарантований.
  const list = works
    .map((w) => `${w.content_id ?? ''}${SEP}${(w.title ?? '').trim()}`)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .join(NL)

  return [
    `TEMPLATE${SEP}${templateFingerprint()}`,
    `BODY${SEP}${filled}`,
    `WORKS_COUNT${SEP}${works.length}`,
    `WORKS${SEP}${list}`,
  ].join(NL)
}

/** Контрольна сума договору: sha256 у нижньому регістрі, 64 символи. */
export function computeDocHash(vars: ContractVars, works: WorkRow[]): string {
  return createHash('sha256').update(buildCanonicalText(vars, works), 'utf8').digest('hex')
}

/** Короткий вигляд для показу людині: 4 групи по 4 символи. */
export function shortHash(hash: string | null | undefined): string {
  if (!hash) return ''
  const h = hash.slice(0, 16).toUpperCase()
  return `${h.slice(0, 4)} ${h.slice(4, 8)} ${h.slice(8, 12)} ${h.slice(12, 16)}`
}
