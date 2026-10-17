'use client'

import { useEffect, useState } from 'react'
import { CONVERSION_LABELS, type ConversionName } from '@/lib/conversion'

/**
 * /admin/konversii — змістовні конверсії для Google Ad Grants (17.10.2026).
 *
 * Відповідає на три питання:
 *   1. Скільки людей зробили змістовну дію (підписка, заявка, пожертва, реєстрація…).
 *   2. Скільки з них прийшли з реклами Google (джерело сесії google_ads).
 *   3. Скільки людей узагалі дійшли до сторінок, куди веде реклама.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface ByName { name: string; total: number; d7: number; ads: number }
interface BySource { source: string; name: string; n: number }
interface Recent { name: string; detail: string | null; path: string | null; source: string | null; created_at: string }
interface Landing { url: string; sessions: number; d7: number }
interface Member { name: string; email: string; role: string; source: string | null; created_at: string }
interface Data {
  days: number
  by_name?: ByName[]; by_source?: BySource[]; recent?: Recent[]; landings?: Landing[]
  klub?: Member[]; klub_total?: number; klub_error?: string
  conv_error?: string; lp_error?: string; error?: string
}

const label = (n: string) => CONVERSION_LABELS[n as ConversionName] ?? n
const SOURCE_LABEL: Record<string, string> = { google_ads: 'Реклама Google', 'прямий': 'Прямий', 'невідомо': 'Невідомо' }
const srcLabel = (s: string) => SOURCE_LABEL[s] ?? s

const card: React.CSSProperties = { background: '#0f1a2e', border: '1px solid #24324d', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', color: '#9fb0cc', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #24324d' }
const td: React.CSSProperties = { padding: '8px 10px', fontSize: 15, borderBottom: '1px solid #1b2740', color: '#e8edf6' }
const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

export default function KonversiiPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/konversii-data?days=${days}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Data) => setData(d))
      .catch(() => setData({ days, error: 'Не вдалося завантажити дані' }))
      .finally(() => setLoading(false))
  }, [days])

  const total = (data?.by_name ?? []).reduce((a, r) => a + r.total, 0)
  const fromAds = (data?.by_name ?? []).reduce((a, r) => a + r.ads, 0)

  return (
    <main style={{ background: '#0a1222', minHeight: '100vh', color: '#e8edf6', fontFamily: FONT, padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, margin: '0 0 6px', color: GOLD }}>Конверсії</h1>
        <p style={{ margin: '0 0 18px', color: '#9fb0cc', fontSize: 15, maxWidth: 760 }}>
          Змістовні дії відвідувачів, які рахує Google Ad Grants: підписка, заявки, пожертва, реєстрація, завантаження PDF.
          Перегляди й прокрутка сюди не входять — за правилами гранту це не конверсії.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              fontFamily: FONT, fontSize: 15, padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${days === d ? GOLD : '#24324d'}`, background: days === d ? GOLD : 'transparent',
              color: days === d ? '#0a1222' : '#e8edf6', fontWeight: 700,
            }}>{d} днів</button>
          ))}
        </div>

        {loading && <p>Завантаження…</p>}
        {data?.error && <p style={{ color: '#ef4444' }}>{data.error}</p>}

        {!loading && data && !data.error && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
              <div style={card}><div style={{ color: '#9fb0cc', fontSize: 13 }}>УСІ КОНВЕРСІЇ</div><div style={{ fontSize: 34, fontWeight: 800, color: GOLD }}>{total}</div></div>
              <div style={card}><div style={{ color: '#9fb0cc', fontSize: 13 }}>З РЕКЛАМИ GOOGLE</div><div style={{ fontSize: 34, fontWeight: 800, color: GOLD }}>{fromAds}</div></div>
            </div>

            <section style={card}>
              <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>За видом дії</h2>
              {data.conv_error ? (
                <p style={{ color: '#ef4444' }}>Таблиці conversion_events ще немає або помилка: {data.conv_error}</p>
              ) : (data.by_name ?? []).length === 0 ? (
                <p style={{ color: '#9fb0cc' }}>Поки жодної конверсії за цей період.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Дія</th><th style={{ ...th, textAlign: 'right' }}>За період</th><th style={{ ...th, textAlign: 'right' }}>За 7 днів</th><th style={{ ...th, textAlign: 'right' }}>З реклами</th></tr></thead>
                  <tbody>
                    {(data.by_name ?? []).map((r) => (
                      <tr key={r.name}><td style={td}>{label(r.name)}</td><td style={num}>{r.total}</td><td style={num}>{r.d7}</td><td style={num}>{r.ads}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>Звідки прийшли ті, хто зробив дію</h2>
              {(data.by_source ?? []).length === 0 ? <p style={{ color: '#9fb0cc' }}>Немає даних.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Джерело</th><th style={th}>Дія</th><th style={{ ...th, textAlign: 'right' }}>Кількість</th></tr></thead>
                  <tbody>
                    {(data.by_source ?? []).map((r, i) => (
                      <tr key={i}><td style={td}>{srcLabel(r.source)}</td><td style={td}>{label(r.name)}</td><td style={num}>{r.n}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>Відвідування сторінок, куди веде реклама</h2>
              {data.lp_error ? <p style={{ color: '#ef4444' }}>{data.lp_error}</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Сторінка</th><th style={{ ...th, textAlign: 'right' }}>Сесій за період</th><th style={{ ...th, textAlign: 'right' }}>За 7 днів</th></tr></thead>
                  <tbody>
                    {(data.landings ?? []).map((r) => (
                      <tr key={r.url}><td style={td}><a href={r.url} target="_blank" rel="noreferrer" style={{ color: GOLD }}>{r.url}</a></td><td style={num}>{r.sessions}</td><td style={num}>{r.d7}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>Члени Клубу Балабонів{typeof data.klub_total === 'number' ? ` — ${data.klub_total}` : ''}</h2>
              {data.klub_error ? <p style={{ color: '#ef4444' }}>{data.klub_error}</p> : (data.klub ?? []).length === 0 ? <p style={{ color: '#9fb0cc' }}>Поки ніхто не вступив.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Коли</th><th style={th}>Ім'я</th><th style={th}>Пошта</th><th style={th}>Хто</th><th style={th}>Джерело</th></tr></thead>
                  <tbody>
                    {(data.klub ?? []).map((m, i) => (
                      <tr key={i}>
                        <td style={td}>{new Date(m.created_at).toLocaleDateString('uk-UA')}</td>
                        <td style={td}>{m.name}</td>
                        <td style={td}><a href={`mailto:${m.email}`} style={{ color: GOLD }}>{m.email}</a></td>
                        <td style={td}>{m.role === 'author' ? 'Автор' : m.role === 'both' ? 'Читач і автор' : 'Читач'}</td>
                        <td style={td}>{srcLabel(m.source ?? 'невідомо')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 18, margin: '0 0 10px' }}>Останні 50 дій</h2>
              {(data.recent ?? []).length === 0 ? <p style={{ color: '#9fb0cc' }}>Поки порожньо.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Коли</th><th style={th}>Дія</th><th style={th}>Сторінка</th><th style={th}>Джерело</th></tr></thead>
                  <tbody>
                    {(data.recent ?? []).map((r, i) => (
                      <tr key={i}>
                        <td style={td}>{new Date(r.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={td}>{label(r.name)}{r.detail ? <span style={{ color: '#9fb0cc' }}> · {r.detail}</span> : null}</td>
                        <td style={td}>{r.path}</td>
                        <td style={td}>{srcLabel(r.source ?? 'невідомо')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
