'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BalabonyEpisode, BalabonyArchivePreview, BalabonyHomeData } from '@/lib/types/balabony';

const STYLES = `
.bb-card { transition: transform 0.25s ease, box-shadow 0.25s ease; will-change: transform; display:flex; flex-direction:column; text-decoration:none; background:#0e2645; border:2px solid #ef9f27; border-radius:14px; overflow:hidden; }
.bb-card:hover, .bb-card:focus-visible { transform: translateY(-6px); box-shadow: 0 0 32px rgba(239,159,39,0.5); outline: none; }
.bb-card:hover .bb-cover-img { transform: scale(1.05); }
.bb-cover-img { transition: transform 0.35s ease; width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }
.bb-badge { animation: bbPulse 2s ease-in-out infinite; position:absolute; top:10px; background:#ef9f27; color:#0e2645; font-size:15px; font-weight:500; padding:6px 14px; border-radius:4px; letter-spacing:0.06em; white-space:nowrap; z-index:2; }
.bb-sub-badge { position:absolute; bottom:10px; left:10px; background:rgba(14,38,69,0.92); color:#ef9f27; font-size:14px; font-weight:500; padding:5px 12px; border-radius:4px; white-space:nowrap; z-index:2; }
.bb-cta { text-transform:uppercase; letter-spacing:0.06em; background:#ef9f27; color:#0e2645; font-size:18px; font-weight:500; padding:11px 14px; border-radius:8px; text-align:center; margin-top:auto; }
.bb-body { padding:18px 16px 16px; display:flex; flex-direction:column; flex:1; }
.bb-title { font-size:24px; color:#ffffff; font-weight:500; line-height:1.2; margin-bottom:16px; }
.bb-cover { position:relative; height:220px; overflow:hidden; background:#0e2645; }
.bb-card-featured { box-shadow: 0 0 18px rgba(239,159,39,0.35); } @keyframes bbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } } .bb-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
@media (max-width: 768px) { .bb-card-featured { box-shadow: 0 0 18px rgba(239,159,39,0.35); } @keyframes bbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } } .bb-grid { grid-template-columns:1fr; } .bb-title { font-size:22px; } }
@media (prefers-reduced-motion: reduce) {
  .bb-card, .bb-cover-img { transition: none; }
  .bb-card:hover { transform: none; }
  .bb-card:hover .bb-cover-img { transform: none; }
}
`;

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
      <section style={{ background:'#0e2645', borderRadius:'16px', padding:'32px 24px', minHeight:'320px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef9f27' }}>
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
    <Link href={`/episodes/${episode.slug}`} className="bb-card bb-card-featured">
      <div className="bb-cover">
        {episode.cover_url ? (
          <img src={episode.cover_url} alt={episode.title} className="bb-cover-img" />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#3d5680,#1a3554)' }} />
        )}
        <div className="bb-badge" style={{ left:'10px' }}>НОВЕ</div>
        <div className="bb-sub-badge">Сезон {episode.season_number}, серія {episode.episode_number}</div>
      </div>
      <div className="bb-body">
        <div className="bb-title">{episode.title}</div>
        <div className="bb-cta">Читай →</div>
      </div>
    </Link>
  );
}

function ChooseSeriesCard({ freeEpisode }: { freeEpisode: BalabonyEpisode | null }) {
  return (
    <Link href="/episodes" className="bb-card">
      <div className="bb-cover">
        {freeEpisode?.cover_url ? (
          <img src={freeEpisode.cover_url} alt={freeEpisode.title} className="bb-cover-img" />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(180deg,#3d5680,#1a3554)' }} />
        )}
        
        <div className="bb-sub-badge">На вибір</div>
      </div>
      <div className="bb-body">
        <div className="bb-title">Одна серія безкоштовно</div>
        <div className="bb-cta">Читай →</div>
      </div>
    </Link>
  );
}

function ArchiveCard({ totalCount }: { totalCount: number }) {
  return (
    <Link href="/episodes" className="bb-card">
      <div className="bb-cover">
        <img src="/panas-archive.jpg" alt="Архів Балабонів" className="bb-cover-img" />
        <div className="bb-sub-badge">Усі серії</div>
      </div>
      <div className="bb-body">
        <div className="bb-title">Архів Балабонів</div>
        <div className="bb-cta">Читай →</div>
      </div>
    </Link>
  );
}