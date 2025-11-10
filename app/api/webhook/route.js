// app/api/webhook/route.js
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SECRET = process.env.WEBHOOK_SECRET || 'alphastream-bot-secure-2025!x7k9';
const BYPASS = 'v1.bypass_token_pwzfqlw14d4954dsbc9awhudccwkpl';
const DATA_DIR = join(process.cwd(), 'public', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function load(file) {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

export async function POST(request) {
  const secret = request.headers.get('x-webhook-secret');
  const bypass = request.headers.get('x-vercel-protection-bypass');

  if (secret !== SECRET && bypass !== BYPASS) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    // POLL REQUEST FROM DASHBOARD
    if (type === 'POLL') {
      return Response.json({
        signals: load('scan.json')?.signals || [],
        stats: load('stats.json') || { open: 0, pnl: 0, trades: 0 },
        initMsg: load('init.json')?.msg || 'LIVE'
      });
    }

    // SAVE DATA FROM GAS
    if (type === 'INIT') writeFileSync(join(DATA_DIR, 'init.json'), JSON.stringify({ msg: data.msg }));
    if (type === 'SCAN') writeFileSync(join(DATA_DIR, 'scan.json'), JSON.stringify({ signals: data.signals }));
    if (type === 'STATS') writeFileSync(join(DATA_DIR, 'stats.json'), JSON.stringify(data));

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('', { method: 'POST', body: JSON.stringify({ type: 'POLL' }) }));
}
