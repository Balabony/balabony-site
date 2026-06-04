'use client'

import { useRef, useState } from 'react'

export default function SttTestPage() {
  const [lang, setLang]         = useState<'uk' | 'eu'>('uk')
  const [phase, setPhase]       = useState<'idle' | 'recording' | 'sending' | 'done' | 'error'>('idle')
  const [transcript, setText]   = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = async () => {
    setText(''); setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setPhase('sending')
        try {
          const res = await fetch(`/api/stt?lang=${lang}`, {
            method: 'POST',
            headers: { 'Content-Type': 'audio/webm' },
            body: blob,
          })
          const data = await res.json() as { transcript?: string; error?: string }
          if (!res.ok || data.error) { setErrorMsg(data.error || 'Помилка'); setPhase('error'); return }
          setText(data.transcript || '(порожньо — нічого не розпізнано)')
          setPhase('done')
        } catch { setErrorMsg("Помилка з'єднання"); setPhase('error') }
      }
      mediaRef.current = mr
      mr.start()
      setPhase('recording')
    } catch {
      setErrorMsg('Немає доступу до мікрофона'); setPhase('error')
    }
  }

  const stop = () => { mediaRef.current?.stop(); setPhase('sending') }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#f5f3ee' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Тест розпізнавання голосу (Deepgram)</h1>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 12 }}>Мова:</label>
        <button onClick={() => setLang('uk')} disabled={phase === 'recording'}
          style={{ padding: '6px 14px', marginRight: 8, borderRadius: 8, border: lang === 'uk' ? '2px solid #ef9f27' : '1px solid #555', background: lang === 'uk' ? 'rgba(239,159,39,0.15)' : 'transparent', color: '#f5f3ee', cursor: 'pointer' }}>
          Українська (uk)
        </button>
        <button onClick={() => setLang('eu')} disabled={phase === 'recording'}
          style={{ padding: '6px 14px', borderRadius: 8, border: lang === 'eu' ? '2px solid #ef9f27' : '1px solid #555', background: lang === 'eu' ? 'rgba(239,159,39,0.15)' : 'transparent', color: '#f5f3ee', cursor: 'pointer' }}>
          Баскська (eu)
        </button>
      </div>

      {phase !== 'recording' ? (
        <button onClick={start} disabled={phase === 'sending'}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#ef9f27', color: '#13233c', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          {phase === 'sending' ? 'Розпізнаю…' : '● Почати запис'}
        </button>
      ) : (
        <button onClick={stop}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          ■ Зупинити і розпізнати
        </button>
      )}

      {phase === 'recording' && <p style={{ marginTop: 16, color: '#ef9f27' }}>● Запис… говоріть у мікрофон, тоді натисніть «Зупинити».</p>}

      {phase === 'done' && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Розпізнаний текст ({lang}):</div>
          <div style={{ fontSize: 18, lineHeight: 1.5 }}>{transcript}</div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5' }}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}
