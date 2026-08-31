// FILE: app/pro-balabony/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Двомовна сторінка «Про проєкт» (узгоджений текст для грантодавців). Інлайн-стилі.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про проєкт — Balabony",
  description:
    "Balabony — україномовна платформа історій і казок із пріоритетом доступності. Стан проєкту, технологія, місія. About the Balabony project (UA/EN).",
  alternates: { canonical: "https://balabony.com/pro-balabony" },
  openGraph: {
    title: "Про проєкт — Balabony",
    description:
      "Україномовна платформа історій і казок із пріоритетом доступності.",
    url: "https://balabony.com/pro-balabony",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2Style: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1c1917", margin: "0 0 10px" };
const sectionStyle: React.CSSProperties = { marginTop: 28 };
const pStyle: React.CSSProperties = { margin: "0 0 14px" };
const pLastStyle: React.CSSProperties = { margin: 0 };
const ulStyle: React.CSSProperties = { margin: "0 0 6px", paddingLeft: 20 };
const liStyle: React.CSSProperties = { margin: "0 0 6px" };
const tag: React.CSSProperties = { fontSize: 13, color: "#78716c", letterSpacing: "0.5px", margin: "0 0 16px" };
const langLink: React.CSSProperties = { color: "#B5710C", fontWeight: 700, textDecoration: "none", fontSize: 14 };
const ctaStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 8, padding: "11px 20px",
  background: "#1c1917", color: "#f6f1e7", borderRadius: 10,
  textDecoration: "none", fontSize: 15, fontWeight: 700,
};

