'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { trackStoryEvent } from '@/lib/analytics'

interface Props {
  url: string
  title: string
  storyId?: string
  season?: number
  /**
   * Компактний вигляд — для панелі дій під текстом серії (ReaderActions).
   * Прибирає верхню лінію і лейбл капсом: усередині панелі вони зайві,
   * бо коробка вже відокремлює блок сама, а капс золотим кричав голосніше
   * за кнопку «наступна серія».
   */
  compact?: boolean
}

function FBIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg> }
function TGIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> }
function WAIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> }
// Офіційний контур Viber (simple-icons). Доти тут було просто коло з
// телефонною трубкою — узагальнений значок «дзвінок», у якому Viber
// не впізнавався.
function ViberIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z"/></svg> }
function MailIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg> }
function ShareIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></svg> }
function LinkIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> }
function CheckIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }

type BtnDef = {
  label: string
  Icon: () => ReactElement
  href: (u: string, t: string) => string
}

// Контури брендів — офіційні (simple-icons): свої, намальовані на око,
// читалися як узагальнені значки й не впізнавалися.
// Набір переглянуто 16.09.2026 за принципом «кнопка робить те, що обіцяє».
// ПРИБРАНО: Instagram (share-url не приймає зовнішніх посилань — кнопка
// вела на профіль balabony_, а не на твір) і TikTok (tiktok.com/share?url=
// не пересилає посилання, а просто відкриває сайт TikTok).
// ДОДАНО: пошта — єдиний канал Balabony з доведеною віддачею, і саме нею
// пересилають читачі, що прийшли з газетного QR і з розсилки.
const BTNS: BtnDef[] = [
  { label: 'Telegram',  Icon: TGIcon,     href: (u, t) => `https://t.me/share/url?url=${u}&text=${t}` },
  { label: 'Viber',     Icon: ViberIcon,  href: (u, t) => `viber://forward?text=${t}%20${u}` },
  { label: 'WhatsApp',  Icon: WAIcon,     href: (u, t) => `https://wa.me/?text=${t}%20${u}` },
  { label: 'Facebook',  Icon: FBIcon,     href: (u)    => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { label: 'Пошта',     Icon: MailIcon,   href: (u, t) => `mailto:?subject=${t}&body=${t}%0A%0A${u}` },
]

export default function ShareButtons({ url, title, storyId, season, compact = false }: Props) {
  // Системне «Поділитися» відкриває меню телефона з усім, що в людини
  // встановлено, — Messenger, SMS, Signal і те, чого в нашому ряді немає.
  // Показуємо тільки там, де браузер його справді має: на десктопі
  // navigator.share здебільшого відсутній, і кнопка була б мертвою.
  // Перевірка в useEffect, а не під час рендера: інакше сервер і браузер
  // намалювали б різну розмітку і Next лаявся б на неспівпадіння.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => { setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function') }, [])

  const [copied, setCopied] = useState(false)
  const [bonusMsg, setBonusMsg] = useState<string | null>(null)
  const eu = encodeURIComponent(url)
  const et = encodeURIComponent(title)

  // Record a referral share. +1 free story per UNIQUE story shared (max 5),
  // enforced server-side. Best-effort: never block the share itself.
  const recordReferral = async (channel: string) => {
    if (!storyId) return // referral reward applies to stories only
    try {
      const r = await fetch('/api/referral/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, season: season ?? null, channel }),
      })
      const d = await r.json().catch(() => null)
      if (d?.granted) {
        setBonusMsg(season != null
          ? 'Дякуємо! Відкрито +1 безкоштовну серію в цьому сезоні'
          : 'Дякуємо! Відкрито +1 безкоштовну історію')
        setTimeout(() => setBonusMsg(null), 4500)
      }
    } catch { /* silent — sharing must never break */ }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url })
      recordReferral('native')
    } catch { /* людина закрила меню — це не помилка */ }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
    recordReferral('copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div
      className={compact ? 'share-row share-row-compact' : 'share-row'}
      aria-label={compact ? 'Поділитися посиланням' : undefined}
    >
      {/* У компактному вигляді підпису немає зовсім: будь-яке слово з'їдало
          місце, і останні іконки — TikTok та копіювання посилання — або
          ховалися під плаваючими кнопками, або падали на другий рядок.
          Значки соцмереж упізнавані без підпису, а звільненого ним місця
          рівно стільки, щоб усі сім стали в один рядок. Для екранних читачів назва лишається в aria-label ряду і
          в title кожної кнопки. */}
      {!compact && <span className="share-label">ПОДІЛИТИСЬ:</span>}
      {canShare && (
        <button
          type="button"
          onClick={() => void nativeShare()}
          title="Поділитися"
          aria-label="Поділитися"
          className="share-btn share-btn-native"
        >
          <ShareIcon />
        </button>
      )}
      {BTNS.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href(eu, et)}
          /* mailto: у новій вкладці лишає по собі порожню вкладку —
             поштова програма відкривається, а браузер тримає пустку. */
          target={label === 'Пошта' ? undefined : '_blank'}
          rel={label === 'Пошта' ? undefined : 'noopener noreferrer'}
          title={label}
          onClick={() => { trackStoryEvent(storyId ?? url, title, 'share'); recordReferral(label) }}
          className="share-btn"
        >
          <Icon />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        title="Копіювати посилання"
        className={copied ? 'share-btn share-btn-copy is-copied' : 'share-btn share-btn-copy'}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>

      {bonusMsg && <span className="share-bonus" role="status">{bonusMsg}</span>}

      <style jsx>{`
        .share-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .share-label {
          flex-basis: 100%;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: rgba(239, 159, 39, 0.85);
          margin: 0 0 10px;
        }
        .share-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(239, 159, 39, 0.1);
          border: 1px solid rgba(239, 159, 39, 0.3);
          color: #EF9F27;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          text-decoration: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .share-btn:hover {
          background: #EF9F27;
          color: #FFFFFF;
          border-color: #EF9F27;
          transform: translateY(-2px);
        }
        .share-btn-copy.is-copied {
          background: #EF9F27;
          color: #FFFFFF;
          border-color: #EF9F27;
        }
        .share-row-compact {
          padding-top: 0;
          border-top: none;
          gap: 6px;
          /* Праворуч висять плаваючі кнопки «Аа» і «↑» (position: fixed,
             right: 14px, ширина 48px). На панель вони заходять приблизно
             на 26px — цього відступу досить, щоб не накривати TikTok і
             копіювання посилання, а копіювання тут найкорисніше. */
          padding-right: 30px;
        }
        .share-row-compact .share-label {
          flex-basis: auto;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0;
          text-transform: none;
          color: #94a3b8;
          margin: 0 3px 0 0;
        }
        .share-row-compact .share-btn {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.14);
          color: #d8d2c6;
        }
        .share-row-compact .share-btn-native {
          background: rgba(239, 159, 39, 0.14);
          border-color: rgba(239, 159, 39, 0.5);
          color: #EF9F27;
        }
        .share-row-compact .share-btn:hover {
          background: #EF9F27;
          border-color: #EF9F27;
          color: #FFFFFF;
        }
        .share-bonus {
          flex-basis: 100%;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #2e9e5b;
        }
      `}</style>
    </div>
  )
}
