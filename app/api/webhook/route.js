// app/api/webhook/route.js
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const SECRET = 'alphastream-bot-secure-2025!x7k9';
const DATA_FILE = path.join(process.cwd(), 'public', 'data.json');

export async function POST(req) {
  const header = req.headers.get('x-webhook-secret');
  if (header !== SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json(); // GAS payload { type: 'TRADE', data: {...}, t: timestamp }
    
    // Load existing data
    let existingData = { equity: 99998.93, positions: 0, dailyLoss: 0, lastScan: null, winRate: 0, trades: [], logs: ['Waiting for data...'] };
    try {
      const fileContent = await readFile(DATA_FILE, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch (e) {
      // First run — default data
    }

    // Update based on GAS type
    switch (body.type) {
      case 'HEARTBEAT':
        existingData.lastScan = new Date(body.t).toLocaleTimeString();
        existingData.logs.unshift(`[${new Date().toLocaleTimeString()}] Heartbeat - Bot live`);
        break;
      case 'TRADE':
        existingData.trades.unshift(body.data);
        existingData.positions = Math.min(existingData.positions + 1, 3);
        existingData.winRate = ((existingData.trades.filter(t => t.pnl > 0).length / existingData.trades.length) * 100 || 0).toFixed(1);
        break;
      case 'EXIT':
        existingData.trades = existingData.trades.map(tr => tr.symbol === body.data.symbol ? { ...tr, pnl: body.data.pnl } : tr);
        existingData.positions = Math.max(0, existingData.positions - 1);
        existingData.dailyLoss += body.data.pnl || 0;
        existingData.dailyLoss = Math.max(0, existingData.dailyLoss);
        break;
      case 'INIT':
        existingData = { ...existingData, ...body.data };
        break;
      default:
        existingData.logs.unshift(`[${new Date().toLocaleTimeString()}] ${body.type}: ${JSON.stringify(body.data)}`);
    }

    // Limit arrays
    existingData.logs = existingData.logs.slice(0, 50);
    existingData.trades = existingData.trades.slice(0, 20);

    // Write to public/data.json (UI polls this)
    await writeFile(DATA_FILE, JSON.stringify(existingData, null, 2));

    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
