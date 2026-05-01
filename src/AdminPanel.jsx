// AdminPanel.jsx — Balabony Admin Panel
// ================================================================
// Milestone 2: A + B + C в одному компоненті
//
// A. Upload — drag & drop аудіо + обкладинка, метадані, прогрес
// B. Контент — таблиця треків зі статусами, inline редагування
// C. Статистика — прослуховування, графік, топ треки
//
// Використання:
//   import AdminPanel from './AdminPanel';
//   // Захищена сторінка (тільки role === 'admin' | 'editor')
//   <AdminPanel user={user} />
//
// API routes (потрібно створити):
//   POST /api/admin/upload       — завантаження файлів
//   GET  /api/admin/tracks       — список треків
//   PATCH /api/admin/tracks/:id  — оновлення треку
//   GET  /api/admin/stats        — статистика
// ================================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Константи ───────────────────────────────────────────────────
const TABS = [
  { id: 'upload', label: '📤 Завантаження' },
  { id: 'content', label: '📋 Контент' },
  { id: 'stats', label: '📊 Статистика' },
];

const GENRES = [
  'Казка', 'Драма', 'Містика', 'Гумор',
  'Історична', 'Медитативна', 'Для дітей', 'Документальна',
];

const STATUS_COLORS = {
  draft:     { bg: '#1e293b', text: '#64748b', label: 'Чернетка' },
  review:    { bg: '#451a03', text: '#f59e0b', label: 'На перевірці' },
  approved:  { bg: '#052e16', text: '#10b981', label: 'Схвалено' },
  rejected:  { bg: '#450a0a', text: '#f87171', label: 'Відхилено' },
  published: { bg: '#0c1a4e', text: '#60a5fa', label: 'Опубліковано' },
};

// ─── Утиліти ─────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ─── Мок даних (замінити на API) ─────────────────────────────────
const MOCK_TRACKS = [
  { id: '1', title: 'Синій блокнот', series: 'Таємниця Балабонів', episode: 1, genre: 'Казка', duration: 754, status: 'published', plays: 3420, is_free: true, price: 0, created_at: '2026-01-15', cover_url: null },
  { id: '2', title: 'Таємниця Балабонів', series: 'Таємниця Балабонів', episode: 2, genre: 'Казка', duration: 892, status: 'published', plays: 2891, is_free: true, price: 0, created_at: '2026-01-22', cover_url: null },
  { id: '3', title: 'Вогняна куля', series: 'Таємниця Балабонів', episode: 3, genre: 'Містика', duration: 1024, status: 'published', plays: 1654, is_free: false, price: 7, created_at: '2026-01-29', cover_url: null },
  { id: '4', title: 'Загадка дзеркала', series: 'Таємниця Балабонів', episode: 4, genre: 'Містика', duration: 980, status: 'review', plays: 0, is_free: false, price: 7, created_at: '2026-02-05', cover_url: null },
  { id: '5', title: 'Ніч над Дніпром', series: 'Окремі', episode: null, genre: 'Драма', duration: 1340, status: 'draft', plays: 0, is_free: false, price: 7, created_at: '2026-02-10', cover_url: null },
];

const MOCK_STATS = {
  total_plays: 12840,
  plays_week: 2341,
  plays_yesterday: 487,
  total_tracks: 5,
  published_tracks: 3,
  total_revenue: 3850,
  weekly_chart: [320, 410, 280, 520, 487, 610, 714],
  top_tracks: [
    { title: 'Синій блокнот', plays: 3420, completion: 78 },
    { title: 'Таємниця Балабонів', plays: 2891, completion: 71 },
    { title: 'Вогняна куля', plays: 1654, completion: 64 },
  ],
};

