'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Фірмовий аудіоплеєр Balabony (повна версія).
 * Українські підписи для ВСІХ відвідувачів, доступний з клавіатури і для скрінрідерів,
 * у кольорах бренду.
 * Можливості: відтворення/пауза, перемотка (повзунок + клік у будь-яку точку + ±15 c),
 * загальна тривалість, мітки хвилин, швидкість (0.75–1.5×), гучність/без звуку,
 * пробіл — пауза.
 */

const GOLD = 'var(--accent-gold)';
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
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);

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

  const onVol = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    const v = Number(e.target.value);
    setVol(v);
    setMuted(v === 0);
    if (a) { a.volume = v; a.muted = v === 0; }
  }, []);

  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const m = !a.muted;
    a.muted = m;
    setMuted(m);
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if ((e.key === ' ' || e.code === 'Space') && tag !== 'INPUT') {
      e.preventDefault();
      toggle();
    }
  }, [toggle]);

  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const volPct = (muted ? 0 : vol) * 100;
  const uid = 'baly-player';

  // мітки хвилин (від 1 хв до тривалості; ховаємо для дуже довгих треків)
  const ticks: number[] = [];
  if (dur > 60 && dur <= 1800) {
    for (let m = 1; m * 60 < dur; m++) ticks.push(m * 60);
  }

  const ctrlBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', color: '#E8EEF6',
  };

  return (
    <div onKeyDown={onKey} style={{ padding: 18, border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, background: '#0f1e3a' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .${uid}-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;outline:none;cursor:pointer;}
        .${uid}-range:focus-visible{box-shadow:0 0 0 3px rgba(239,159,39,0.45);}
        .${uid}-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent-gold);border:2px solid #0f1e3a;box-shadow:0 1px 4px rgba(0,0,0,0.45);cursor:pointer;}
        .${uid}-range::-moz-range-thumb{width:16px;height:16px;border:2px solid #0f1e3a;border-radius:50%;background:var(--accent-gold);cursor:pointer;}
        .${uid}-vol{-webkit-appearance:none;appearance:none;height:5px;border-radius:999px;outline:none;cursor:pointer;}
        .${uid}-vol::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:13px;height:13px;border-radius:50%;background:var(--accent-gold);cursor:pointer;}
        .${uid}-vol::-moz-range-thumb{width:13px;height:13px;border:none;border-radius:50%;background:var(--accent-gold);cursor:pointer;}
        .${uid}-btn{display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:transform .15s ease,background .2s ease;}
        .${uid}-btn:hover{transform:translateY(-1px);}
        .${uid}-btn:focus-visible{outline:3px solid rgba(239,159,39,0.55);outline-offset:2px;}
        .${uid}-chip{border:1px solid rgba(239,159,39,0.45);background:transparent;color:#E8EEF6;font-size:12px;font-weight:600;padding:3px 8px;border-radius:8px;cursor:pointer;font-family:inherit;transition:background .2s ease,color .2s ease;}
        .${uid}-chip:hover{background:rgba(239,159,39,0.18);}
        .${uid}-chip:focus-visible{outline:3px solid rgba(239,159,39,0.55);outline-offset:2px;}
        .${uid}-chip[aria-pressed="true"]{background:var(--accent-gold);color:#0E1A2B;border-color:var(--accent-gold);}
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
        onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); syncDur(e.currentTarget); }}
        onLoadedMetadata={(e) => syncDur(e.currentTarget)}
        onDurationChange={(e) => syncDur(e.currentTarget)}
      />

      {/* Ряд керування */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className={`${uid}-btn`} onClick={() => skip(-15)} aria-label="Перемотати назад на 15 секунд" title="−15 с" style={ctrlBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
        </button>

        <button type="button" className={`${uid}-btn`} onClick={toggle} aria-label={playing ? 'Пауза' : 'Відтворити'} aria-pressed={playing} style={{ width: 56, height: 56, borderRadius: '50%', background: GOLD, color: '#0E1A2B', boxShadow: '0 2px 10px rgba(239,159,39,0.4)' }}>
          {playing
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>

        <button type="button" className={`${uid}-btn`} onClick={() => skip(15)} aria-label="Перемотати вперед на 15 секунд" title="+15 с" style={ctrlBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
        </button>

        {/* швидкість */}
        <div role="group" aria-label="Швидкість відтворення" style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={`${uid}-chip`} aria-pressed={rate === s} onClick={() => changeRate(s)}>
              {s}×
            </button>
          ))}
        </div>

        {/* гучність */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button type="button" className={`${uid}-btn`} onClick={toggleMute} aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'} title={muted ? 'Звук' : 'Без звуку'} style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', color: '#9FB3C8' }}>
            {muted
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>}
          </button>
          <input type="range" className={`${uid}-vol`} min={0} max={1} step={0.05} value={muted ? 0 : vol} onChange={onVol} aria-label="Гучність" style={{ width: 80, background: `linear-gradient(to right, var(--accent-gold) ${volPct}%, rgba(255,255,255,0.18) ${volPct}%)` }} />
        </div>
      </div>

      {/* Ряд перемотки */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <span style={{ fontSize: 12, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }} aria-hidden="true">{fmt(cur)}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <input
            type="range" className={`${uid}-range`}
            min={0} max={dur || 0} step={1} value={cur} onChange={onSeek}
            aria-label="Позиція відтворення" aria-valuetext={`${fmt(cur)} з ${fmt(dur)}`}
            style={{ background: `linear-gradient(to right, var(--accent-gold) ${pct}%, rgba(255,255,255,0.18) ${pct}%)` }}
          />
          {ticks.length > 0 && (
            <div style={{ position: 'relative', height: 16, marginTop: 4 }} aria-hidden="true">
              {ticks.map((t) => (
                <span key={t} style={{ position: 'absolute', left: `${(t / dur) * 100}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#6F8299', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(t)}
                </span>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize: 12, color: '#9FB3C8', fontVariantNumeric: 'tabular-nums', minWidth: 42 }} aria-hidden="true">
          {dur > 0 ? fmt(dur) : '--:--'}
        </span>
      </div>
    </div>
  );
}
