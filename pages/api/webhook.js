// api/webhook.js
let events = [];

// Vercel serverless function
export const config = { api: { bodyParser: true } };

export default function handler(req, res) {
  // ---------- POST – receive from GAS ----------
  if (req.method === 'POST') {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== 'alphastream-bot-secure-2025!x7k9') {
      return res.status(401).json({ error: 'Invalid secret' });
    }

    const { type, data } = req.body || {};
    if (!type || !data) return res.status(400).json({ error: 'Bad payload' });

    const event = { type, data, timestamp: new Date().toISOString() };
    events.push(event);
    if (events.length > 50) events.shift();

    return res.status(200).json({ success: true });
  }

  // ---------- GET – SSE for the dashboard ----------
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // send existing events immediately
    events.forEach(e => res.write(`data: ${JSON.stringify(e)}\n\n`));

    // heartbeat
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 15000);

    req.on('close', () => clearInterval(heartbeat));
    return;
  }

  // ---------- other methods ----------
  res.status(405).json({ error: 'Method not allowed' });
}