// ─── A. UPLOAD FORM ───────────────────────────────────────────────
function UploadForm() {
  const audioInputRef  = useRef(null);
  const coverInputRef  = useRef(null);
  const [audioFile, setAudioFile]   = useState(null);
  const [coverFile, setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [dragOver, setDragOver]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [errors, setErrors]         = useState({});

  const [meta, setMeta] = useState({
    title:        '',
    series:       '',
    episode:      '',
    genre:        'Казка',
    description:  '',
    is_free:      true,
    price:        7,
    content_type: 'serial',   // serial | standalone
    listen_url:   '',
  });

  // Drag & drop аудіо
  const handleAudioDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setErrors(prev => ({ ...prev, audio: 'Тільки аудіо-файли (mp3, wav, ogg)' }));
      return;
    }
    setAudioFile(file);
    setErrors(prev => ({ ...prev, audio: null }));

    // Визначаємо тривалість
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioDuration(Math.round(audio.duration));
      URL.revokeObjectURL(url);
    };
  }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const setField = (key, val) => setMeta(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const e = {};
    if (!audioFile)      e.audio   = 'Оберіть аудіо-файл';
    if (!meta.title.trim()) e.title = 'Введіть назву';
    if (meta.content_type === 'serial' && !meta.series.trim()) e.series = 'Введіть назву серіалу';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setUploading(true);
    setUploadProgress(0);

    // Симуляція прогресу (замінити на реальний XMLHttpRequest з onprogress)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) { clearInterval(interval); return 95; }
        return prev + Math.random() * 12;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (coverFile) formData.append('cover', coverFile);
      // meta включає listen_url автоматично через { ...meta }
      formData.append('meta', JSON.stringify({ ...meta, duration_sec: audioDuration }));

      // Реальний upload на /api/admin/upload
      const resp = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }
      const result = await resp.json();
      console.log('[AdminPanel] Upload success:', result.track?.id);

      // Симуляція прогресу до 100%
      await new Promise(r => setTimeout(r, 400));

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadDone(true); }, 400);

    } catch (err) {
      clearInterval(interval);
      setUploading(false);
      setErrors(prev => ({ ...prev, submit: err.message }));
    }
  };

  const reset = () => {
    setAudioFile(null); setCoverFile(null); setCoverPreview(null);
    setAudioDuration(0); setUploadDone(false); setUploadProgress(0);
    setErrors({});
    setMeta({ title: '', series: '', episode: '', genre: 'Казка', description: '', is_free: true, price: 7, content_type: 'serial' });
  };

  if (uploadDone) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
        Трек завантажено!
      </div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
        «{meta.title}» передано на перевірку редактору
      </div>
      <button onClick={reset} style={btnStyle('#ef9f27')}>
        + Завантажити ще один
      </button>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

      {/* Ліва колонка: файли */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Drag & Drop зона */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleAudioDrop}
          onClick={() => audioInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#ef9f27' : errors.audio ? '#ef4444' : '#334155'}`,
            borderRadius: 14, padding: '32px 20px', textAlign: 'center',
            cursor: 'pointer', transition: 'border-color 0.2s',
            background: dragOver ? 'rgba(239,159,39,0.05)' : audioFile ? 'rgba(16,185,129,0.05)' : 'transparent',
          }}>
          <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioDrop} />
          {audioFile ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{audioFile.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {formatBytes(audioFile.size)} · {formatDuration(audioDuration)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
                Перетягніть mp3/wav сюди
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>або клікніть для вибору</div>
            </>
          )}
        </div>
        {errors.audio && <ErrMsg text={errors.audio} />}

        {/* Обкладинка */}
        <div onClick={() => coverInputRef.current?.click()} style={{
          border: '2px dashed #334155', borderRadius: 14,
          overflow: 'hidden', cursor: 'pointer',
          height: 160, position: 'relative',
          background: coverPreview ? 'transparent' : '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
          {coverPreview
            ? <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🖼</div>
                <div style={{ fontSize: 12 }}>Обкладинка (необов'язково)</div>
              </div>
          }
        </div>

        {/* Тип контенту */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['serial', 'standalone'].map(type => (
            <button key={type} onClick={() => setField('content_type', type)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
              background: meta.content_type === type ? '#ef9f27' : '#1e293b',
              color: meta.content_type === type ? '#fff' : '#64748b',
            }}>
              {type === 'serial' ? '📺 Серіал' : '📖 Окрема'}
            </button>
          ))}
        </div>
      </div>

      {/* Права колонка: метадані */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <Field label="Назва треку *" error={errors.title}>
          <input value={meta.title} onChange={e => setField('title', e.target.value)}
            placeholder="напр: Синій блокнот" style={inputStyle(!!errors.title)} />
        </Field>

        {meta.content_type === 'serial' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <Field label="Серіал *" error={errors.series}>
              <input value={meta.series} onChange={e => setField('series', e.target.value)}
                placeholder="Таємниця Балабонів" style={inputStyle(!!errors.series)} />
            </Field>
            <Field label="Серія №">
              <input type="number" min="1" value={meta.episode} onChange={e => setField('episode', e.target.value)}
                placeholder="1" style={inputStyle()} />
            </Field>
          </div>
        )}

        <Field label="Жанр">
          <select value={meta.genre} onChange={e => setField('genre', e.target.value)} style={inputStyle()}>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        <Field label="Опис">
          <textarea value={meta.description} onChange={e => setField('description', e.target.value)}
            placeholder="Короткий анонс для сторінки..." rows={3}
            style={{ ...inputStyle(), resize: 'vertical' }} />
        </Field>

        <Field label="🔗 Посилання «Слухати»">
          <input value={meta.listen_url || ''} onChange={e => setField('listen_url', e.target.value)}
            placeholder="https://t.me/balabony_bot або прямий URL аудіо"
            style={inputStyle()} />
          <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
            Куди веде кнопка «Слухати» на сайті. Можна змінити пізніше.
          </div>
        </Field>

        {/* Доступ і ціна */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Доступ" style={{ flex: 1 }}>
            <select value={meta.is_free ? 'free' : 'paid'} onChange={e => setField('is_free', e.target.value === 'free')} style={inputStyle()}>
              <option value="free">🆓 Безкоштовно</option>
              <option value="paid">💳 Платно</option>
            </select>
          </Field>
          {!meta.is_free && (
            <Field label="Ціна ₴" style={{ flex: 0, minWidth: 90 }}>
              <input type="number" min="1" value={meta.price} onChange={e => setField('price', Number(e.target.value))}
                style={inputStyle()} />
            </Field>
          )}
        </div>

        {/* Прогрес завантаження */}
        {uploading && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              <span>Завантаження...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ef9f27, #f59e0b)', borderRadius: 3, transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        {errors.submit && <ErrMsg text={errors.submit} />}

        <button onClick={handleSubmit} disabled={uploading} style={{
          ...btnStyle('#ef9f27'),
          opacity: uploading ? 0.6 : 1,
          cursor: uploading ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}>
          {uploading ? '⏳ Завантажується...' : '📤 Завантажити трек'}
        </button>

        <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', lineHeight: 1.5 }}>
          Після завантаження трек потрапить на перевірку до редактора.<br/>
          Обкладинку можна згенерувати через ШІ у кабінеті Оксани.
        </div>
      </div>
    </div>
  );
}

// ─── B. CONTENT TABLE ────────────────────────────────────────────
function ContentTable() {
  const [tracks, setTracks]       = useState(MOCK_TRACKS);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [sortBy, setSortBy]       = useState('created_at');
  const [sortDir, setSortDir]     = useState('desc');

  // ── Вбудований плеєр для Оксани ────────────────────────────
  const [playingId, setPlayingId]       = useState(null);
  const [playerTime, setPlayerTime]     = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerPaused, setPlayerPaused] = useState(false);
  const previewAudioRef = useRef(null);

  const playTrack = (track) => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (playingId === track.id) {
      // Той самий трек — toggle pause
      if (audio.paused) { audio.play(); setPlayerPaused(false); }
      else              { audio.pause(); setPlayerPaused(true);  }
      return;
    }

    // Новий трек
    audio.src = track.audio_url || '';   // реальний URL з БД
    audio.load();
    audio.play().catch(() => {});
    setPlayingId(track.id);
    setPlayerPaused(false);
    setPlayerTime(0);

    audio.ontimeupdate = () => setPlayerTime(audio.currentTime);
    audio.onloadedmetadata = () => setPlayerDuration(audio.duration || track.duration || 0);
    audio.onended = () => { setPlayingId(null); setPlayerTime(0); };
  };

  const stopPreview = () => {
    const audio = previewAudioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    setPlayingId(null);
    setPlayerTime(0);
    setPlayerDuration(0);
  };

  const seekPreview = (e, duration) => {
    const audio = previewAudioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const filtered = tracks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.series?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy];
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const startEdit = (track) => {
    setEditId(track.id);
    setEditData({ title: track.title, status: track.status, price: track.price, is_free: track.is_free });
  };

  const saveEdit = (id) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...editData } : t));
    setEditId(null);
    // Зберігаємо зміни в БД через PATCH
    fetch(`/api/admin/tracks?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editData),
    }).catch(err => console.error('[AdminPanel] PATCH error:', err));
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => (
    <span style={{ color: sortBy === col ? '#ef9f27' : '#334155', fontSize: 10, marginLeft: 4 }}>
      {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  return (
    <div>
      {/* Прихований audio елемент для превью */}
      <audio ref={previewAudioRef} preload="none" />

      {/* ── Міні-плеєр Оксани (з'являється під час прослуховування) ── */}
      {playingId && (
        <div style={{
          marginBottom: 16, background: '#0a1020',
          border: '1px solid rgba(239,159,39,0.3)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'fadeInDown 0.25s ease',
        }}>
          <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Назва */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef9f27', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🎙 {tracks.find(t => t.id === playingId)?.title}
            </div>
            {/* Прогрес-бар */}
            <div onClick={(e) => seekPreview(e, playerDuration)}
              style={{ height: 4, background: '#1e293b', borderRadius: 2, marginTop: 6, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                width: `${playerDuration ? (playerTime / playerDuration) * 100 : 0}%`,
                height: '100%', background: 'linear-gradient(90deg,#ef9f27,#f59e0b)',
                borderRadius: 2, transition: 'width 0.1s linear',
              }} />
            </div>
          </div>

          {/* Час */}
          <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
            {formatDuration(playerTime)} / {formatDuration(playerDuration)}
          </div>

          {/* Pause/Resume */}
          <button onClick={() => playTrack(tracks.find(t => t.id === playingId))}
            style={{ ...smallBtn('#ef9f27'), padding: '6px 12px', fontSize: 14 }}>
            {playerPaused ? '▶' : '⏸'}
          </button>

          {/* Стоп */}
          <button onClick={stopPreview}
            style={{ ...smallBtn('#334155'), padding: '6px 10px', fontSize: 14 }}>
            ■
          </button>

          {/* Кнопки схвалення — прямо з плеєра */}
          <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
            <button onClick={() => {
              setTracks(prev => prev.map(t => t.id === playingId ? { ...t, status: 'published' } : t));
              stopPreview();
            }} style={{ ...smallBtn('#10b981'), padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
              ✓ Опублікувати
            </button>
            <button onClick={() => {
              setTracks(prev => prev.map(t => t.id === playingId ? { ...t, status: 'rejected' } : t));
              stopPreview();
            }} style={{ ...smallBtn('#ef4444'), padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
              ✗ Відхилити
            </button>
          </div>
        </div>
      )}
      {/* Фільтри */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Пошук по назві..."
          style={{ ...inputStyle(), flex: 1, minWidth: 200 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', ...Object.keys(STATUS_COLORS)].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700,
              background: filter === s ? '#ef9f27' : '#1e293b',
              color: filter === s ? '#fff' : '#64748b',
            }}>
              {s === 'all' ? 'Всі' : STATUS_COLORS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Таблиця */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {[
                { key: 'title', label: 'Назва' },
                { key: 'series', label: 'Серіал' },
                { key: 'status', label: 'Статус' },
                { key: 'plays', label: '▶ Прослуховувань' },
                { key: 'duration', label: '⏱ Тривалість' },
                { key: null, label: '' },
              ].map(({ key, label }) => (
                <th key={label} onClick={key ? () => toggleSort(key) : undefined}
                  style={{
                    padding: '12px 14px', textAlign: 'left',
                    color: '#475569', fontWeight: 700, fontSize: 11,
                    letterSpacing: 0.5, cursor: key ? 'pointer' : 'default',
                    userSelect: 'none', whiteSpace: 'nowrap',
                    borderBottom: '1px solid #1e293b',
                  }}>
                  {label}{key && <SortIcon col={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((track, i) => {
              const isEditing = editId === track.id;
              const st = STATUS_COLORS[track.status] || STATUS_COLORS.draft;
              return (
                <tr key={track.id} style={{
                  background: i % 2 === 0 ? '#0d1526' : '#0a1020',
                  borderBottom: '1px solid #1e293b',
                }}>
                  {/* Назва */}
                  <td style={{ padding: '11px 14px' }}>
                    {isEditing
                      ? <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                          style={{ ...inputStyle(), padding: '5px 8px', fontSize: 12 }} />
                      : <div>
                          <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{track.title}</div>
                          {track.episode && <div style={{ fontSize: 11, color: '#475569' }}>Серія {track.episode}</div>}
                        </div>
                    }
                  </td>

                  {/* Серіал */}
                  <td style={{ padding: '11px 14px', color: '#64748b', fontSize: 12 }}>
                    {track.series || '—'}
                  </td>

                  {/* Статус */}
                  <td style={{ padding: '11px 14px' }}>
                    {isEditing
                      ? <select value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}
                          style={{ ...inputStyle(), padding: '4px 8px', fontSize: 12 }}>
                          {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      : <span style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: st.bg, color: st.text,
                        }}>{st.label}</span>
                    }
                  </td>

                  {/* Прослуховування */}
                  <td style={{ padding: '11px 14px', color: '#94a3b8', fontWeight: 600 }}>
                    {formatNum(track.plays)}
                  </td>

                  {/* Тривалість */}
                  <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDuration(track.duration)}
                  </td>

                  {/* Дії */}
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveEdit(track.id)} style={smallBtn('#10b981')}>✓ Зберегти</button>
                        <button onClick={() => setEditId(null)} style={smallBtn('#334155')}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Play для Оксани */}
                        <button
                          onClick={() => playTrack(track)}
                          title={track.audio_url ? 'Прослухати' : 'Аудіо ще не завантажено'}
                          disabled={!track.audio_url && !MOCK_TRACKS.find(t=>t.id===track.id)}
                          style={{
                            ...smallBtn(playingId === track.id && !playerPaused ? '#ef9f27' : '#1e3a5f'),
                            padding: '5px 10px', fontSize: 13,
                            border: `1px solid ${playingId === track.id ? '#ef9f27' : '#1e3a5f'}`,
                            opacity: (!track.audio_url && track.id.startsWith('mock')) ? 0.4 : 1,
                          }}>
                          {playingId === track.id && !playerPaused ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => startEdit(track)} style={smallBtn('#334155')}>✏️</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#334155', fontSize: 13 }}>
                Нічого не знайдено
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: '#334155' }}>
        Показано {filtered.length} з {tracks.length} треків
      </div>
    </div>
  );
}

// ─── C. STATISTICS ───────────────────────────────────────────────
function Statistics() {
  const s = MOCK_STATS;
  const maxBar = Math.max(...s.weekly_chart);
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Карточки KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'Всього прослуховувань', value: formatNum(s.total_plays), icon: '▶', color: '#ef9f27' },
          { label: 'За цей тиждень', value: formatNum(s.plays_week), icon: '📅', color: '#10b981' },
          { label: 'Вчора', value: formatNum(s.plays_yesterday), icon: '📈', color: '#60a5fa' },
          { label: 'Виручка ₴', value: s.total_revenue.toLocaleString(), icon: '💰', color: '#a78bfa' },
          { label: 'Опубліковано', value: `${s.published_tracks} / ${s.total_tracks}`, icon: '🎙', color: '#f472b6' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: '#0d1526', borderRadius: 14, padding: '18px 16px',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Графік за тиждень */}
      <div style={{ background: '#0d1526', borderRadius: 14, padding: '20px 24px', border: '1px solid #1e293b' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 16 }}>
          Прослуховування за тиждень
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {s.weekly_chart.map((val, i) => {
            const h = Math.round((val / maxBar) * 100);
            const isToday = i === 6;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, color: '#475569' }}>{val}</div>
                <div style={{
                  width: '100%', height: h,
                  background: isToday
                    ? 'linear-gradient(to top, #ef9f27, #f59e0b)'
                    : 'linear-gradient(to top, #1e3a5f, #2d4f7c)',
                  borderRadius: '4px 4px 0 0',
                  border: isToday ? '1px solid rgba(239,159,39,0.4)' : 'none',
                  transition: 'height 0.3s ease',
                }} />
                <div style={{ fontSize: 10, color: isToday ? '#ef9f27' : '#334155', fontWeight: isToday ? 700 : 400 }}>
                  {days[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Топ треки */}
      <div style={{ background: '#0d1526', borderRadius: 14, padding: '20px 24px', border: '1px solid #1e293b' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 16 }}>
          Топ треки
        </div>
        {s.top_tracks.map((t, i) => (
          <div key={t.title} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 0', borderBottom: i < s.top_tracks.length - 1 ? '1px solid #1e293b' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i === 0 ? 'linear-gradient(135deg,#ef9f27,#f59e0b)' : '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: i === 0 ? '#fff' : '#475569', flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{t.title}</div>
              <div style={{ marginTop: 5, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${t.completion}%`, height: '100%', background: '#10b981', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef9f27' }}>{formatNum(t.plays)}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{t.completion}% дослухали</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Мікро-компоненти ─────────────────────────────────────────────
function Field({ label, error, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: error ? '#f87171' : '#64748b', marginBottom: 5, letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrMsg({ text }) {
  return <div style={{ fontSize: 11, color: '#f87171', marginTop: -8 }}>⚠️ {text}</div>;
}

function inputStyle(hasError = false) {
  return {
    width: '100%', padding: '10px 12px',
    background: '#0a1020', border: `1px solid ${hasError ? '#ef4444' : '#1e293b'}`,
    borderRadius: 8, color: '#f1f5f9', fontSize: 13,
    fontFamily: 'Montserrat, sans-serif', outline: 'none',
  };
}

function btnStyle(bg) {
  return {
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: bg, color: '#fff', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
  };
}

function smallBtn(bg) {
  return {
    padding: '5px 10px', borderRadius: 6, border: 'none',
    background: bg, color: '#f1f5f9', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
  };
}

// ─── ГОЛОВНИЙ КОМПОНЕНТ ───────────────────────────────────────────
export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Montserrat:wght@400;500;600;700&family=Lora:wght@600&display=swap');
        .ap-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .ap-root input, .ap-root select, .ap-root textarea {
          color-scheme: dark;
        }
        .ap-root input:focus, .ap-root select:focus, .ap-root textarea:focus {
          border-color: #ef9f27 !important; outline: none;
        }
        @media (max-width: 640px) {
          .ap-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="ap-root" style={{
        background: '#060d1f', minHeight: '100vh',
        fontFamily: 'Montserrat, sans-serif', color: '#f1f5f9',
      }}>

        {/* Шапка */}
        <div style={{
          background: 'rgba(10,16,32,0.95)', borderBottom: '1px solid #1e293b',
          padding: '0 5%', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'Comfortaa, cursive', fontSize: 22, color: '#ef9f27' }}>Balabony®</span>
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 700, letterSpacing: 1 }}>ADMIN</span>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.avatar_url && <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
              <span style={{ fontSize: 12, color: '#64748b' }}>{user.name}</span>
              <span style={{ fontSize: 10, background: '#1e293b', color: '#ef9f27', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {user.role?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 5%' }}>

          {/* Таби */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0a1020', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
                background: activeTab === tab.id ? '#ef9f27' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#475569',
                transition: 'background 0.15s, color 0.15s',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Вміст табів */}
          <div style={{
            background: '#0a1020', borderRadius: 16,
            padding: 28, border: '1px solid #1e293b',
          }}>
            {activeTab === 'upload'  && <UploadForm />}
            {activeTab === 'content' && <ContentTable />}
            {activeTab === 'stats'   && <Statistics />}
          </div>
        </div>
      </div>
    </>
  );
}
