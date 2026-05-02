'use client'

import { useState, useRef, useEffect } from 'react'

interface Song {
  id: number
  title: string
  artist: string
  lyrics: string
}

const SONGS: Song[] = [
  {
    id: 1,
    title: 'Ще не вмерла України',
    artist: 'Павло Чубинський / Михайло Вербицький',
    lyrics:
`Ще не вмерла України ні слава, ні воля,
Ще нам, браття молодії, усміхнеться доля.
Згинуть наші воріженьки, як роса на сонці,
Запануємо і ми, браття, у своїй сторонці.
Душу й тіло ми положим за нашу свободу,
І покажем, що ми, браття, козацького роду.
Душу й тіло ми положим за нашу свободу,
І покажем, що ми, браття, козацького роду.
Наливайся силою, стремися, крилами,
Бо вже час подняти вгору золоті знамена.
Між собою, браття, годі нам сваритись,
Пора з доброю надією до праці взяться.
Душу й тіло ми положим за нашу свободу,
І покажем, що ми, браття, козацького роду.
Душу й тіло ми положим за нашу свободу,
І покажем, що ми, браття, козацького роду.`,
  },
  {
    id: 2,
    title: 'Ніч яка місячна',
    artist: 'Михайло Старицький / Микола Лисенко',
    lyrics:
`Ніч яка місячна, зоряна, ясная!
Видно, хоч голки збирай.
Вийди, коханая, працею зморена,
Хоч на хвилиночку в гай.
Сядем укупочці тут під калиною,
І над панами я пан!
Глянь, моя рибонько, — срібною хвилею
Стелиться полем туман.
Гай чарівний, ніби променем всипаний,
Чи загадався, чи спить:
Ген на стрункій та високій осичині
Листя пестливо тремтить.
Небо незміряне всипане зорями,
Що то за Божа краса!
Перлами ясними ген під тополями
Грає краплиста роса.
Ти не лякайся, що ніженьки босії
Вмочиш в холодну росу:
Я тебе, вірная, аж до хатиноньки
Сам на руках однесу.`,
  },
  {
    id: 3,
    title: 'Розпрягайте, хлопці, коні',
    artist: 'Народна',
    lyrics:
`Розпрягайте, хлопці, коні
Та лягайте спочивать,
А я піду в сад зелений,
В сад криниченьку копать.
Копав, копав криниченьку
У вишневому саду...
Чи не вийде дівчинонька
Рано-вранці по воду?
Вийшла, вийшла дівчинонька
В сад вишневий воду брать,
А за нею козаченько
Веде коня напувать.
Просив, просив відеречка,
Вона йому не дала,
Дарив, дарив з руки перстень,
Вона його не взяла.
Знаю, знаю, дівчинонько,
Чим я тебе розгнівив:
Що я вчора ізвечора
Із другою говорив.
Вона ростом невеличка,
Ще й літами молода,
Руса коса до пояса,
В косі стрічка голуба.`,
  },
  {
    id: 4,
    title: 'Їхав козак за Дунай',
    artist: 'Семен Климовський',
    lyrics:
`Їхав козак за Дунай,
Сказав: «Дівчино, прощай!»
Ти, конику вороненький,
Неси та гуляй.
— Постій, постій, козаче!
Твоя дівчина плаче.
Як ти мене покидаєш —
Тільки подумай!
— Білих ручок не ламай,
Карих очей не стирай,
Мене з війни зо славою
К собі ожидай!
— Не хочу я нічого,
Тільки тебе одного.
Ти будь здоров, мій миленький,
А все пропадай!
— Царська служба — довг воїнський,
Їхати пора до військська,
Щоб границю захищати
Від лютих ворогів.
— І без тебе, мій любезний,
Враг ізгине лютий, дерзкий.`,
  },
  {
    id: 5,
    title: 'Несе Галя воду',
    artist: 'Народна',
    lyrics:
`Несе Галя воду,
Коромисло гнеться,
За нею Іванко,
Як барвінок, в'ється.
— Галю, ж моя Галю,
Дай води напиться,
Ти така хороша —
Дай хоч подивиться.
— Вода у ставочку,
Той піди напийся,
Я буду в садочку —
Прийди подивися.
— Прийшов у садочок,
Зозуля кувала,
А ти ж мене, Галю,
Та й не шанувала.
— Стелися, барвінку,
Буду поливати,
Вернися, Іванку,
Буду шанувати.
— Скільки не стелився,
Ти не поливала,
Скільки не вертався,
Ти не шанувала.
Несе Галя воду,
Коромисло гнеться,
За нею Іванко,
Як барвінок, в'ється.`,
  },
  {
    id: 6,
    title: 'Ой на горі та й женці жнуть',
    artist: 'Народна',
    lyrics:
`Ой на горі та й женці жнуть,
А попід горою, яром-долиною
Козаки йдуть.
Гей, долиною, гей, широкою,
Козаки йдуть.
Попереду Дорошенко
Веде своє військо,
Військо запорізьке, хорошенько.
Гей, долиною, гей, широкою,
Хорошенько.
А позаду Сагайдачний,
Що проміняв жінку
На тютюн та люльку, необачний.
Гей, долиною, гей, широкою,
Необачний.
Гей, вернися, Сагайдачний,
Візьми свою жінку,
Віддай тютюн-люльку, необачний!
Гей, долиною, гей, широкою,
Необачний!
Мені з жінкою не возиться,
А тютюн та люлька
Козаку в дорозі знадобиться!`,
  },
  {
    id: 7,
    title: 'Горіла сосна, палала',
    artist: 'Народна',
    lyrics:
`Горіла сосна, палала,
Під нею дівчина стояла.
Під нею дівчина стояла,
Русяву косу чесала.
— Ой коси, коси ж ви мої,
Довго служили ви мені.
Більше служить не будете,
Під білий вельон підете.
Під білий вельон, під хустку,
Більш не підеш ти за дружку.
Під білий вельон з кінцями,
Більш не підеш ти з хлопцями.
Горіла сосна, смерека,
Сподобав хлопець здалека.
Сподобавсь хлопець та й навік,
Тепер вже він мій чоловік.`,
  },
  {
    id: 8,
    title: 'Реве та стогне Дніпр широкий',
    artist: 'Тарас Шевченко / Данило Крижанівський',
    lyrics:
`Реве та стогне Дніпр широкий,
Сердитий вітер завива,
Додолу верби гне високі,
Горами хвилю підійма.
Додолу верби гне високі,
Горами хвилю підійма.
І блідий місяць на ту пору
Із хмари де-де виглядав,
Неначе човен в синім морі,
То виринав, то потопав.
Неначе човен в синім морі,
То виринав, то потопав.
Ще треті півні не співали,
Ніхто ніде не гомонів,
Сичі в гаю перекликались,
Та ясен раз у раз скрипів.
Сичі в гаю перекликались,
Та ясен раз у раз скрипів.`,
  },
  {
    id: 9,
    title: 'Стоїть гора високая',
    artist: 'Леонід Глібов / Микола Лисенко',
    lyrics:
`Стоїть гора високая,
Попід горою гай, гай...
Зелений гай, густесенький,
Неначе справді рай!
Під гаєм в'ється річенька,
Як скло, вода блищить,
Долиною зеленою
Кудись вона біжить.
Край берега у затишку
Прив'язані човни,
Там три верби схилилися,
Мов журяться вони.
Що пройде красне літечко,
Повіють холода,
Осиплеться з них листячко
І понесе вода.
Журюся й я над річкою...
Біжить вона, шумить;
А в мене бідне серденько
І мліє, і болить.
Ой річенько, голубонько!
Як хвилечки твої,
Пробігли дні щасливії
І радощі мої!`,
  },
  {
    id: 10,
    title: 'Місяць на небі, зіроньки сяють',
    artist: 'Народна',
    lyrics:
`Місяць на небі, зіроньки сяють,
Тихо по морю човен пливе.
В човні дівчина пісню співає,
А козак чує, серденько мре.
В човні дівчина пісню співає,
А козак чує, серденько мре.
Пісня та мила, пісня та люба,
Все про кохання, все про любов.
Як ми любились та й розійшлися,
Тепер навіки зійшлися знов.
Як ми любились та й розійшлися,
Тепер навіки зійшлися знов.
Як ми сиділи мило з тобою,
А місяць ясний світив до ніг.
Я все дивився у твої очі
І надивитись ніяк не міг.
Ой очі, очі, очі дівочі,
Темні, як нічка, ясні, як день!
Ви ж мені, очі, вік вкоротили,
Де ж ви навчились зводить людей?`,
  },
  {
    id: 11,
    title: 'Чорнії брови, карії очі',
    artist: 'Костянтин Думитрашко / Денис Бонковський',
    lyrics:
`Чорнії брови, карії очі,
Темні, як нічка, ясні, як день!
Ой очі, очі, очі дівочі,
Де ж ви навчились зводить людей?
Де ж ви навчились зводить людей?
Вас і немає, а ви мов тута,
Світите в душу, як дві зорі.
Чи в вас улита якась отрута,
Чи, може, справді ви знахарі?
Чи, може, справді ви знахарі?
Чорнії брови — стрічки шовкові,
Все б тільки вами я любувавсь,
Карії очі, очі дівочі,
Все б тільки я дивився на вас!
Все б тільки я дивився на вас!
Чорнії брови, карії очі!
Страшно дивитись весь час на вас:
Не будеш спати ні вдень, ні вночі,
Все будеш думать, очі, про вас.
Все будеш думать, очі, про вас.`,
  },
  {
    id: 12,
    title: 'Чом ти не прийшов',
    artist: 'Народна',
    lyrics:
`Чом ти не прийшов,
Як місяць зійшов?
Я тебе чекала.
Чи коня не мав,
Чи стежки не знав,
Мати не пускала?
І коня я мав,
І стежку я знав,
І мати пускала.
Найменша сестра,
Бодай не зросла,
Сідельце сховала.
А старша сестра
Сідельце знайшла,
Коня осідлала:
Поїдь, братику,
До дівчиноньки,
Що тебе чекала.
Тече річенька
Невеличенька,
Схочу — перескочу.
Віддайте мене,
Моя матінко,
За кого я хочу.`,
  },
  {
    id: 13,
    title: 'Гей, наливайте повнії чари',
    artist: 'Народна',
    lyrics:
`Гей, наливайте повнії чари,
Щоб через вінця лилося.
Щоб наша доля нас не цуралась,
Щоб краще в світі жилося.
Щоб наша доля нас не цуралась,
Щоб краще в світі жилося.
Вдармо об землю лихом-журбою,
Щоб стало всім веселіше!
Вип'єм за щастя, вип'єм за долю,
Вип'єм за все що миліше.
Вип'єм за щастя, вип'єм за долю,
Вип'єм за все що миліше.
Гей нумо, хлопці, славні молодці,
Чом ви сумні, невеселі?
Чи у шинкарки мало горілки,
Пива чи меду не стало?
Пиймо, панове, пиймо, братове,
Пиймо, поки іще п'ється!
Поки недоля нас не спіткала,
Поки ще лихо сміється.
Поки недоля нас не спіткала,
Поки ще лихо сміється.`,
  },
  {
    id: 14,
    title: 'Ой у вишневому садочку',
    artist: 'Народна',
    lyrics:
`Ой у вишневому садочку
Там соловейко щебетав,
Віть-віть-віть, тьох-тьох-тьох,
А-я-я, ох-ох-ох,
Там соловейко щебетав.
Ой у зеленому садочку
Козак дівчину вговоряв,
Віть-віть-віть, тьох-тьох-тьох,
А-я-я, ох-ох-ох,
Козак дівчину вговоряв.
— Ой ти, дівчино чорноброва,
А чи підеш ти за мене?
Віть-віть-віть, тьох-тьох-тьох,
А-я-я, ох-ох-ох,
А чи підеш ти за мене?
— Моя матуся тебе знає,
Ти той козак, що все гуляє.
Віть-віть-віть, тьох-тьох-тьох,
А-я-я, ох-ох-ох,
Ти той козак, що все гуляє.`,
  },
  {
    id: 15,
    title: 'Взяв би я бандуру',
    artist: 'Михайло Петренко',
    lyrics:
`Взяв би я бандуру
Та й заграв, що знав,
Через ту дівчину
Бандуристом став.
А все через очі,
Коли б я їх мав,
За ті карі очі
Душу я б віддав.
За ті карі очі
Душу я б віддав.
Марусино, серце,
Пожалій мене,
Візьми моє серце,
Дай мені своє.
Дай мені своє.
Маруся не чує,
Серця не дає,
З іншими жартує —
Жалю завдає.
Жалю завдає.
Де Крим за горами,
Де сонечко сяє,
Там моя голубка
З жалю завмирає.
З жалю завмирає.
Взяв би я бандуру
Та й заграв, що знав.
Через тії очі
Бандуристом став.`,
  },
  {
    id: 16,
    title: 'Якби мені черевички',
    artist: 'Народна',
    lyrics:
`Якби мені черевики,
То пішла б я на музики,
Горенько моє!
Черевиків немає,
А музика грає, грає,
Жалу завдає!
Ой піду я боса полем,
Пошукаю свою долю,
Доленько моя!
Глянь на мене, чорнобриву,
Моя доле неправдива,
Безталанна я!
Дівчаточка на музиках
У червоних черевиках,
Я світом нужу.
Без розкоші, без любові
Зношу свої чорні брови,
Сльози ллю, тужу.
Ой нехай б я вмерла змалку,
Не жила б я сиротою,
Доленько моя!
Не ходила б я безута
А сьогодні незамужня —
Безталанна я!`,
  },
  {
    id: 17,
    title: 'Дивлюсь я на небо',
    artist: 'Михайло Петренко',
    lyrics:
`Дивлюсь я на небо та й думку гадаю:
Чому я не сокіл, чому не літаю,
Чому мені, Боже, ти крилець не дав?
Я б землю покинув і в небо злітав.
Далеко за хмари, подальше од світу,
Шукать собі долі, на горе привіту
І ласки у зірок, у сонця просить,
У світлі їх яснім все горе втопить.
Бо долі ще змалку здаюсь я нелюбий,
Я наймит у неї, хлопцюга приблудний;
Чужий я у долі, чужий у людей:
Хіба ж хто кохає нерідних дітей?
Кохаюся з лихом, привіту не знаю
І гірко і марно свій вік коротаю,
І в горі спізнав я, що тільки одна —
Далекеє небо — моя сторона.`,
  },
  {
    id: 18,
    title: 'В саду гуляла',
    artist: 'Народна',
    lyrics:
`В саду гуляла,
Квіти збирала,
Тихенько пісню
Собі співала.
А місяць сяє,
Зорі мигають,
Коханий десь у полі
Гуляє.
Чекаю, жду я,
Все виглядаю,
Та все надаремно —
Сльози маю.
Вийди, вийди, милий,
Хоч на хвилину,
Ой, серце ниє,
За тобою гину.
Так я вечорами
Сиджу, чекаю,
Чи прийде, чи ні він —
Я не знаю.
А зорі сяють,
Ніч така тиха,
Тільки серце б'ється —
Любить ж лихо.`,
  },
]

