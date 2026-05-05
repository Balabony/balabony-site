'use client'

import { useState, useEffect, useRef } from 'react'

const GOLD = '#D4A017'
const FONT = "'Montserrat', Arial, sans-serif"

function shuffle(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isSolved(pieces: number[]): boolean {
  return pieces.every((p, i) => p === i)
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Props {
  seed: string
  level: number
  onBack: () => void
}

export default function PuzzleGame({ seed, level, onBack }: Props) {
  const N = level
  const imgUrl = `https://picsum.photos/seed/${seed}/600/600`

  const makePieces = () => shuffle(Array.from({ length: N * N }, (_, i) => i))

  const [pieces, setPieces] = useState<number[]>(makePieces)
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [won, setWon] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (won && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [won])

  const handleCell = (pos: number) => {
    if (won) return
    if (selected === null) { setSelected(pos); return }
    if (selected === pos) { setSelected(null); return }
    const next = [...pieces]
    ;[next[selected], next[pos]] = [next[pos], next[selected]]
    setPieces(next)
    setMoves(m => m + 1)
    setSelected(null)
    if (isSolved(next)) setWon(true)
  }

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPieces(makePieces())
    setSelected(null)
    setMoves(0)
    setElapsed(0)
    setWon(false)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  const handleHint = () => {
    setShowHint(true)
    setTimeout(() => setShowHint(false), 2000)
  }

  return (
    <div style={{ fontFamily: FONT }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899bb', fontSize: 14, fontFamily: FONT, padding: 0 }}
        >← До списку</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
            Ходи: <b style={{ color: '#f5f0e8' }}>{moves}</b>
          </span>
          <span style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
            ⏱ <b style={{ color: '#f5f0e8' }}>{formatTime(elapsed)}</b>
          </span>
        </div>
      </div>

      {/* Thumbnail */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <img
          src={imgUrl}
          alt="hint"
          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, opacity: 0.7, border: `1px solid ${GOLD}44` }}
        />
      </div>

      {/* Board */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            gridTemplateRows: `repeat(${N}, 1fr)`,
            width: '100%', maxWidth: 400,
            aspectRatio: '1/1',
            gap: won ? 0 : 1,
            transition: 'gap 0.5s ease',
            background: '#0a1628',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {pieces.map((originalIdx, pos) => {
            const row = Math.floor(originalIdx / N)
            const col = originalIdx % N
            const bgX = N === 1 ? '0%' : `${(col / (N - 1)) * 100}%`
            const bgY = N === 1 ? '0%' : `${(row / (N - 1)) * 100}%`
            return (
              <div
                key={pos}
                onClick={() => handleCell(pos)}
                style={{
                  backgroundImage: `url(${imgUrl})`,
                  backgroundSize: `${N * 100}% ${N * 100}%`,
                  backgroundPosition: `${bgX} ${bgY}`,
                  cursor: won ? 'default' : 'pointer',
                  outline: selected === pos ? `3px solid ${GOLD}` : 'none',
                  outlineOffset: '-2px',
                  transition: 'outline 0.15s ease',
                }}
              />
            )
          })}
        </div>

        {/* Hint overlay */}
        {showHint && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imgUrl})`,
              backgroundSize: 'cover',
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Win overlay */}
        {won && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(10,22,40,0.88)',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <div style={{ fontSize: 32 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, fontFamily: FONT }}>Готово!</div>
            <div style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
              Ходи: {moves} · Час: {formatTime(elapsed)}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={reset}
                style={{ padding: '9px 20px', borderRadius: 20, background: GOLD, color: '#081420', fontSize: 13, fontWeight: 700, fontFamily: FONT, border: 'none', cursor: 'pointer' }}
              >Ще раз</button>
              <button
                onClick={onBack}
                style={{ padding: '9px 20px', borderRadius: 20, background: 'transparent', color: '#8899bb', fontSize: 13, fontFamily: FONT, border: '1px solid #8899bb', cursor: 'pointer' }}
              >До списку</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!won && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button
            onClick={reset}
            style={{ padding: '9px 20px', borderRadius: 20, background: 'transparent', color: '#8899bb', fontSize: 13, fontFamily: FONT, border: '1px solid #8899bb', cursor: 'pointer' }}
          >Перемішати</button>
          <button
            onClick={handleHint}
            disabled={showHint}
            style={{ padding: '9px 20px', borderRadius: 20, background: `${GOLD}22`, color: GOLD, fontSize: 13, fontFamily: FONT, border: `1px solid ${GOLD}66`, cursor: showHint ? 'default' : 'pointer' }}
          >Підказка</button>
        </div>
      )}
    </div>
  )
}
