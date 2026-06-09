import type { Metadata } from 'next'
import { dbQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Правопис для дітей — з підказками й картинками | Balabony',
  description: 'Дитячий довідник українського правопису: прості правила з кольоровими картками, мнемо-підказками й картинками. За чинним стандартом державної мови.',
}

const NAVY = '#0E1A2B'
const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
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
  child_mnemonic: string | null
  image_url: string | null
  source: string | null
}

async function getRules(): Promise<Rule[]> {
  try {
    const res = await dbQuery(
      `SELECT id, topic, category, rule_short, examples, norm_type, child_mnemonic, image_url, source
       FROM spelling_rules
       WHERE status = 'verified' AND audience = 'all' AND child_mode = true
       ORDER BY category NULLS LAST, sort_order ASC, topic ASC`
    )
    return res.rows as Rule[]
  } catch {
    return []
  }
}

export default async function PravopysDityPage() {
  const rules = await getRules()

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '56px 20px 96px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <a href="/" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
          Balabony
        </a>

        <h1 style={{ fontFamily: SERIF, color: GOLD, fontSize: 40, lineHeight: 1.15, margin: '28px 0 14px' }}>
          Правопис для дітей
        </h1>
        <p style={{ color: LIGHTBLUE, fontSize: 19, lineHeight: 1.6, marginBottom: 24 }}>
          Прості правила з підказками й картинками. Читаємо, запамʼятовуємо й пишемо правильно!
        </p>

        <a href="/pravopys" style={{ display: 'inline-block', marginBottom: 36, fontSize: 15, color: GOLD_LIGHT, textDecoration: 'none', borderBottom: `1px solid ${GOLD_DEEP}`, paddingBottom: 2 }}>
          ← Звичайний довідник (для старших)
        </a>

        {rules.length === 0 ? (
          <div style={{ background: CARD, borderRadius: 20, padding: 32, color: 'rgba(255,248,238,0.75)', fontSize: 18, lineHeight: 1.6 }}>
            Тут скоро зʼявляться правила з картинками. Зазирни трохи згодом! 🙂
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {rules.map(r => (
              <article
                key={r.id}
                style={{
                  background: CARD,
                  border: `2px solid ${GOLD}`,
                  borderRadius: 22,
                  padding: '26px 28px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
                }}
              >
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image_url}
                    alt={r.topic}
                    loading="lazy"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 14, marginBottom: 18, display: 'block' }}
                  />
                )}

                <h2 style={{ fontFamily: SERIF, color: GOLD, fontSize: 28, lineHeight: 1.2, margin: '0 0 14px' }}>
                  {r.topic}
                </h2>

                {r.child_mnemonic && (
                  <div
                    style={{
                      background: 'rgba(250,199,117,0.14)',
                      border: `2px dashed ${GOLD_LIGHT}`,
                      borderRadius: 16,
                      padding: '16px 20px',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: GOLD_LIGHT, marginBottom: 6 }}>
                      Підказка
                    </div>
                    <div style={{ fontSize: 22, lineHeight: 1.5, color: CREAM, fontWeight: 600 }}>
                      {r.child_mnemonic}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 18, lineHeight: 1.7, color: CREAM, margin: '0 0 14px' }}>
                  {r.rule_short}
                </p>

                {r.norm_type === 'variant' && (
                  <p style={{ fontSize: 15, color: LIGHTBLUE, margin: '0 0 14px' }}>
                    Можна писати двома способами — обидва правильні.
                  </p>
                )}

                {r.examples && (
                  <div style={{ background: 'rgba(255,248,238,0.06)', borderLeft: `4px solid ${GOLD_DEEP}`, borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,248,238,0.55)', marginBottom: 6 }}>
                      Приклади
                    </div>
                    <div style={{ fontSize: 18, lineHeight: 1.7, color: LIGHTBLUE }}>
                      {r.examples}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <p style={{ color: 'rgba(255,248,238,0.4)', fontSize: 13, lineHeight: 1.7, marginTop: 48 }}>
          Правила звірені з чинним стандартом державної мови «Український правопис» (рішення Національної комісії зі стандартів державної мови №47, чинний з 28.03.2026).
          Офіційний текст — на mova.gov.ua. Матеріали стандарту — за ліцензією Creative Commons Attribution 4.0.
        </p>
      </div>
    </main>
  )
}