export default function KaraokeSection() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showList, setShowList]       = useState(false)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const audioRef    = useRef<HTMLAudioElement>(null)
  const lyricsRef   = useRef<HTMLDivElement>(null)
  const durationRef = useRef(0)

  const song  = SONGS[selectedIdx]
  const lines = song.lyrics.split('\n')
  const audioSrc = `/karaoke/${String(song.id).padStart(2, '0')}.mp3`

  const activeIdx = playing && duration > 0
    ? Math.min(lines.length - 1, Math.floor((currentTime / duration) * lines.length))
    : -1

  useEffect(() => {
    if (lyricsRef.current && activeIdx >= 0) {
      const el = lyricsRef.current.children[activeIdx] as HTMLElement
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIdx])

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    durationRef.current = 0
    const audio = audioRef.current
    console.log('[karaoke] song change — audioRef.current:', audio ? 'exists' : 'NULL', 'new src:', audioSrc)
    if (audio) { audio.pause(); audio.currentTime = 0 }
  }, [selectedIdx])

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    console.log('[karaoke] loadedmetadata — src:', audio?.src, 'duration:', audio?.duration)
    const d = audio?.duration || 0
    setDuration(d)
    durationRef.current = d
  }

  const seekToLine = (lineIdx: number) => {
    const total = durationRef.current
    if (!total) return
    const time = (lineIdx / lines.length) * total
    const audio = audioRef.current
    if (audio) audio.currentTime = time
    setCurrentTime(time)
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) { console.log('[karaoke] toggle — audioRef.current is NULL'); return }
    console.log('[karaoke] toggle playing:', !playing, '— src:', audio.src, 'duration:', audio.duration, 'readyState:', audio.readyState)
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch((e) => console.log('[karaoke] play() failed:', e))
      setPlaying(true)
    }
  }

  const selectSong = (idx: number) => {
    setSelectedIdx(idx)
    setShowList(false)
  }

  const prev = () => setSelectedIdx(i => (i - 1 + SONGS.length) % SONGS.length)
  const next = () => setSelectedIdx(i => (i + 1) % SONGS.length)

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <section style={{ marginBottom: 56 }}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => {
          const audio = audioRef.current
          if (!audio) { console.log('[karaoke] timeupdate — audioRef.current is NULL'); return }
          const ct = audio.currentTime
          const d = audio.duration
          if (d && !durationRef.current) {
            setDuration(d)
            durationRef.current = d
            console.log('[karaoke] duration recovered in timeupdate:', d)
          }
          const idx = d > 0 ? Math.min(lines.length - 1, Math.floor((ct / d) * lines.length)) : -1
          console.log('[karaoke] time:', ct.toFixed(2), '/', d?.toFixed(2), '— activeIdx:', idx, '/ lines:', lines.length)
          setCurrentTime(ct)
        }}
        onDurationChange={handleLoadedMetadata}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
      />

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef9f27', display: 'block', marginBottom: 8 }}>
        Модуль 1
      </span>

      <div style={{ background: '#0f1e3a', borderRadius: 16, padding: '22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="#ef9f27" strokeWidth="1.5"/>
              <path d="M5 11a7 7 0 0014 0" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="9" y1="22" x2="15" y2="22" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#f5f0e8' }}>КАРАОКЕ</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8899bb' }}>
            {song.id} / {SONGS.length}
          </div>
        </div>

        {/* Song info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#f5f0e8', fontFamily: "'Lora', serif", lineHeight: 1.3, marginBottom: 4 }}>
            {song.title}
          </div>
          <div style={{ fontSize: 14, color: '#8899bb' }}>{song.artist}</div>
        </div>

        {/* Lyrics */}
        <div
          ref={lyricsRef}
          style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 18px', marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}
        >
          {lines.map((line, i) => {
            const isActive = i === activeIdx
            const isDone   = activeIdx >= 0 && i < activeIdx
            console.log('[karaoke] rendering line', i, 'activeIdx=', activeIdx, 'match=', isActive)
            return (
              <div
                key={i}
                onClick={() => seekToLine(i)}
                style={{
                  fontSize: isActive ? 22 : 18,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#D4A017' : isDone ? '#c8d4e8' : '#7a8fa8',
                  fontFamily: "'Lora', serif",
                  lineHeight: 1.9,
                  padding: '1px 0',
                  transition: 'all 0.35s ease',
                  minHeight: line === '' ? 10 : undefined,
                  cursor: 'pointer',
                }}
              >
                {line || ' '}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#ef9f27', width: `${progress}%`, transition: 'width 0.8s linear', borderRadius: 2 }}/>
        </div>

        {/* Nav + play */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={prev} style={{ width: 48, minHeight: 52, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#f5f0e8', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
            ‹
          </button>
          <button onClick={toggle} style={{ flex: 1, minHeight: 52, borderRadius: 10, border: 'none', background: '#ef9f27', color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
            {playing ? '❚❚  Пауза' : '▶  Співати'}
          </button>
          <button onClick={next} style={{ width: 48, minHeight: 52, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#f5f0e8', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
            ›
          </button>
        </div>

        {/* Song list toggle */}
        <button
          onClick={() => setShowList(s => !s)}
          style={{ width: '100%', minHeight: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)', color: '#8899bb', fontSize: 14, cursor: 'pointer' }}
        >
          {showList ? '▲ Сховати список' : `☰ Всі пісні (${SONGS.length})`}
        </button>

        {/* Song list */}
        {showList && (
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
            {SONGS.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => selectSong(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', cursor: 'pointer',
                  background: idx === selectedIdx ? 'rgba(239,159,39,0.12)' : 'transparent',
                  borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                  borderLeft: idx === selectedIdx ? '3px solid #ef9f27' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: 12, color: '#556688', width: 22, flexShrink: 0, textAlign: 'right' }}>
                  {String(s.id).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: idx === selectedIdx ? '#ef9f27' : '#f5f0e8', fontWeight: idx === selectedIdx ? 600 : 400, fontFamily: "'Lora', serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#556688', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.artist}
                  </div>
                </div>
                {idx === selectedIdx && (
                  <span style={{ fontSize: 10, color: '#ef9f27', flexShrink: 0 }}>▶</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
