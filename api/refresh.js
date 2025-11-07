// api/refresh.js  ← MUST BE IN PROJECT ROOT
let latestScanner = [];
let latestStats = {};

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      scanner: latestScanner,
      stats: latestStats,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    if (req.headers['x-webhook-secret'] !== 'alphastream-bot-secure-2025!x7k9') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.body.type === 'SCANNER') latestScanner = req.body.data.signals || [];
    if (req.body.type === 'STATS') latestStats = req.body.data || {};

    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
