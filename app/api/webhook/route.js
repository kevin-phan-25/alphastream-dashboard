// app/api/webhook/route.js
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SECRET = process.env.WEBHOOK_SECRET || 'alphastream-bot-secure-2025!x7k9';
const BYPASS = 'v1.bypass_token_pwzfqlw14d4954dsbc9awhudccwkpl';

const DATA_DIR = join(process.cwd(), 'public', 'data');

// Ensure data folder exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export async function POST(request) {
  // === SECURITY CHECK ===
  const secret = request.headers.get('x-webhook-secret');
  const bypass = request.headers.get('x-vercel-protection-bypass');
  if (secret !== SECRET || bypass !== BYPASS) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    // === POLL REQUEST: RETURN CURRENT STATE ===
    if (type === 'POLL') {
      const load = (file) => {
        const path = join(DATA_DIR, file);
        if (existsSync(path)) {
          try {
            return JSON.parse(readFileSync(path, 'utf-8'));
          } catch {
            return null;
          }
        }
        return null;
      };

      const state = {
        signals: load('scan.json')?.data?.signals || [],
        trades: load('trade.json')?.data ? [load('trade.json').data] : [],
        stats: load('stats.json')?.data || { open: 0, pnl: 0, trades: 0 },
        backtests: load('backtest.json')?.data || [],
        equityCurve: [], // You can populate this later
        initMsg: load('init.json')?.data?.msg || '',
      };

      return Response.json({ state });
    }

    // === SAVE INCOMING DATA ===
    const files = {
      'scan.json': type === 'SCAN' ? body : null,
      'trade.json': type === 'TRADE' ? body : null,
      'stats.json': type === 'STATS' ? body : null,
      'backtest.json': type === 'BACKTEST' ? body : null,
      'init.json': type === 'INIT' ? body : null,
    };

    Object.entries(files).forEach(([file, content]) => {
      if (content !== null) {
        writeFileSync(join(DATA_DIR, file), JSON.stringify(content, null, 2));
      }
    });

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Error', { status: 500 });
  }
}
