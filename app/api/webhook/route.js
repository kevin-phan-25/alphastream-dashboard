// app/api/webhook/route.js
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

let inMemoryData = {
  equity: 99998.93,
  positions: 0,
  dailyLoss: 0,
  lastScan: 'Never',
  winRate: 0,
  trades: [],
  logs: ['Waiting for data...']
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data, t } = body;

    // Update in-memory state
    if (type === 'PING') {
      inMemoryData.logs.unshift(`[${new Date(t).toLocaleTimeString()}] ${data.msg}`);
    }
    if (type === 'TRADE') {
      inMemoryData.logs.unshift(`[${new Date(t).toLocaleTimeString()}] BUY ${data.symbol} @ $${data.entry} ×${data.qty}`);
      inMemoryData.trades.push({ symbol: data.symbol, pnl: 0 });
      inMemoryData.equity += data.entry * data.qty * -1; // simulate
    }
    if (type === 'HEARTBEAT') {
      inMemoryData.equity = data.equity;
      inMemoryData.lastScan = new Date().toLocaleTimeString();
    }

    // Keep only last 50 logs
    inMemoryData.logs = inMemoryData.logs.slice(0, 50);

    // Write to public/data.json (Vercel allows public/ folder)
    const filePath = join(process.cwd(), 'public', 'data.json');
    await writeFile(filePath, JSON.stringify(inMemoryData, null, 2));

    // Optional: Auto-commit to GitHub (uncomment if you want persistence)
    // try {
    //   execSync('git add public/data.json');
    //   execSync(`git commit -m "Update data.json - ${new Date().toISOString()}"`);
    //   execSync('git push');
    // } catch (e) {}

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

// GET: Serve data.json for polling
export async function GET() {
  return new Response(JSON.stringify(inMemoryData), {
    headers: { 'Content-Type': 'application/json' }
  });
}
