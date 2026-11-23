// 23.11.2026: поради авторам за спостереженнями редакції щодо дочитуваності
// (довжина, назва, зачин, жанри, серіали). Посилання — з кабінету автора.
import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const GOLD = 'var(--accent-gold)'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', serif"
const TITLE = 'Що читають до кінця: поради авторам — Balabony™'
const DESC = 'П’ять порад авторам за тим, що читачі Balabony дочитують до кінця: довжина, назва, зачин, жанри та закінчення епізоду в серіалі.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/porady-avtoram' },
  openGraph: {
    type: 'website', url: 'https://balabony.com/porady-avtoram', title: TITLE, description: DESC,
    locale: 'uk_UA', siteName: 'Balabony™',
  },
}

function Card({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`p${n}-h`} style={{ background: '#0f1e3a', border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: '24px 26px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontFamily: FONT, marginBottom: 8 }}>Порада {n}</div>
      <h2 id={`p${n}-h`} style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: '#f5f0e8', margin: '0 0 14px', lineHeight: 1.3 }}>{title}</h2>
      {children}
    </section>
  )
}

const P = { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 12px' } as const
const NOTE = { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0, borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 } as const

export default function PoradyAvtoramPage() {
  return (
    <main style={{ background: '#0a1628', padding: '48px 20px 100px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Поради авторам' }]} />

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontFamily: FONT, marginBottom: 12 }}>Для авторів</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: '#f5f0e8', margin: '0 0 14px', lineHeight: 1.2 }}>Що читають до кінця</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, margin: 0 }}>
            Це не теорія, а спостереження редакції: де читачі Balabony дочитують, де кидають, і як невеликі зміни в тексті впливають на результат.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card n={1} title="До 500 слів">
            <p style={P}>Твори до 500 слів дочитують удвічі частіше, ніж тексти на 500–1000 слів, і майже вчетверо частіше, ніж тексти на 1000–2000 слів. Довгі твори теж можливі, але їм потрібен сильніший початок. Якщо ідея вміщується у 300–450 слів, не розтягуйте.</p>
            <p style={NOTE}>«Як Ялинка шукала прикрасу» (271 слово): дочитали 75 %. «Зимова казка» (1749 слів): 25 %.</p>
          </Card>

          <Card n={2} title="У назві має бути хтось або щось конкретне">
            <p style={P}>Найкраще відкривають і дочитують назви з героєм і дією: «Як Ведмежатко не проспало Різдво», «Кіт Мурко і дванадцять страв». Загальні назви на кшталт «Історія кохання» чи «Зимова казка» нічого не обіцяють. Назва — перше рішення читача: відкрити чи прогорнути.</p>
          </Card>

          <Card n={3} title="Три перші речення вирішують усе">
            <p style={P}>Найбільше читачів губиться в перших 25 % тексту. Найгірше працюють зачини з контексту, пояснень і цитат відомих людей. Найкраще працює початок із сцени чи деталі.</p>
            <p style={NOTE}>Зачин із дочитуваністю 71 %: «Я сидів за кухонним столом і дивився в сковорідку, на число 17, намальоване пожовклим майонезом на смаженій картоплі». Інтерв’ю, що починається цитатою з Руссо: 0 %.</p>
          </Card>

          <Card n={4} title="Виграють казки й особисті історії">
            <p style={P}>Стабільно дочитують короткі казки з героєм-твариною чи дитиною та життєві історії з несподіваною деталлю на початку. Інтерв’ю й довгі повчальні тексти, навіть на важливі теми, читають найгірше: читач приходить за емоцією та історією. Містика й драма працюють, якщо перші абзаци не затягнуті: твір на 1957 слів з цікавим зачином втратив 75 % читачів у перших 25 % тексту.</p>
          </Card>

          <Card n={5} title="Серіал: закінчуйте епізод на русі, а не на крапці">
            <p style={P}>Останнє речення епізоду найважливіше. Не підбивайте підсумок: поставте нове питання або поставте героя перед вибором. Так серіал «Око Дракона» майже без втрат тримає читача між серіями.</p>
          </Card>
        </div>

        <p style={{ ...P, marginTop: 28 }}>
          Готові до публікації? <a href="/become-author" style={{ color: GOLD, fontWeight: 700 }}>Стати автором</a> або <a href="/author/dashboard" style={{ color: GOLD, fontWeight: 700 }}>відкрити кабінет автора</a>.
        </p>
      </div>
    </main>
  )
}
