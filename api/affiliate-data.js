/**
 * Vercel Serverless Function (Node) — placeholder.
 * Production: validate request, call Google Sheets with service account / API key from env only,
 * filter by utm_source and date range, return { rows: [...] }.
 *
 * Expected path when deployed: /api/affiliate-data
 */
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var utm = req.query && req.query.utm_source;
  return res.status(200).json({
    rows: utm
      ? [
          {
            date: new Date().toISOString().slice(0, 10),
            utm_source: String(utm),
            note: 'שלד API — יוחלף במשיכה מ-Google Sheets',
          },
        ]
      : [],
    meta: { source: 'placeholder' },
  });
};
