/**
 * Vercel Serverless: reads Google Sheets with service account from env only.
 * GET /api/affiliate-data?utm_source=...&from=&to=
 *
 * Env:
 * - GOOGLE_SERVICE_ACCOUNT_JSON — full service account JSON (string)
 * - GOOGLE_SHEETS_SPREADSHEET_ID — id from /d/SPREADSHEET_ID/edit
 * - GOOGLE_SHEETS_RANGE — optional, default first sheet A:Z (e.g. Sheet1!A:Z)
 */
const { google } = require('googleapis');

function parseCredentials() {
  var raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !String(raw).trim()) return { error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON' };
  try {
    return { creds: JSON.parse(raw) };
  } catch (e) {
    return { error: 'Invalid GOOGLE_SERVICE_ACCOUNT_JSON (must be valid JSON)' };
  }
}

function normalizeHeader(h) {
  return String(h == null ? '' : h)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function columnIndexes(headers) {
  var norm = headers.map(normalizeHeader);
  function find(names) {
    for (var i = 0; i < names.length; i++) {
      var idx = norm.indexOf(names[i]);
      if (idx !== -1) return idx;
    }
    return -1;
  }
  var dateIdx = find(['date', 'תאריך']);
  var utmIdx = find(['utm_source', 'utm', 'source']);
  var noteIdx = find(['note', 'notes', 'הערות', 'פעולות_/_הערות']);
  return { dateIdx: dateIdx, utmIdx: utmIdx, noteIdx: noteIdx };
}

function parseRowDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    var epoch = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(epoch.getTime())) return epoch;
  }
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function inRange(date, fromIso, toIso) {
  if (!fromIso && !toIso) return true;
  if (!date) return false;
  var t = date.getTime();
  if (fromIso) {
    var f = new Date(fromIso).getTime();
    if (!isNaN(f) && t < f) return false;
  }
  if (toIso) {
    var end = new Date(toIso).getTime();
    if (!isNaN(end) && t > end) return false;
  }
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var utm = req.query && req.query.utm_source ? String(req.query.utm_source).trim() : '';
  var fromIso = req.query && req.query.from ? String(req.query.from) : '';
  var toIso = req.query && req.query.to ? String(req.query.to) : '';

  if (!utm) {
    return res.status(200).json({ rows: [], meta: { message: 'No utm_source' } });
  }

  var sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!sheetId || !String(sheetId).trim()) {
    return res.status(500).json({
      error: 'Server misconfiguration',
      detail: 'Set GOOGLE_SHEETS_SPREADSHEET_ID in Vercel environment variables.',
    });
  }

  var parsed = parseCredentials();
  if (parsed.error) {
    return res.status(500).json({ error: 'Server misconfiguration', detail: parsed.error });
  }

  var range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z';

  try {
    var auth = new google.auth.GoogleAuth({
      credentials: parsed.creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    var sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    var getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: String(sheetId).trim(),
      range: range,
    });
    var values = getRes.data.values;
    if (!values || !values.length) {
      return res.status(200).json({ rows: [], meta: { source: 'sheets', count: 0 } });
    }

    var headers = values[0].map(function (c) {
      return String(c == null ? '' : c);
    });
    var idx = columnIndexes(headers);

    if (idx.utmIdx === -1) {
      return res.status(500).json({
        error: 'Sheet headers',
        detail:
          'Could not find utm column. Add a header named utm_source, utm, or source in row 1.',
      });
    }
    if (idx.dateIdx === -1) {
      return res.status(500).json({
        error: 'Sheet headers',
        detail: 'Could not find date column. Add a header named date or תאריך in row 1.',
      });
    }

    var out = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (!row) continue;
      var rowUtm = row[idx.utmIdx] != null ? String(row[idx.utmIdx]).trim() : '';
      if (rowUtm !== utm) continue;
      var cellDate = row[idx.dateIdx];
      var d = parseRowDate(cellDate);
      if (!inRange(d, fromIso, toIso)) continue;
      var note = idx.noteIdx !== -1 && row[idx.noteIdx] != null ? String(row[idx.noteIdx]) : '';
      out.push({
        date: d ? d.toISOString().slice(0, 10) : String(cellDate || ''),
        utm_source: rowUtm,
        note: note,
      });
    }

    return res.status(200).json({
      rows: out,
      meta: { source: 'sheets', count: out.length },
    });
  } catch (err) {
    var msg = err && err.message ? err.message : String(err);
    return res.status(500).json({
      error: 'Sheets request failed',
      detail: msg,
    });
  }
};
