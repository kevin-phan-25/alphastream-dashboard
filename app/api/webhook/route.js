import { writeFile } from 'fs/promises';
import { join } from 'path';

let state = {
  equity: 99998.93,
  positions: 0,
  dailyLoss: 0,
  lastScan: '11:52:29 AM',
  winRate: 0,
  trades: [],
  logs: ['Waiting for data...']
};

const SECRET = 'alphastream-bot-secure-2025!x7k9';

export async function POST(req) {
  const headerSecret = req.headers.get('x-webhook-secret');
  if (headerSecret !== SECRET) {
    console.log('Invalid secret:', headerSecret);
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, data, t } = body;

    const time = new Date(t).toLocaleTimeString('en-US', { timeZone: 'America/New_York' });

    if (type === 'PING') {
      state.logs.unshift(`[${time}] ${data.msg || 'PING'}`);
    }
    if (type === 'HEARTBEAT') {
      state.equity = data.equity || state.equity;
      state.lastScan = time;
      state.logs.unshift(`[${time}] Heartbeat - Bot live`);
    }
    if (type === 'TRADE') {
      state.trades.unshift(data);
      state.positions = Math.min(state.positions + 1, 3);
      state.winRate = ((state.trades.filter(t => t.pnl > 0).length / state.trades.length) * 100 || 0).toFixed(1);
      state.logs.unshift(`[${time}] BUY ${data.symbol} @ $${data.entry} ×${data.qty}`);
    }
    if (type === 'EXIT') {
      state.trades = state.trades.map(tr => tr.symbol === data.symbol ? { ...tr, pnl: data.pnl } : tr);
      state.positions = Math.max(0, state.positions - 1);
      state.dailyLoss += data.pnl || 0;
      state.dailyLoss = Math.max(0, state.dailyLoss);
      state.logs.unshift(`[${time}] EXIT ${data.symbol} PnL: $${data.pnl}`);
    }
    if (type === 'INIT') {
      state.logs.unshift(`[${time}] Bot initialized`);
    }

    state.logs = state.logs.slice(0, 50);
    state.trades = state.trades.slice(0, 20);

    const filePath = join(process.cwd(), 'public', 'data.json');
    await writeFile(filePath, JSON.stringify(state, null, 2));

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify(state), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
  });
}
