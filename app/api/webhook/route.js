// app/api/webhook/route.js — BULLETPROOF NEXT.JS 13+ APP ROUTER
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const DATA_FILE = resolve(process.cwd(), 'public/data/data.json');

export async function POST(request) {
  try {
    const { type, data } = await request.json();
    const secret = request.headers.get('x-webhook-secret');

    if (secret !== process.env.WEBHOOK_SECRET) {
      return new Response('Invalid secret', { status: 401 });
    }

    let current = { signals: [], stats: { open: 0, pnl: '+0', trades: 0 }, lastUpdate: new Date().toISOString() };

    try {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      current = JSON.parse(raw);
    } catch (e) {
      // File doesn't exist yet — that's fine
    }

    if (type === 'SCAN') current.signals = data.signals || [];
    if (type === 'STATS') Object.assign(current.stats, data);
    if (type === 'INIT') current.init = data;

    current.lastUpdate = new Date().toISOString();

    writeFileSync(DATA_FILE, JSON.stringify(current, null, 2));

    return new Response(JSON.stringify({ success: true, received: type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Server error', { status: 500 });
  }
}
