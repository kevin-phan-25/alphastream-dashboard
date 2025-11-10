// app/api/webhook/route.js — FINAL WORKING NEXT.JS APP ROUTER
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const DATA_FILE = resolve(process.cwd(), 'public/data/data.json');

export async function POST(request) {
  try {
    const { type, data } = await request.json();
    const secret = request.headers.get('x-webhook-secret');

    if (secret !== process.env.WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Invalid secret' }), { status: 401 });
    }

    let current = {
      signals: [],
      stats: { open: 0, pnl: '+0', trades: 0, winRate: 0 },
      lastUpdate: new Date().toISOString()
    };

    try {
      if (require('fs').existsSync(DATA_FILE)) {
        current = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      }
    } catch (e) {}

    if (type === 'SCAN') current.signals = data.signals || [];
    if (type === 'STATS') current.stats = { ...current.stats, ...data };
    if (type === 'INIT') current.init = data;

    current.lastUpdate = new Date().toISOString();

    writeFileSync(DATA_FILE, JSON.stringify(current, null, 2));

    return new Response(JSON.stringify({ success: true, received: type }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
