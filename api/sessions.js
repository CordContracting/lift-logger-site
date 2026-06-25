// Vercel serverless function — returns all logged sessions for the Progress tab.
export default async function handler(req, res) {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE, AIRTABLE_TABLE } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }
  try {
    const table = AIRTABLE_TABLE || 'Sessions';
    let records = [], offset = null;
    do {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}?pageSize=100` + (offset ? `&offset=${offset}` : '');
      const r = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } });
      const d = await r.json();
      if (!r.ok) { res.status(502).json({ error: d }); return; }
      records = records.concat(d.records || []);
      offset = d.offset;
    } while (offset);
    const out = records.map(rec => ({
      date: rec.fields.Date || '',
      session: rec.fields.Session || '',
      loggedAt: rec.fields['Logged At'] || rec.createdTime,
      data: rec.fields.Data || ''
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ sessions: out });
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
