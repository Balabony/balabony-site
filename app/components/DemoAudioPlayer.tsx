'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Фірмовий аудіоплеєр Balabony.
 * Українські підписи для ВСІХ відвідувачів (не залежить від мови браузера),
 * доступний з клавіатури і для скрінрідерів, у кольорах бренду.
 * Можливості: відтворення/пауза, перемотка (повзунок + ±15 c), показ часу.
 */

const GOLD = 'var(--accent-gold)';

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

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { void a.play(); } else { a.pause(); }
  }, []);

  const skip = useCallback((sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    const d = a.duration || 0;
    a.currentTime = Math.max(0, Math.min(d, a.currentTime + sec));
  }, []);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.currentTime = v;
    setCur(v);
  }, []);

  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const uid = 'baly-player';

  return (
    <div style={{ padding: 18, border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, background: '#0f1e3a' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .${uid}-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;outline:none;cursor:pointer;}
        .${uid}-range:focus-visible{box-shadow:0 0 0 3px rgba(239,159,39,0.45);}
        .${uid}-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent-gold);border:2px solid #0f1e3a;box-shadow:0 1px 4px rgba(0,0,0,0.45);cursor:pointer;}
        .${uid}-range::-moz-range-thumb{width:16px;height:16px;border:2px solid #0f1e3a;border-radius:50%;background:var(--accent-gold);cursor:pointer;}
        .${uid}-btn{display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:transform .15s ease,background .2s ease;}
        .${uid}-btn:hover{transform:translateY(-1px);}
        .${uid}-btn:focus-visible{outline:3px solid rgba(239,159,39,0.55);outline-offset:2px;}
        @media (prefers-reduced-motion: reduce){.${uid}-btn{transition:none;}.${uid}-btn:hover{transform:none;}}
      ` }} />

      {badge && (
        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0E1A2B', background: GOLD, padding: '2px 8px', borderRadius: 6, marginBottom: 12 }}>
          {badge}
        </span>
      )}
      {caption && (
        <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#E8EEF6' }}>{caption}</p>
      )}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCur((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDur((e.target as HTMLAudioElement).duration)}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button" className={`${uid}-btn`} onClick={() => skip(-15)}
          aria-label="Перемотати назад на 15 секунд" title="−15 с"
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#E8EEF6' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
          </svg>
        </button>

        <button
          type="button" className={`${uid}-btn`} onClick={toggle}
          aria-label={playing ? 'Пауза' : 'Відтворити'} aria-pressed={playing}
          style={{ width: 56, height: 56, borderRadius: '50%', background: GOLD, color: '#0E1A2B', boxShadow: '0 2px 10px rgba(239,159,39,0.4)' }}
        >
          {playing ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <button
          type="button" className={`${uid}-btn`} onClick={() => skip(15)}
          aria-label="Перемотати вперед на 15 секунд" title="+15 с"
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#E8EEF6' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220 }}>
          <span style={{ fontSize: 12, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }} aria-hidden="true">{fmt(cur)}</span>
          <input
            type="range" className={`${uid}-range`}
            min={0} max={dur || 0} step={1} value={cur} onChange={onSeek}
            aria-label="Позиція відтворення" aria-valuetext={`${fmt(cur)} з ${fmt(dur)}`}
            style={{ background: `linear-gradient(to right, var(--accent-gold) ${pct}%, rgba(255,255,255,0.18) ${pct}%)` }}
          />
          <span style={{ fontSize: 12, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums', minWidth: 40 }} aria-hidden="true">{fmt(dur)}</span>
        </div>
      </div>
    </div>
  );
}
