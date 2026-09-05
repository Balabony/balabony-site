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

export type ProfileRow = Record<string, string | null>

export function buildVars(
  contract: ContractRow,
  prof: ProfileRow,
  email: string | null,
  worksCount: number,
): Record<string, string> {
  return {
    NUMBER: contract.number || DASH,
    DATE: fmtDate(contract.signed_at ?? contract.created_at),
    AUTHOR_NAME: prof.full_name || DASH,
    AUTHOR_RNOKPP: prof.rnokpp || DASH,
    AUTHOR_BIRTHDATE: fmtBirthDate(prof.birth_date),
    AUTHOR_ADDRESS: prof.address || DASH,
    AUTHOR_PHONE: prof.phone || DASH,
    AUTHOR_EMAIL: email || DASH,
    AUTHOR_IBAN: prof.payout_iban || DASH,
    AUTHOR_BANK: prof.bank_name || DASH,
    AUTHOR_RECIPIENT: prof.payout_recipient || prof.full_name || DASH,
    PEN_NAME: prof.pen_name || '—',
    WORKS_COUNT: String(worksCount),
  }
}