export default function ProBalabonyPage() {
  return (
    <main style={{ background: "#161412", padding: "48px 16px calc(88px + env(safe-area-inset-bottom, 0px))" }}>
      <article
        style={{
          maxWidth: 768, margin: "0 auto", background: "#f6f1e7", color: "#292524",
          borderRadius: 16, padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", fontSize: 16, lineHeight: 1.65,
        }}
      >
        <div style={{ marginBottom: 18, fontSize: 14, color: "#78716c" }}>
          <a href="#uk" style={langLink}>Українською</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="#en" style={langLink}>English</a>
        </div>

        {/* ───────────── УКРАЇНСЬКОЮ ───────────── */}
        <section id="uk">
          <p style={tag}>Доступність передусім · Українська мова · EdTech</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, color: "#1c1917", margin: 0 }}>
            Balabony — українські історії та казки для кожного
          </h1>

          <section style={sectionStyle}>
            <p style={pStyle}>
              Ми створюємо Balabony — україномовну платформу історій і казок, які можна читати, а згодом — і слухати.
              Її особливість — голосовий доступ (Zero-UI): користуватися платформою можна переважно
              голосом, слухати й керувати нею, кажучи що робити, майже не торкаючись екрана.
            </p>
            <p style={pLastStyle}>
              Наша мета — повернути доступ до української літератури, грамотності й когнітивного розвитку
              тим, кого залишає позаду звичайний інтерфейс: родинам внутрішньо переміщених осіб, ветеранам,
              людям старшого віку та людям з інвалідністю.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Проблема</h2>
            <p style={pLastStyle}>
              Мільйони українців відрізані від культури й навчання не браком контенту, а інтерфейсом, яким
              вони не можуть скористатися: малі екрани, застосунки «спочатку текст», обмежений зір чи
              моторика, низька цифрова грамотність. Війна поглибила це — діти переміщених і прифронтових
              родин втратили стабільне навчання, а багато ізольованих читачів не мають зручного способу
              дотягтися до україномовного контенту взагалі.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Рішення</h2>
            <p style={pStyle}>
              Платформа будується навколо голосового керування (Zero-UI) — підходу, за якого людина слухає
              й керує голосом, а екран та кнопки зведено до мінімуму. Це робить літературу й навчання
              доступними «без рук» і «майже без екрана» — для дитини без стабільної школи, ветерана у
              відновленні, читача старшого віку чи людини з порушеннями зору або моторики.
            </p>
            <p style={{ margin: "0 0 8px" }}>Ми поєднуємо:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>оригінальні українські історії та казки (текст; аудіоозвучення — у розробці);</li>
              <li style={liStyle}>практичний довідник українського правопису — простими словами, з окремою дитячою версією (вже доступний на платформі);</li>
              <li style={liStyle}>когнітивні ігри — вправи на увагу, пам’ять, мову й логіку;</li>
              <li style={liStyle}>дизайн із пріоритетом доступності (WCAG 2.1 AA);</li>
              <li style={liStyle}>офлайн-міст: QR-коди в друкованих газетах з’єднують родини без надійного інтернету з аудіоконтентом через будь-який смартфон із камерою.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Когнітивні ігри</h2>
            <p style={pLastStyle}>
              Окрім читання й слухання, Balabony пропонує набір когнітивних ігор для тренування уваги,
              пам’яті, мови та логічного мислення, побудованих на українському мовному й культурному
              матеріалі. Серед них — вправи на робочу пам’ять і словесну побіжність, ігри на просторове
              мислення та зосередженість, а також класичні логічні ігри (шахи, шашки, доміно, судоку, нарди)
              з кількома рівнями складності. Ігри підходять різному віку — від дітей, які опановують грамоту,
              до старших користувачів, що хочуть тримати розум активним. Це частина того самого
              україномовного середовища, а не окремий продукт.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Кому це служить</h2>
            <p style={pStyle}>
              За офіційними даними, аудиторія охоплює близько 4,6 млн внутрішньо переміщених осіб,
              близько 5,6 млн українців за кордоном, близько 5,7 млн дітей, понад 1,3 млн ветеранів (УБД), близько 3,4 млн людей з інвалідністю та
              близько 10,2 млн пенсіонерів, а також родини в сільській місцевості без надійного доступу до
              інтернету. Категорії частково перетинаються, тож це не сума, а масштаб потреби, яку звичайний
              інтерфейс залишає позаду.
            </p>
            <p style={{ ...pLastStyle, fontSize: 13, color: "#78716c" }}>
              Джерела: Мінсоцполітики, Мінветеранів, Пенсійний фонд України, Центр економічної стратегії, UNICEF
              (дані 2025–2026).
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Технологія</h2>
            <p style={pLastStyle}>
              ШІ-шар голосу й читання (україномовний синтез мовлення, голосова навігація, адаптивне читання)
              — у розробці. Чинна основа платформи вже працює, зокрема довідник правопису та когнітивні ігри;
              технологічна готовність — рівень TRL 6.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Що нас вирізняє</h2>
            <p style={pLastStyle}>
              20+ років роботи з найменш охопленими громадами України та власна мережа поширення: чотири
              друковані видання накладом близько 1,56 млн примірників на рік, які розповсюджує «Укрпошта».
              Ця мережа — міст від друкованого читача до цифрової платформи через QR-коди.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Вплив</h2>
            <p style={{ margin: "0 0 10px" }}>Прямий внесок у Цілі сталого розвитку ООН:</p>
            <p style={{ ...pStyle, fontWeight: 700, margin: "0 0 2px" }}>ЦСР 4 — Якісна освіта</p>
            <p style={pStyle}>Повернення грамотності й доступу до україномовного контенту дітям, яких зачепила війна.</p>
            <p style={{ ...pStyle, fontWeight: 700, margin: "0 0 2px" }}>ЦСР 10 — Зменшення нерівності</p>
            <p style={pLastStyle}>Доступність передусім — для тих, кого виключає інвалідність, вік чи цифровий розрив.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Прозорість і соціальна місія</h2>
            <p style={pLastStyle}>
              Balabony — соціальний проєкт. Ми дотримуємося принципу роздільного обліку грантового
              фінансування та доходів платформи: грантові й донорські кошти спрямовуються виключно на
              місійні цілі (пільговий доступ для вразливих груп, створення доступного контенту, який
              відповідає міжнародним стандартам, проведення тестувань та виконання інших завдань, які
              відповідають місії ГО) і не змішуються з комерційними доходами від передплат. Це забезпечує цільове
              використання коштів грантодавців і прозору звітність.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Статус</h2>
            <p style={pStyle}>
              Платформа побудована й публічно доступна; це етап перед повним запуском. Терміни запуску
              залежать від грантового фінансування проєкту та підтримки благодійників.
            </p>
            <a href="/support" style={ctaStyle}>Підтримати проєкт →</a>
          </section>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #d6ccb8", margin: "44px 0" }} />

        {/* ───────────── ENGLISH ───────────── */}
        <section id="en">
          <p style={tag}>Accessibility-first · Ukrainian language · EdTech</p>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, color: "#1c1917", margin: 0 }}>
            Balabony — Ukrainian stories and tales for everyone
          </h1>

          <section style={sectionStyle}>
            <p style={pStyle}>
              We are creating Balabony — a Ukrainian-language platform of stories and tales that can be read,
              with listening to follow. Its distinctive feature is voice-first access (Zero-UI): you can use the
              platform mostly by voice — listening and giving spoken commands, almost without touching the
              screen.
            </p>
            <p style={pLastStyle}>
              Our goal is to restore access to Ukrainian literature, literacy and cognitive development for
              the people the ordinary interface leaves behind: displaced families, veterans, older people and
              people with disabilities.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>The problem</h2>
            <p style={pLastStyle}>
              Millions of Ukrainians are cut off from culture and learning not by a lack of content, but by
              an interface they cannot use: small screens, text-first apps, limited vision or motor ability,
              low digital literacy. The war has deepened this — children of displaced and frontline families
              have lost stable schooling, and many isolated readers have no comfortable way to reach
              Ukrainian-language content at all.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>The solution</h2>
            <p style={pStyle}>
              The platform is being built around voice-first control (Zero-UI) — an approach where the person
              listens and navigates by voice, with the screen and buttons reduced to a minimum. This makes
              literature and learning usable hands-free and almost screen-free — for a child without a stable
              school, a veteran in recovery, an older reader, or a person with a vision or motor impairment.
            </p>
            <p style={{ margin: "0 0 8px" }}>We bring together:</p>
            <ul style={ulStyle}>
              <li style={liStyle}>original Ukrainian stories and tales (text; audio narration in development);</li>
              <li style={liStyle}>a practical Ukrainian spelling guide — in plain language, with a separate children’s version (already available on the platform);</li>
              <li style={liStyle}>cognitive games — exercises for attention, memory, language and logic;</li>
              <li style={liStyle}>accessibility-first design (WCAG 2.1 AA);</li>
              <li style={liStyle}>an offline bridge: QR codes printed in our newspapers connect families without reliable internet to audio content through any camera phone.</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Cognitive games</h2>
            <p style={pLastStyle}>
              Beyond reading and listening, Balabony offers a set of cognitive games for training attention,
              memory, language and logical thinking, built on Ukrainian language and cultural material. They
              include exercises for working memory and verbal fluency, games for spatial thinking and focus,
              and classic logic games (chess, draughts, dominoes, sudoku, backgammon) with several difficulty
              levels. The games suit different ages — from children learning to read to older users who want
              to keep their minds active. They are part of the same Ukrainian-language environment, not a
              separate product.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Who it serves</h2>
            <p style={pStyle}>
              According to official data, the audience spans around 4.6 million internally displaced people,
              around 5.6 million Ukrainians abroad, around 5.7 million children, over 1.3 million veterans (UBD), around 3.4 million people with
              disabilities, and around 10.2 million pensioners — plus families in rural areas without reliable
              internet access. These groups overlap, so this is not a sum but the scale of the need that the
              ordinary interface leaves behind.
            </p>
            <p style={{ ...pLastStyle, fontSize: 13, color: "#78716c" }}>
              Sources: Ministry of Social Policy, Ministry of Veterans Affairs, Pension Fund of Ukraine,
              Centre for Economic Strategy, UNICEF (2025–2026 data).
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Technology</h2>
            <p style={pLastStyle}>
              The AI voice and reading layer — Ukrainian-language speech synthesis, voice navigation, and
              adaptive reading — is in development. The platform’s working foundation is already live,
              including the Ukrainian spelling guide and the cognitive games; technology readiness is at
              TRL 6.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>What sets us apart</h2>
            <p style={pLastStyle}>
              Over 20 years of work with Ukraine’s least-reached communities and our own distribution
              network: four print titles with a circulation of around 1.56 million copies per year,
              distributed by the national postal service. This network is a bridge from print readers to the
              digital platform through QR codes.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Impact</h2>
            <p style={{ margin: "0 0 10px" }}>A direct contribution to the UN Sustainable Development Goals:</p>
            <p style={{ ...pStyle, fontWeight: 700, margin: "0 0 2px" }}>SDG 4 — Quality Education</p>
            <p style={pStyle}>Restoring access to Ukrainian-language literature for people affected by the war: veterans, people with disabilities and internally displaced families.</p>
            <p style={{ ...pStyle, fontWeight: 700, margin: "0 0 2px" }}>SDG 10 — Reduced Inequalities</p>
            <p style={pLastStyle}>Accessibility-first access for people excluded by disability, age or the digital divide.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Transparency and social mission</h2>
            <p style={pLastStyle}>
              Balabony is a social project. We maintain a principle of separate accounting for grant funding
              and platform revenue: grant and donor funds are directed exclusively to mission purposes (reduced-cost
              access for vulnerable groups, the creation of accessible content that meets international
              standards, running pilot tests, and other activities aligned with the NGO’s mission) and are
              not mixed with commercial subscription revenue. This ensures the targeted use of funders’ money
              and transparent reporting.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Status</h2>
            <p style={pStyle}>
              The platform is built and publicly accessible; this is the stage before full launch. The launch
              timeline depends on grant funding for the project and the support of donors.
            </p>
            <a href="/support?lang=en" style={ctaStyle}>Support the project →</a>
          </section>
        </section>
      </article>
    </main>
  );
}
