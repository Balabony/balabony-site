/**
 * Значення, які підставляються в текст договору.
 *
 * Винесено окремо, бо ті самі значення потрібні у двох місцях: на сторінці
 * договору і при обчисленні контрольної суми. Якби кожне збирало їх по-своєму,
 * сума перестала б відповідати тому, що бачить автор.
 */

export const DASH = '_______________'

// «29» липня — родовий відмінок; toLocaleDateString дає називний («липень»).
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
                'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня']

export function fmtDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return `«${String(d.getDate()).padStart(2, '0')}» ${MONTHS[d.getMonth()]} ${d.getFullYear()} р.`
}

// Дата народження — «01.12.2005». Потрібна для п. 6.1-2 (повноліття автора).
export function fmtBirthDate(iso: string | null): string {
  if (!iso) return DASH
  const d = new Date(iso)
  if (isNaN(d.getTime())) return DASH
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export type ContractRow = {
  number: string | null
  created_at: string | null
  signed_at: string | null
}

// is_fop приходить булевим, решта полів — рядки, тому тип ширший.
export type ProfileRow = Record<string, string | boolean | null>

export function buildVars(
  contract: ContractRow,
  prof: ProfileRow,
  email: string | null,
  worksCount: number,
): Record<string, string> {
  return {
    NUMBER: contract.number || DASH,
    DATE: fmtDate(contract.signed_at ?? contract.created_at),
    AUTHOR_NAME: (prof.full_name as string | null) || DASH,
    AUTHOR_RNOKPP: (prof.rnokpp as string | null) || DASH,
    AUTHOR_BIRTHDATE: fmtBirthDate(prof.birth_date as string | null),
    AUTHOR_ADDRESS: (prof.address as string | null) || DASH,
    AUTHOR_PHONE: (prof.phone as string | null) || DASH,
    AUTHOR_EMAIL: email || DASH,
    AUTHOR_IBAN: (prof.payout_iban as string | null) || DASH,
    AUTHOR_BANK: (prof.bank_name as string | null) || DASH,
    AUTHOR_RECIPIENT: (prof.payout_recipient as string | null) || (prof.full_name as string | null) || DASH,
    PEN_NAME: (prof.pen_name as string | null) || '—',
    // Статус визначає, яка з двох ставок п. 5.3 стосується Автора, тому в
    // документі він мусить стояти словами, а не «потрібне підкреслити».
    // Порожнього значення тут бути не може: is_fop у профілі завжди
    // булевий, за замовчуванням false.
    AUTHOR_STATUS: prof.is_fop === true
      ? 'фізична особа — підприємець'
      : 'фізична особа',
    WORKS_COUNT: String(worksCount),
  }
}
