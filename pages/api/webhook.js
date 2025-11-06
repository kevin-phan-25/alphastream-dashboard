// pages/api/webhook.js
let events = []; // In-memory store (persists per instance)

export default function handler(req, res) {
  if (req.method === 'POST') {
    // === SECURITY: Check secret ===
    const secret = req.headers['x-webhook-secret'];
    if (secret !== 'alphastream-bot-secure-2025!x7k9') {
      console.warn('Unauthorized webhook');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`[WEBHOOK] ${type}`, data);

    // Store event
    const event = { type, data, timestamp: new Date().toISOString() };
    events.push(event);

    // Keep only last 50
    if (events.length > 50) events.shift();

    return res.json({ success: true, received: type });
  }

  if (req.method === 'GET') {
    // === SSE for live updates ===
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send existing events
    events.forEach(event => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Heartbeat
    const interval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
    }, 15000);

    req.on('close', () => clearInterval(interval));
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
