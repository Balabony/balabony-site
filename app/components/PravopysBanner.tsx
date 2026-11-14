import Link from 'next/link'

/**
 * Анонс розділу «Правопис» на головній (14.11.2026).
 * SEO: h2 і текст містять запити «правопис української мови», «український алфавіт»,
 * «українська мова 5–9 клас», «підготовка до НМТ», «правопис 2026»; усі посилання — звичайні <a>,
 * їх бачить пошуковик. Серверний компонент: без стану, повністю в HTML.
 */
const NAVY_CARD = '#14253B'
const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

const chip = { display: 'inline-block', fontFamily: FONT, fontSize: 13, fontWeight: 700, textDecoration: 'none', borderRadius: 20, padding: '9px 16px', whiteSpace: 'nowrap' as const }

export default function PravopysBanner() {
  return (
    <section aria-labelledby="pravopys-anons" style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 4px' }}>
      <div style={{ border: '1px solid rgba(239,159,39,0.45)', borderRadius: 14, background: NAVY_CARD, padding: '18px 20px' }}>
        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: GOLD, marginBottom: 4 }}>НОВЕ · ПРАВОПИС</div>
        <h2 id="pravopys-anons" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: CREAM, margin: '0 0 8px' }}>
          Правопис української мови 2026: абетка, правила й тести
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.6, color: '#B5C6DA', margin: '0 0 14px', maxWidth: 800 }}>
          Український алфавіт із 33 букв, апостроф, ґ, м’який знак, велика буква. Прості правила й мінітести для 5–9 класів; повні правила для студентів і підготовки до НМТ.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/pravopys/uchnyam/alfavit" style={{ ...chip, background: GOLD, color: '#0E1A2B' }}>Українська абетка для учнів →</Link>
          <Link href="/pravopys/uchnyam" style={{ ...chip, border: `1.5px solid ${GOLD}`, color: GOLD }}>Українська мова 5–9 клас</Link>
          <Link href="/pravopys/studentam" style={{ ...chip, border: `1.5px solid ${GOLD}`, color: GOLD }}>Правопис для студентів і НМТ</Link>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: 1.5, color: '#B5C6DA', margin: '14px 0 0', paddingTop: 12, borderTop: '1px solid rgba(239,159,39,0.25)' }}>
          Онлайн-гра для учнів 5–11 класів:{' '}
          <Link href="/moia-ukraina" style={{ color: GOLD, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Моя Україна на мапі — запитання про міста України →</Link>
        </p>
      </div>
    </section>
  )
}
