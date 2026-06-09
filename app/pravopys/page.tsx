import type { Metadata } from 'next'
import { dbQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Правопис української мови — довідник | Balabony',
  description: 'Практичний довідник чинного українського правопису (стандарт державної мови, чинний з 28.03.2026): короткі правила, приклади, посилання на офіційне джерело. Для студентів і всіх, хто цікавиться мовою.',
}

const NAVY = '#0E1A2B'
const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DEEP = '#B5710C'
const CREAM = '#FFF8EE'
const LIGHTBLUE = '#B5D4F4'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

interface Rule {
  id: number
  topic: string
  category: string | null
  rule_short: string
  examples: string | null
  norm_type: 'mandatory' | 'variant'
  source: string | null
}

async function getRules(): Promise<Rule[]> {
  try {
    const res = await dbQuery(
      `SELECT id, topic, category, rule_short, examples, norm_type, source
       FROM spelling_rules
       WHERE status = 'verified' AND audience = 'all'
       ORDER BY category NULLS LAST, sort_order ASC, topic ASC`
    )
    return res.rows as Rule[]
  } catch {
    return []
  }
}

export default async function PravopysPage() {
  const rules = await getRules()

  // групуємо за категорією
  const groups = new Map<string, Rule[]>()
  for (const r of rules) {
    const key = r.category || 'Інше'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '56px 20px 96px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        <a href="/" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
          Balabony
        </a>

        <h1 style={{ fontFamily: SERIF, color: GOLD, fontSize: 34, lineHeight: 1.2, margin: '28px 0 12px' }}>
          Правопис української мови
        </h1>
        <p style={{ color: LIGHTBLUE, fontSize: 16, lineHeight: 1.7, marginBottom: 8 }}>
          Короткий практичний довідник для студентів і всіх, хто хоче писати правильно. Кожне правило — простими словами, з прикладами.
        </p>

        <a
          href="/pravopys/dity"
          style={{
            display: 'inline-block', marginBottom: 16, padding: '10px 18px',
            background: 'rgba(181,212,244,0.12)', border: `1px solid ${LIGHTBLUE}`,
            borderRadius: 10, color: LIGHTBLUE, fontSize: 15, fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          👧 Для дітей — з підказками й картинками →
        </a>
        <p style={{ color: 'rgba(255,248,238,0.55)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
          Джерело — чинний стандарт державної мови «Український правопис» (рішення Національної комісії зі стандартів державної мови №47 від 01.03.2026, чинний з 28.03.2026).
          Офіційний текст: <a href="https://mova.gov.ua/diyalnist-i-proyekti/termini/pravopys-ukrainskoi-movy" target="_blank" rel="noopener" style={{ color: GOLD }}>mova.gov.ua</a>.
        </p>

        <div style={{ marginBottom: 36 }}>
          <a
            href="https://mova.gov.ua/storage/app/sites/19/2026/rishennja-komisiji/01-03/sdm-ukrayinskii-pravopis-vidannia.pdf"
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-block', padding: '11px 20px',
              background: 'rgba(239,159,39,0.15)', border: `1px solid ${GOLD}`,
              borderRadius: 10, color: GOLD, fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            ⬇ Завантажити офіційний правопис (PDF)
          </a>
          <p style={{ color: 'rgba(255,248,238,0.45)', fontSize: 12, lineHeight: 1.6, margin: '8px 0 0' }}>
            Офіційне видання, 2026 · рішення Комісії №47 · поширюється за ліцензією Creative Commons Attribution 4.0. Файл відкривається з офіційного сайту mova.gov.ua.
          </p>
        </div>

        {rules.length === 0 ? (
          <div style={{ background: CARD, borderRadius: 16, padding: 28, color: 'rgba(255,248,238,0.7)' }}>
            Довідник наповнюється. Невдовзі тут зʼявляться вивірені статті.
          </div>
        ) : (
          Array.from(groups.entries()).map(([cat, items]) => (
            <section key={cat} style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: SERIF, color: FAC(), fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
                {cat}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map(r => (
                  <article key={r.id} style={{ background: CARD, border: `1px solid rgba(239,159,39,0.18)`, borderRadius: 14, padding: '22px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <h3 style={{ fontFamily: SERIF, color: GOLD, fontSize: 21, margin: 0 }}>{r.topic}</h3>
                      {r.norm_type === 'variant' && (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: 'rgba(181,212,244,0.15)', color: LIGHTBLUE, fontWeight: 600 }}>
                          Допустимі обидві форми
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 16, lineHeight: 1.75, color: CREAM, margin: '0 0 12px' }}>{r.rule_short}</p>
                    {r.examples && (
                      <div style={{ background: 'rgba(255,248,238,0.04)', borderLeft: `3px solid ${GOLD_DEEP}`, borderRadius: 8, padding: '12px 16px', marginBottom: r.source ? 12 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,248,238,0.5)', marginBottom: 6 }}>Приклади</div>
                        <div style={{ fontSize: 15, lineHeight: 1.7, color: LIGHTBLUE }}>{r.examples}</div>
                      </div>
                    )}
                    {r.source && (
                      <a href={r.source} target="_blank" rel="noopener" style={{ fontSize: 13, color: GOLD_DEEP, textDecoration: 'none' }}>
                        Джерело в офіційному стандарті ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        <p style={{ color: 'rgba(255,248,238,0.4)', fontSize: 12, lineHeight: 1.7, marginTop: 48 }}>
          Довідник має освітній характер. У спірних випадках першоджерелом є офіційний текст стандарту на mova.gov.ua.
          Матеріали стандарту — за ліцензією Creative Commons Attribution 4.0.
        </p>
      </div>
    </main>
  )
}

function FAC() { return '#FAC775' }
