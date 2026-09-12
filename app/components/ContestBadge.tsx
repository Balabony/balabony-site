const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

/**
 * Позначка конкурсного твору вгорі сторінки (рішення Богдана 12.09.2026).
 *
 * Навіщо саме тут і саме вгорі. Конкурсні роботи свідомо виведені з-під
 * реєстраційної стіни: в умовах записано, що вони не блокуються нічим, і
 * Ad Grants жене платний трафік саме на них. Але за нульовою умовою
 * підрахунку (lib/contest-reads.ts) дочитування зараховується в конкурс
 * ЛИШЕ з акаунта — гості відсіюються join-ом із users.
 *
 * Виходило нечесно: ми зняли з цих творів усі перепони, а сказати читачеві,
 * що без входу його дочитування авторові в конкурсі не дасть нічого, забули.
 * Плашка це виправляє — і водночас це найсильніша точка входу на сайті, бо
 * за нею стоїть не абстрактна винагорода, а місце автора в конкурсі.
 *
 * Серверний компонент: нічого не рахує, нічого не слухає, нуль JavaScript.
 */
export default function ContestBadge({
  contestName,
  guest,
  path,
}: {
  contestName: string
  /** Читач не в акаунті — тоді додаємо рядок про зарахування і кнопку. */
  guest: boolean
  /** Куди повернути після входу — адреса цього ж твору. */
  path: string
}) {
  return (
    <section
      aria-label="Конкурсний твір"
      style={{
        marginTop: 24, padding: '13px 16px', borderRadius: 10,
        background: 'rgba(239,159,39,0.09)',
        border: '1px solid rgba(239,159,39,0.24)',
        borderLeft: `3px solid ${GOLD}`,
        fontFamily: FONT, fontSize: 13.5, lineHeight: 1.6,
        color: 'var(--on-dark-muted)',
      }}
    >
      <div style={{ color: '#FFF8EE', fontWeight: 700, fontSize: 14 }}>
        Конкурсний твір · {contestName}
      </div>

      <div style={{ marginTop: 5 }}>
        Читається вільно й до кінця — конкурсні роботи не закриваються нічим.
      </div>

      {guest && (
        <>
          <div style={{ marginTop: 7 }}>
            Але в конкурс зараховують дочитування лише з акаунта. Прочитане гостем
            авторові тут не допоможе.
          </div>
          <a
            href={`/login?next=${encodeURIComponent(path)}`}
            style={{
              display: 'inline-block', marginTop: 11,
              background: GOLD, color: '#0a1628',
              fontWeight: 800, fontSize: 13.5,
              padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
            }}
          >
            Увійти, щоб дочитування зарахувалося
          </a>
        </>
      )}
    </section>
  )
}
