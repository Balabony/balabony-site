'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Фірмовий аудіоплеєр Balabony — чистий, крупний, доступний.
 * Підписи українською, керування з клавіатури, пробіл — пауза.
 * Гучністю керує телефон/система (свій повзунок прибрано як зайвий на iOS).
 */

const GOLD = '#FAC775';
const SPEEDS = [0.75, 1, 1.25, 1.5];

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  src: string;
  badge?: string;
  caption?: string;
  title?: string;
}

export default function DemoAudioPlayer({ src, badge, caption, title = 'Аудіо' }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);

  const syncDur = useCallback((a: HTMLAudioElement | null) => {
    if (a && isFinite(a.duration) && a.duration > 0) setDur(a.duration);
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { void a.play(); } else { a.pause(); }
  }, []);

  const skip = useCallback((sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    const d = isFinite(a.duration) ? a.duration : dur;
    a.currentTime = Math.max(0, Math.min(d || 0, a.currentTime + sec));
  }, [dur]);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.currentTime = v;
    setCur(v);
  }, []);

  const changeRate = useCallback((r: number) => {
    const a = audioRef.current;
    setRate(r);
    if (a) a.playbackRate = r;
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if ((e.key === ' ' || e.code === 'Space') && tag !== 'INPUT') {
      e.preventDefault();
      toggle();
    }
  }, [toggle]);

  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const uid = 'baly-player';

  const skipBtn: React.CSSProperties = {
    width: 50, height: 50, borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)', color: '#C9D6E5',
  };

  return (
    <div onKeyDown={onKey} style={{ padding: '26px 22px', border: '2px solid #EF9F27', borderRadius: 18, background: '#14253B', boxShadow: '0 8px 32px rgba(239,159,39,0.28)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .${uid}-range{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:999px;outline:none;cursor:pointer;}
        .${uid}-range:focus-visible{box-shadow:0 0 0 3px rgba(250,199,117,0.5);}
        .${uid}-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:${GOLD};border:2px solid #14253B;cursor:pointer;}
        .${uid}-range::-moz-range-thumb{width:20px;height:20px;border:2px solid #14253B;border-radius:50%;background:${GOLD};cursor:pointer;}
        .${uid}-btn{display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:transform .15s ease,background .2s ease;}
        .${uid}-btn:hover{transform:translateY(-1px);}
        .${uid}-btn:focus-visible{outline:3px solid rgba(250,199,117,0.6);outline-offset:2px;}
        .${uid}-chip{border:1px solid rgba(239,159,39,0.4);background:transparent;color:#E8EEF6;font-size:15px;font-weight:600;padding:7px 14px;border-radius:10px;cursor:pointer;font-family:inherit;transition:background .2s ease,color .2s ease;}
        .${uid}-chip:hover{background:rgba(239,159,39,0.18);}
        .${uid}-chip:focus-visible{outline:3px solid rgba(250,199,117,0.6);outline-offset:2px;}
        .${uid}-chip[aria-pressed="true"]{background:${GOLD};color:#0E1A2B;border-color:${GOLD};}
        @media (prefers-reduced-motion: reduce){.${uid}-btn{transition:none;}.${uid}-btn:hover{transform:none;}}
      ` }} />

      {/* Шапка: назва зліва, бейдж справа */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {title && (
            <div style={{ fontSize: 19, fontWeight: 800, color: '#F5F0E8', lineHeight: 1.3 }}>{title}</div>
          )}
          {caption && (
            <p style={{ margin: '6px 0 0', fontSize: 15, color: '#9FB3C8' }}>{caption}</p>
          )}
        </div>
        {badge && (
          <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E1A2B', background: GOLD, padding: '5px 12px', borderRadius: 8 }}>
            {badge}
          </span>
        )}
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); syncDur(e.currentTarget); }}
        onLoadedMetadata={(e) => syncDur(e.currentTarget)}
        onDurationChange={(e) => syncDur(e.currentTarget)}
      />

      {/* Керування: −15 · play · +15 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 30 }}>
        <button type="button" className={`${uid}-btn`} onClick={() => skip(-15)} aria-label="Перемотати назад на 15 секунд" title="−15 с" style={skipBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
        </button>

        <button type="button" className={`${uid}-btn`} onClick={toggle} aria-label={playing ? 'Пауза' : 'Відтворити'} aria-pressed={playing} style={{ width: 70, height: 70, borderRadius: '50%', background: GOLD, color: '#0E1A2B' }}>
          {playing
            ? <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>

        <button type="button" className={`${uid}-btn`} onClick={() => skip(15)} aria-label="Перемотати вперед на 15 секунд" title="+15 с" style={skipBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
        </button>
      </div>

      {/* Швидкість */}
      <div role="group" aria-label="Швидкість відтворення" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
        {SPEEDS.map((s) => (
          <button key={s} type="button" className={`${uid}-chip`} aria-pressed={rate === s} onClick={() => changeRate(s)}>
            {s}×
          </button>
        ))}
      </div>

      {/* Смуга перемотки */}
      <div style={{ marginTop: 28 }}>
        <input
          type="range" className={`${uid}-range`}
          min={0} max={dur || 0} step={1} value={cur} onChange={onSeek}
          aria-label="Позиція відтворення" aria-valuetext={`${fmt(cur)} з ${fmt(dur)}`}
          style={{ background: `linear-gradient(to right, ${GOLD} ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 14, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums' }} aria-hidden="true">{fmt(cur)}</span>
          <span style={{ fontSize: 14, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums' }} aria-hidden="true">{dur > 0 ? fmt(dur) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}
