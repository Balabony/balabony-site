// api/ai/news-feed.js — AI автооновлення стрічки новин
// ================================================================
// Підготовлений роут для підключення OpenAI/Azure
//
// Змінні середовища (додати у Vercel):
//   OPENAI_API_KEY      — для GPT-4o (генерація анонсів)
//   AZURE_OPENAI_KEY    — альтернатива (Azure OpenAI)
//   AZURE_OPENAI_ENDPOINT
//   NEWS_WEBHOOK_SECRET — захист від несанкціонованих запитів
//
// Сценарії:
//   POST /api/ai/news-feed?action=generate  — генерувати анонс
//   POST /api/ai/news-feed?action=translate — перекласти на укр.
//   GET  /api/ai/news-feed                  — список останніх анонсів
// ================================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.NEXT_PUBLIC_BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── GET — список останніх анонсів з БД ──────────────────────
  if (req.method === 'GET') {
    try {
      // TODO: підключити до таблиці news або tracks
      // const { rows } = await pool.query(
      //   'SELECT id, title, summary_ai, created_at FROM tracks WHERE status=$1 ORDER BY created_at DESC LIMIT 10',
      //   ['published']
      // );
      return res.status(200).json({
        items: [],
        message: 'AI news feed готовий до підключення. Додайте OPENAI_API_KEY у Vercel.',
        next_step: 'POST /api/ai/news-feed?action=generate з { "text": "..." }'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey       = process.env.OPENAI_API_KEY;
  const azureKey     = process.env.AZURE_OPENAI_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;

  // ── POST: generate — генерація AI анонсу ────────────────────
  if (action === 'generate') {
    const { text, title, style = 'balabony' } = req.body;
    if (!text) return res.status(400).json({ error: 'Поле text обов\'язкове' });

    const STYLE_PROMPTS = {
      balabony: 'Ти — редактор дитячої аудіоплатформи Balabony. Пиши анонси тепло, по-українськи, 2-3 речення, без спойлерів.',
      news:     'Ти — новинний редактор. Пиши короткі нейтральні анонси українською мовою.',
      social:   'Ти — SMM менеджер. Пиши захопливі пости для Instagram/TikTok українською.',
    };

    const systemPrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.balabony;
    const userPrompt   = title
      ? `Назва: "${title}"\n\nТекст:\n${text.slice(0, 2000)}`
      : text.slice(0, 2000);

    // Спробуємо OpenAI, потім Azure
    let result = null;

    if (apiKey) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: userPrompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });
        const data = await resp.json();
        result = data.choices?.[0]?.message?.content?.trim();
      } catch (err) {
        console.error('[ai/news-feed] OpenAI error:', err.message);
      }
    }

    if (!result && azureKey && azureEndpoint) {
      try {
        const resp = await fetch(`${azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: userPrompt },
            ],
            max_tokens: 300,
          }),
        });
        const data = await resp.json();
        result = data.choices?.[0]?.message?.content?.trim();
      } catch (err) {
        console.error('[ai/news-feed] Azure error:', err.message);
      }
    }

    if (!result) {
      return res.status(503).json({
        error: 'AI недоступний',
        hint: 'Додайте OPENAI_API_KEY або AZURE_OPENAI_KEY у Vercel Environment Variables',
      });
    }

    return res.status(200).json({ summary: result, style, chars: result.length });
  }

  // ── POST: translate — переклад тексту на українську ─────────
  if (action === 'translate') {
    const { text, from = 'auto' } = req.body;
    if (!text) return res.status(400).json({ error: 'Поле text обов\'язкове' });

    if (!apiKey) {
      return res.status(503).json({
        error: 'OPENAI_API_KEY не налаштовано',
        hint: 'Додайте ключ у Vercel Environment Variables'
      });
    }

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Переклади текст на українську мову. Відповідай ТІЛЬКИ перекладом, без пояснень.' },
            { role: 'user',   content: text.slice(0, 3000) },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });
      const data = await resp.json();
      const translated = data.choices?.[0]?.message?.content?.trim();
      if (!translated) throw new Error('Порожня відповідь OpenAI');
      return res.status(200).json({ translated, original_length: text.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({
    error: 'Невідома дія',
    available_actions: ['generate', 'translate'],
    usage: 'POST /api/ai/news-feed?action=generate  body: { "text": "...", "title": "..." }'
  });
}
