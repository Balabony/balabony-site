'use client'

import { useEffect, useRef, useState } from 'react'

// 4 sample questions from /survey (radio, radio, checkbox, textarea)
const PREVIEW_QUESTIONS = [
  { label: 'Як часто читаєте художню літературу?', type: 'radio' as const,    options: ['Щодня', 'Кілька разів на тиждень', 'Раз на місяць'] },
  { label: 'Чи слухаєте аудіоверсії?',              type: 'radio' as const,    options: ['Так, постійно', 'Іноді', 'Ні']                          },
  { label: 'Які жанри подобаються?',                type: 'checkbox' as const, options: ['Драма', 'Фантастика', 'Романи', 'Дитячі']             },
  { label: 'Чого не вистачає?',                     type: 'textarea' as const, options: []                                                       },
]

export default function SurveyPreviewSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            let start: number | null = null
            const duration = 1200
            const step = (ts: number) => {
              if (start === null) start = ts
              const elapsed = ts - start
              const pct = Math.min(100, Math.round((elapsed / duration) * 100))
              setProgress(pct)
              if (elapsed < duration) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef as any} className="survey-preview">
      <div className="survey-card">
        <div className="survey-head">
          <div className="survey-head-left">
            <div className="survey-icon">
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <rect x="12" y="10" width="32" height="38" rx="4" stroke="#EF9F27" strokeWidth="2" fill="none" />
                <rect x="20" y="6"  width="16" height="9"  rx="3" stroke="#EF9F27" strokeWidth="1.5" fill="none" />
                <line x1="20" y1="26" x2="36" y2="26" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="33" x2="36" y2="33" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="20" y1="40" x2="30" y2="40" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="survey-label">КОРОТКЕ ОПИТУВАННЯ</div>
              <h2 className="survey-title">Розкажи про себе — отримай нагороду</h2>
            </div>
          </div>
          <div className="survey-reward">+50 балів</div>
        </div>

        <p className="survey-lead">
          Допоможи нам стати кращими — три хвилини часу, повна анонімність,
          бонус одразу на твій рахунок.
        </p>

        <div className="survey-progress">
          <div className="survey-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="survey-progress-label">{progress}% завершено за 3 хвилини</span>

        <div className="survey-questions">
          {PREVIEW_QUESTIONS.map((q, i) => (
            <div key={i} className="survey-question">
              <div className="survey-q-num">{i + 1}</div>
              <div className="survey-q-body">
                <div className="survey-q-text">{q.label}</div>
                {q.type === 'radio' && (
                  <div className="survey-q-options">
                    {q.options.map((opt, j) => (
                      <span key={j} className="survey-q-chip">{opt}</span>
                    ))}
                  </div>
                )}
                {q.type === 'checkbox' && (
                  <div className="survey-q-options">
                    {q.options.map((opt, j) => (
                      <span key={j} className="survey-q-chip survey-q-chip-square">{opt}</span>
                    ))}
                  </div>
                )}
                {q.type === 'textarea' && (
                  <div className="survey-q-textarea">Твоя думка...</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <a href="/survey" target="_blank" className="survey-cta">
          Пройти опитування →
        </a>
      </div>

      <style jsx>{`
        .survey-preview {
          padding: 32px 0;
        }
        .survey-card {
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid rgba(239, 159, 39, 0.5);
          border-radius: 18px;
          padding: 32px;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        }
        .survey-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }
        .survey-head-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }
        .survey-icon {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: rgba(239, 159, 39, 0.1);
          border: 1.5px solid rgba(239, 159, 39, 0.4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .survey-label {
          color: #EF9F27;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          font-family: 'Montserrat', sans-serif;
          margin-bottom: 4px;
        }
        .survey-title {
          margin: 0;
          color: #FFFFFF;
          font-family: 'Lora', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          line-height: 1.25;
        }
        .survey-reward {
          flex-shrink: 0;
          background: linear-gradient(135deg, #EF9F27 0%, #FAC775 100%);
          color: #0E1A2B;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 15px;
          padding: 9px 18px;
          border-radius: 999px;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 14px rgba(239, 159, 39, 0.35);
          white-space: nowrap;
        }
        .survey-lead {
          color: #DCE5F0;
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 22px;
        }
        .survey-progress {
          position: relative;
          height: 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .survey-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #EF9F27 0%, #FAC775 100%);
          border-radius: 999px;
          transition: width 0.06s linear;
        }
        .survey-progress-label {
          display: block;
          margin-top: 0;
          color: #B5D4F4;
          font-size: 12.5px;
          font-family: 'Montserrat', sans-serif;
          margin-bottom: 22px;
        }
        .survey-questions {
          display: grid;
          gap: 14px;
          margin-bottom: 26px;
        }
        .survey-question {
          display: flex;
          gap: 14px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }
        .survey-q-num {
          flex-shrink: 0;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(239, 159, 39, 0.15);
          color: #EF9F27;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 13px;
          display: flex; align-items: center; justify-content: center;
        }
        .survey-q-body { flex: 1; min-width: 0; }
        .survey-q-text {
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          margin-bottom: 10px;
        }
        .survey-q-options {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .survey-q-chip {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          color: #DCE5F0;
          font-size: 13px;
          font-family: 'Montserrat', sans-serif;
        }
        .survey-q-chip-square {
          border-radius: 6px;
        }
        .survey-q-textarea {
          padding: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          font-size: 13.5px;
        }
        .survey-cta {
          display: inline-block;
          padding: 13px 28px;
          background: linear-gradient(135deg, #EF9F27 0%, #FAC775 100%);
          color: #FFFFFF;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(239, 159, 39, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .survey-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 159, 39, 0.55);
        }
        @media (max-width: 600px) {
          .survey-card { padding: 22px; }
          .survey-head { flex-direction: column; align-items: flex-start; }
          .survey-title { font-size: 22px; }
          .survey-reward { align-self: flex-start; }
        }
      `}</style>
    </section>
  )
}
