// Vercel serverless function — receives a logged session and writes it to Airtable.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const { AIRTABLE_TOKEN, AIRTABLE_BASE, AIRTABLE_TABLE } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    res.status(500).json({ error: 'Server not configured — check Vercel env vars' });
    return;
  }
  try {
    const { date, session, log, loggedAt, data } = req.body || {};
    const table = AIRTABLE_TABLE || 'Sessions';
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`,
      { method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: {
          Session: session || 'Session',
          Date: date || '',
          Log: log || '',
          'Logged At': loggedAt || new Date().toISOString(),
          Data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : ''
        } }) }
    );
    const d = await r.json();
    if (!r.ok) { res.status(502).json({ error: d }); return; }
    res.status(200).json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
