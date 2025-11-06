// pages/api/webhook.js
let events = [];

// POST: Receive from GAS
export default function handler(req, res) {
  if (req.method === 'POST') {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== 'alphastream-bot-secure-2025!x7k9') {
      return res.status(401).json({ error: 'Invalid secret' });
    }

    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ error: 'Bad payload' });

    const event = { type, data, timestamp: new Date().toISOString() };
    events.push(event);
    if (events.length > 50) events.shift();

    console.log('[WEBHOOK]', type, data);
    return res.json({ success: true });
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    events.forEach(e => res.write(`data: ${JSON.stringify(e)}\n\n`));

    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    }, 15000);

    req.on('close', () => clearInterval(heartbeat));
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
