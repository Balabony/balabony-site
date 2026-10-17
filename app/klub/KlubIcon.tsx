/**
 * Фірмові значки клубу (17.10.2026): золота лінія на темно-синьому медальйоні
 * з подвійним золотим обідком — як медальйон «B» на обкладинках Балабонів.
 * Без емодзі й шаблонних іконок — рішення Богдана.
 */
type Kind = 'lyst' | 'konkurs' | 'kalendar' | 'avtor' | 'znachok' | 'chytannia'

const PATHS: Record<Kind, React.ReactNode> = {
  // розгорнута книжка з дзвоником-балабончиком над нею
  lyst: (<>
    <path d="M14 34c6-3 12-3 18 1 6-4 12-4 18-1v14c-6-3-12-3-18 1-6-4-12-4-18-1z" />
    <path d="M32 35v14" />
    <path d="M28 25c0-3 1.8-5 4-5s4 2 4 5v3h-8z" />
    <path d="M27 28h10" /><circle cx="32" cy="18" r="1.6" />
  </>),
  // лавровий вінок і зірка
  konkurs: (<>
    <path d="M22 46c-6-5-8-13-5-21" /><path d="M42 46c6-5 8-13 5-21" />
    <path d="M18 31l-4-2M17 37l-4 0M19 42l-3 2M46 31l4-2M47 37l4 0M45 42l3 2" />
    <path d="M32 22l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    <path d="M27 48h10" />
  </>),
  // календар із вишиваним ромбом
  kalendar: (<>
    <rect x="17" y="21" width="30" height="27" rx="3" />
    <path d="M17 29h30M24 17v7M40 17v7" />
    <path d="M32 33l5 5-5 5-5-5z" /><path d="M32 36.5l1.5 1.5-1.5 1.5-1.5-1.5z" />
  </>),
  // перо-стилус
  avtor: (<>
    <path d="M43 17c-10 2-17 10-20 22l-2 8 8-2c12-3 20-10 22-20z" />
    <path d="M21 47l12-12" /><path d="M30 26l8 8" />
    <path d="M15 48h12" />
  </>),
  // значок-орден
  znachok: (<>
    <path d="M26 16l-4 14M38 16l4 14" />
    <circle cx="32" cy="38" r="10" />
    <path d="M32 33l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" />
  </>),
  // відкритий замочок і сторінка
  chytannia: (<>
    <rect x="18" y="30" width="20" height="17" rx="3" />
    <path d="M23 30v-5a6 6 0 0 1 11.5-2.4" />
    <path d="M28 37v4" />
    <path d="M42 22h6v26h-6" />
  </>),
}

export default function KlubIcon({ kind, size = 64 }: { kind: Kind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#0E1A2B" stroke="#EF9F27" strokeWidth="2" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#EF9F27" strokeOpacity=".35" strokeWidth="1" />
      <g fill="none" stroke="#FAC775" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {PATHS[kind]}
      </g>
    </svg>
  )
}
