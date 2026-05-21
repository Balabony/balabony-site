'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BalabonyEpisode, BalabonyArchivePreview, BalabonyHomeData } from '@/lib/types/balabony';
import { formatRelativeDate } from '@/lib/formatRelativeDate';

const STYLES = `
.bb-card { transition: transform 0.25s ease, box-shadow 0.25s ease; will-change: transform; display:flex; flex-direction:column; text-decoration:none; background:#0e2645; border:2px solid #ef9f27; border-radius:14px; overflow:hidden; }
.bb-card:hover, .bb-card:focus-visible { transform: translateY(-6px); box-shadow: 0 0 32px rgba(239,159,39,0.5); outline: none; }
.bb-card:hover .bb-cover-img { transform: scale(1.05); }
.bb-cover-img { transition: transform 0.35s ease; width:calc(100% + 24px); height:calc(100% + 24px); margin:-12px; object-fit:cover; object-position:center top; display:block; }
.bb-badge { position:absolute; top:12px; background:#ef9f27; color:#0e2645; font-size:13px; font-weight:500; padding:5px 11px; border-radius:6px; letter-spacing:0.06em; white-space:nowrap; z-index:2; }
.bb-cta { background:#ef9f27; color:#0e2645; font-size:15px; font-weight:500; padding:11px 14px; border-radius:8px; text-align:center; margin-top:auto; }
.bb-body { padding:18px 16px; display:flex; flex-direction:column; flex:1; }
.bb-audio { font-size:12px; color:#ffffff; opacity:0.85; text-align:center; margin-top:8px; letter-spacing:0.06em; }
.bb-title { font-size:17px; color:#ffffff; font-weight:500; line-height:1.3; margin-bottom:14px; min-height:44px; }
.bb-meta-row { display:flex; align-items:center; gap:6px; font-size:14px; color:#ffffff; }
.bb-meta-icon { width:16px; height:16px; color:#ef9f27; flex-shrink:0; }
.bb-cover { position:relative; height:220px; overflow:hidden; background:#0e2645; }
.bb-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
@media (max-width: 768px) { .bb-grid { grid-template-columns:1fr; } }
@media (prefers-reduced-motion: reduce) {
  .bb-card, .bb-cover-img { transition: none; }
  .bb-card:hover { transform: none; }
  .bb-card:hover .bb-cover-img { transform: none; }
}
`;

function DateLabel({ iso }: { iso: string }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(formatRelativeDate(iso)); }, [iso]);
  return <span>{text}</span>;
}

export default function BalabonyHomeBlock() {
  const [data, setData] = useState<BalabonyHomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/balabony/home')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <section style={{ background:'#0e2645', borderRadius:'16px', padding:'32px 24px', minHeight:'400px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef9f27' }}>
        Завантаження…
      </section>
    );
  }

  const { newest, freeEpisode, totalCount } = data;

  return (
    <section style={{ background:'#0e2645', borderRadius:'16px', padding:'32px 24px', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px' }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'12px', background:'#ef9f27', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffffff' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="2"/>
            <path d="M9 12h6M9 16h6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:'14px', letterSpacing:'0.22em', color:'#ef9f27', fontWeight:500, marginBottom:'3px' }}>БАЛАБОНИ</div>
          <div style={{ fontSize:'24px', color:'#ffffff', fontWeight:500, lineHeight:1.1 }}>Серії Балабонів</div>
        </div>
      </div>

      <div className="bb-grid">
        <NewEpisodeCard episode={newest} />
        <ChooseSeriesCard freeEpisode={freeEpisode} />
        <ArchiveCard totalCount={totalCount} />
      </div>
    </section>
  );
}

function NewEpisodeCard({ episode }: { episode: BalabonyEpisode }) {
  return (
    <Link href={`/series/${episode.slug}`} className="bb-card">
      <div className="bb-cover">
        {episode.cover_url ? (
          <img src={episode.cover_url} alt={episode.title} className="bb-cover-img" />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#3d5680,#1a3554)' }} />
        )}
        <div className="bb-badge" style={{ left:'12px' }}>НОВЕ</div>
      </div>
      <div className="bb-body">
        <div style={{ fontSize:'14px', color:'#ef9f27', fontWeight:500, marginBottom:'8px' }}>
          Сезон {episode.season_number}, серія {episode.episode_number}
        </div>
        <div className="bb-title">{episode.title}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' }}>
          <div className="bb-meta-row">
            <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <DateLabel iso={episode.created_at} />
          </div>
          {episode.duration_minutes && (
            <div className="bb-meta-row">
              <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>{episode.duration_minutes} хвилин</span>
            </div>
          )}
        </div>
        <div className="bb-cta">Читай →</div>
        <div className="bb-audio">Аудіо скоро</div>
      </div>
    </Link>
  );
}

function ChooseSeriesCard({ freeEpisode }: { freeEpisode: BalabonyEpisode | null }) {
  return (
    <Link href="/series" className="bb-card">
      <div className="bb-cover">
        {freeEpisode?.cover_url ? (
          <img src={freeEpisode.cover_url} alt={freeEpisode.title} className="bb-cover-img" />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#3d5680,#1a3554)' }} />
        )}
        <div className="bb-badge" style={{ right:'12px' }}>БЕЗКОШТОВНО</div>
      </div>
      <div className="bb-body">
        <div style={{ fontSize:'14px', color:'#ef9f27', fontWeight:500, marginBottom:'8px' }}>На вибір</div>
        <div className="bb-title">Обери серію</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' }}>
          <div className="bb-meta-row">
            <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span>Подарунок</span>
          </div>
          <div className="bb-meta-row">
            <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            <span>80 на вибір</span>
          </div>
        </div>
        <div className="bb-cta">Обери →</div>
        <div className="bb-audio">Аудіо скоро</div>
      </div>
    </Link>
  );
}

function ArchiveCard({ totalCount }: { totalCount: number }) {
  return (
    <Link href="/series" className="bb-card">
      <div className="bb-cover">
        <img src="/panas-archive.jpg" alt="Архів Балабонів" className="bb-cover-img" />
      </div>
      <div className="bb-body">
        <div style={{ fontSize:'14px', color:'#ef9f27', fontWeight:500, marginBottom:'8px' }}>Усі серії</div>
        <div className="bb-title">Архів Балабонів</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' }}>
          <div className="bb-meta-row">
            <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span>{totalCount} серій</span>
          </div>
          <div className="bb-meta-row">
            <svg className="bb-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/>
            </svg>
            <span>Щосереди нова серія</span>
          </div>
        </div>
        <div className="bb-cta">Читай →</div>
      </div>
    </Link>
  );
}
