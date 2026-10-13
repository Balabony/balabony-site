import { findContest, type ContestId } from '@/lib/contests'
import { REQUIREMENTS } from '@/lib/contest-ai-review'

/**
 * Умови конкурсу й інструкція «як оцінювати» — поруч із текстом у кабінеті
 * редактора (рішення Богдана 13.10.2026: «поруч мають бути всі інструкції»).
 *
 * Вимоги беремо з того самого переліку, за яким оцінює ШІ (REQUIREMENTS у
 * lib/contest-ai-review.ts), — так редактор і ШІ дивляться на ті самі умови.
 * Обсяги й дати — з lib/contests.ts, як і на /konkursy. Повні умови — за
 * посиланням на сторінку конкурсу.
 */

const GOLD_L = '#FAC775', CREAM = '#FFF8EE', MUTED = '#8CA0B8', LINE = 'rgba(255,255,255,.10)', CARD = '#0f1f38'

const ANCHOR: Record<string, string> = {
  'ce-dovha-istoriya': 'dovha-istoriya',
  'pyat-vechoriv': 'pyat-vechoriv',
  'odyn-den': 'odyn-den',
  'z-viterczem': 'z-viterczem',
  'odnoho-razu-pered-rizdvom': 'odnoho-razu-pered-rizdvom',
}

// Розгорнута шкала до шести критеріїв форми оцінки. Числа — ті самі, що у формі.
const GUIDE: { label: string; max: number; zero: string; half: string; full: string }[] = [
  { label: 'Сюжет', max: 12,
    zero: 'нічого не відбувається; набір сцен або роздумів без події.',
    half: 'є подія й розвиток, але передбачувано або з провисаннями.',
    full: 'історія тримає від початку до кінця, події випливають одна з одної, є напруга.' },
  { label: 'Мова', max: 12,
    zero: 'багато помилок, русизмів і канцеляриту; читати важко.',
    half: 'грамотно, але рівно й безбарвно; трапляються кальки та штампи.',
    full: 'жива, точна українська; ритм, власний голос, діалоги звучать природно.' },
  { label: 'Характери', max: 8,
    zero: 'герої — функції, без мотивів і мови.',
    half: 'головного героя видно, решта пласкі.',
    full: 'герої впізнавані, діють зі своїх причин, змінюються.' },
  { label: 'Композиція', max: 8,
    zero: 'початок і кінець не пов’язані; зайві сцени, плутанина.',
    half: 'загалом цілісно, але є затягнуті або поспішні місця.',
    full: 'кожна частина на своєму місці, темп рівний, нічого зайвого.' },
  { label: 'Фінал', max: 6,
    zero: 'обрив, пояснення замість розв’язки або фінал «з нізвідки».',
    half: 'історію закрито, але передбачувано.',
    full: 'несподівано й чесно: усі підказки були в тексті.' },
  { label: 'Гачок', max: 4,
    zero: 'перший абзац не тримає; у серіях — кінець серії без причини читати далі.',
    half: 'цікаво, але без справжньої події чи питання.',
    full: 'після першого абзацу (і після кожної серії) неможливо не читати далі.' },
]

export default function ContestBrief({ contest }: { contest: string }) {
  const c = findContest(contest)
  const reqs = REQUIREMENTS[contest as ContestId] ?? []
  const volume = c
    ? (c.volumeLabel ?? (c.episodes > 1 ? `${c.episodes} серій по ${c.minWords}–${c.maxWords} слів` : `${c.minWords}–${c.maxWords} слів`))
    : ''

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1rem 1.1rem', margin: '0 0 1.4rem' }}>
      <details open>
        <summary style={{ cursor: 'pointer', fontSize: 15, color: GOLD_L, fontWeight: 600 }}>Умови конкурсу й як оцінювати</summary>

        <div style={{ fontSize: 13.5, color: CREAM, lineHeight: 1.65, marginTop: '.8rem' }}>
          <div style={{ color: MUTED, marginBottom: '.4rem' }}>
            {c?.name ?? contest}{volume ? ` · обсяг: ${volume}` : ''}
          </div>

          <div style={{ fontWeight: 600, margin: '.6rem 0 .3rem' }}>Вимоги конкурсу — перевірте кожну:</div>
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {reqs.map((r) => <li key={r.id} style={{ marginBottom: '.25rem' }}>{r.text}</li>)}
            <li>Мова українська, оригінал, не переклад; текст новий (не публікувався на інших платформах).</li>
            <li>Штучний інтелект у тексті заборонений (лише перевірка правопису). Якщо є сумнів — не знижуйте бал за підозру, а напишіть про це в коментарі: редакція поговорить з автором.</li>
          </ol>

          <div style={{ fontWeight: 600, margin: '1rem 0 .3rem' }}>Як ставити бали</div>
          <p style={{ margin: '0 0 .5rem', color: MUTED }}>
            Цілі числа. 0 — критерій провалений, половина — звичайний рівень, максимум — запам’ятається.
            Оцінюйте текст, а не автора (ім’я вам не показується). Порушення умов конкурсу (обсяг, кількість серій, жанр)
            зазначте в коментарі — їх перевіряє й редакція. Подану оцінку змінити не можна.
          </p>
          {GUIDE.map((g) => (
            <div key={g.label} style={{ borderTop: `1px solid ${LINE}`, padding: '.45rem 0' }}>
              <b>{g.label}</b> <span style={{ color: MUTED }}>(0–{g.max})</span>
              <div><span style={{ color: MUTED }}>0:</span> {g.zero}</div>
              <div><span style={{ color: MUTED }}>{Math.round(g.max / 2)}:</span> {g.half}</div>
              <div><span style={{ color: MUTED }}>{g.max}:</span> {g.full}</div>
            </div>
          ))}
          <p style={{ margin: '.6rem 0 0', color: MUTED }}>
            Коментар — від 150 символів: що сильне, що слабке і чому такий бал. Його бачить лише редакція.
          </p>
          <p style={{ margin: '.4rem 0 0' }}>
            Повні умови: <a href={`/konkursy#${ANCHOR[contest] ?? ''}`} target="_blank" rel="noopener" style={{ color: GOLD_L }}>сторінка конкурсу</a>
          </p>
        </div>
      </details>
    </div>
  )
}
