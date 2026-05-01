// api/admin/tracks.js — CRUD для треків
// ================================================================
// GET  /api/admin/tracks          — список всіх треків (для адмінки)
// POST /api/admin/tracks          — створити новий трек
// PATCH /api/admin/tracks?id=...  — оновити трек (статус, назва, listen_url)
// DELETE /api/admin/tracks?id=... — видалити трек
// ================================================================

import { requireRole } from '../auth/me.js';

async function getDB() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  return pool;
}

export default requireRole('admin', 'editor')(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET — список треків ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const pool = await getDB();
      const { rows } = await pool.query(`
        SELECT
          t.id, t.title, t.episode_num, t.duration_sec,
          t.is_free, t.price_uah, t.status,
          t.audio_url, t.cover_url, t.listen_url,
          t.play_count, t.created_at,
          s.title AS series_title,
          u.name  AS author_name
        FROM tracks t
        LEFT JOIN series s ON t.series_id = s.id
        LEFT JOIN users  u ON t.author_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 100
      `);
      await pool.end();
      return res.status(200).json({ tracks: rows });
    } catch (err) {
      console.error('[tracks GET]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — створити трек ────────────────────────────────────
  if (req.method === 'POST') {
    const {
      title, series_id, episode_num, genre,
      description, is_free, price_uah,
      audio_url, cover_url,
      listen_url,     // ← посилання для кнопки "Слухати" (TG бот або прямий URL)
      duration_sec,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title обов\'язковий' });

    try {
      const pool = await getDB();
      const { rows } = await pool.query(`
        INSERT INTO tracks (
          author_id, series_id, title, episode_num,
          audio_url, cover_url, listen_url,
          duration_sec, is_free, price_uah, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'review')
        RETURNING *
      `, [
        req.user.userId,
        series_id || null,
        title,
        episode_num || null,
        audio_url || null,
        cover_url || null,
        listen_url || null,
        duration_sec || 0,
        is_free ?? true,
        price_uah || 7,
      ]);
      await pool.end();
      return res.status(201).json({ track: rows[0] });
    } catch (err) {
      console.error('[tracks POST]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — оновити трек ────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id обов\'язковий' });

    const allowed = ['title', 'status', 'is_free', 'price_uah',
                     'audio_url', 'cover_url', 'listen_url',
                     'episode_num', 'duration_sec'];

    const updates = Object.entries(req.body)
      .filter(([k]) => allowed.includes(k));

    if (!updates.length) return res.status(400).json({ error: 'Немає полів для оновлення' });

    const setClause = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values    = [id, ...updates.map(([, v]) => v)];

    try {
      const pool = await getDB();
      const { rows } = await pool.query(
        `UPDATE tracks SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      await pool.end();
      if (!rows.length) return res.status(404).json({ error: 'Трек не знайдено' });
      return res.status(200).json({ track: rows[0] });
    } catch (err) {
      console.error('[tracks PATCH]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE — видалити трек ──────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id обов\'язковий' });

    try {
      const pool = await getDB();
      await pool.query('DELETE FROM tracks WHERE id = $1', [id]);
      await pool.end();
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[tracks DELETE]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
