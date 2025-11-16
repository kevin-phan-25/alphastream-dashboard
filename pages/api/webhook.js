// pages/api/webhook.js
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const SECRET = 'alphastream-bot-secure-2025!x7k9';
const DATA_FILE = path.join(process.cwd(), 'public', 'data.json');

export default async function handler(req, res) {
  if (req.headers['x-webhook-secret'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    let existingData = { equity: 99998.93, positions: 0, dailyLoss: 0, lastScan: '11:52:29 AM', winRate: 0, trades: [], logs: ['Waiting for data...'] };

    try {
      const fileContent = await readFile(DATA_FILE, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch {}

    switch (body.type) {
      case 'HEARTBEAT':
        existingData.lastScan = new Date(body.t).toLocaleTimeString();
        existingData.logs.unshift(`[${new Date().toLocaleTimeString()}] Bot live - Heartbeat`);
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

    existingData.logs = existingData.logs.slice(0, 50);
    existingData.trades = existingData.trades.slice(0, 20);

    await writeFile(DATA_FILE, JSON.stringify(existingData, null, 2));

    res.status(200).json({ ok: true, received: body.type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
