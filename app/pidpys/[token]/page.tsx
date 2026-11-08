// 08.11.2026 (рішення засновника «спростити підписання онлайн»): персональне посилання на підпис договору без входу в кабінет.
// Автор відкриває посилання з листа → (якщо бракує) 4 поля → читає договір → «Погоджуюсь» → код з пошти → підписано.
import type { Metadata } from 'next'
import { dbQuery } from '@/lib/db'
import { readSignToken } from '@/lib/contract/sign-link'
import { CONTRACT_BLOCKS } from '@/lib/contract/template'
import { buildVars, DASH } from '@/lib/contract/vars'
import { SIGN_REQUIRED, maskEmail } from '@/lib/contract/otp'
import type { ContractSnapshot } from '@/lib/contract/snapshot'
import ContractText from '@/app/components/ContractText'
import PidpysClient from './PidpysClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Підписання договору · Балабони', robots: { index: false, follow: false } }

const wrapS: React.CSSProperties = { background: '#ffffff', color: '#16202e', minHeight: '60vh', padding: '28px 18px 64px' }
const inS: React.CSSProperties = { maxWidth: 780, margin: '0 auto' }
const sans = "'Montserrat', Arial, sans-serif"

export default async function Pidpys({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const authorId = readSignToken(token)
  if (!authorId) {
    return (
      <main style={wrapS}><div style={{ ...inS, fontFamily: sans }}>
        <h1 style={{ fontSize: 24 }}>Посилання застаріло</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6 }}>Посилання на підписання діє 21 день. Напишіть нам на <a href="mailto:nazar@balabony.com">nazar@balabony.com</a> — надішлемо нове. Або увійдіть у <a href="/author/dashboard">кабінет автора</a> і підпишіть там.</p>
      </div></main>
    )
  }

  const p = await dbQuery(
    `select p.full_name, p.rnokpp, p.birth_date, p.address, p.phone, p.payout_iban, p.bank_name, p.payout_recipient, p.pen_name, p.is_fop,
            u.email
       from author_profiles p left join auth.users u on u.id = p.user_id
      where p.user_id = $1 limit 1`,
    [authorId],
  )
  const prof = (p.rows[0] ?? {}) as Record<string, string | boolean | null>
  const email = (prof.email as string | null) ?? null
  const missing = SIGN_REQUIRED.filter(([k]) => !String(prof[k] ?? '').trim()).map(([, l]) => l)

  const c = await dbQuery(
    `select id, number, status, created_at, signed_at, doc_snapshot from author_contracts
      where author_id = $1 and status <> 'terminated' order by created_at desc limit 1`,
    [authorId],
  )
  const contract = c.rows[0] as { id: string; number: string; status: string; created_at: string | null; signed_at: string | null; doc_snapshot: ContractSnapshot | null } | undefined

  let blocks: { k: string; t: string }[] = []
  let pending = 0
  if (contract) {
    const w = await dbQuery(`select content_id, title, confirmed_at from contract_works where contract_id = $1`, [contract.id])
    pending = w.rows.filter((x) => !x.confirmed_at).length
    const V = buildVars(contract, prof, email, w.rows.length)
    // Посилання можуть переслати — тож РНОКПП, дату народження й телефон тут показуємо частково.
    // У підписаному знімку (saveContractSnapshot) — повні значення, як у кабінеті.
    const tail = (v: string, n: number) => (v && v !== DASH ? '•'.repeat(Math.max(0, v.length - n)) + v.slice(-n) : v)
    V.AUTHOR_RNOKPP = tail(V.AUTHOR_RNOKPP, 3)
    V.AUTHOR_BIRTHDATE = V.AUTHOR_BIRTHDATE && V.AUTHOR_BIRTHDATE !== DASH ? '••.••.' + V.AUTHOR_BIRTHDATE.slice(-4) : V.AUTHOR_BIRTHDATE
    V.AUTHOR_PHONE = tail(V.AUTHOR_PHONE, 2)
    blocks = contract.doc_snapshot?.blocks?.length && contract.status === 'signed'
      ? []
      : CONTRACT_BLOCKS.map((b) => ({ k: b.k, t: b.t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => V[k] ?? DASH) }))
  }
  const name = String(prof.full_name ?? '').split(' ').slice(1, 3).join(' ')

  return (
    <main style={wrapS}>
      <div style={inS}>
        <div style={{ fontFamily: sans, marginBottom: 22 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#b26f00', fontWeight: 700 }}>Балабони · авторський договір</div>
          <h1 style={{ fontSize: 26, margin: '6px 0 8px' }}>{contract?.status === 'signed' ? 'Договір уже підписано' : name ? `${name}, договір за 2 хвилини` : 'Підписання договору за 2 хвилини'}</h1>
          {contract?.status !== 'signed' && (
            <ol style={{ fontSize: 16, lineHeight: 1.7, paddingLeft: 22, margin: 0, color: '#2c3a52' }}>
              {missing.length > 0 && <li>Впишіть 4 поля про себе (банківський рахунок — пізніше, перед першою виплатою).</li>}
              <li>Прочитайте договір нижче.</li>
              <li>Поставте «Погоджуюсь» і введіть код, який прийде на {email ? <b>{maskEmail(email)}</b> : 'вашу пошту'}.</li>
            </ol>
          )}
        </div>

        <PidpysClient
          token={token}
          needRequisites={missing.length > 0 || !contract}
          missing={missing}
          initial={{ fullName: String(prof.full_name ?? ''), rnokpp: '', birthDate: prof.birth_date ? String(prof.birth_date).slice(0, 10) : '', phone: String(prof.phone ?? ''), isFop: prof.is_fop === true }}
          contractId={contract?.id ?? null}
          signed={contract?.status === 'signed'}
          pending={pending}
        />

        {contract && missing.length === 0 && contract.status !== 'signed' && (
          <div id="dogovir" style={{ fontFamily: "'Times New Roman', Georgia, serif", marginTop: 30, borderTop: '1px solid #d8dee8', paddingTop: 24 }}>
            <ContractText blocks={blocks} />
          </div>
        )}
        {contract && missing.length === 0 && contract.status !== 'signed' && (
          <div id="pidpys" style={{ fontFamily: sans, scrollMarginTop: 20 }}>
            <p style={{ fontSize: 15, color: '#4a5568', margin: '24px 0 0' }}>Дочитали? Підписати можна тут:</p>
            <PidpysClient token={token} needRequisites={false} missing={[]} initial={null} contractId={contract.id} signed={false} pending={pending} compact />
          </div>
        )}
        <p style={{ fontFamily: sans, fontSize: 13, color: '#5a6b85', marginTop: 30, lineHeight: 1.6 }}>
          Інші способи — кваліфікований електронний підпис, «Дія» або папір поштою — у <a href="/author/dashboard" style={{ color: '#b26f00' }}>кабінеті автора</a>. Питання: <a href="mailto:nazar@balabony.com" style={{ color: '#b26f00' }}>nazar@balabony.com</a>.
        </p>
      </div>
    </main>
  )
}
