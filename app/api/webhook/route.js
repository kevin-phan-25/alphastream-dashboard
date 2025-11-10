// app/api/webhook/route.js
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SECRET = process.env.WEBHOOK_SECRET;

export async function POST(request) {
  const secret = request.headers.get('x-webhook-secret');
  const bypass = request.headers.get('x-vercel-protection-bypass');

  if (secret !== SECRET || bypass !== 'v1.bypass_token_pwzfqlw14d4954dsbc9awhudccwkpl') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    const dataDir = join(process.cwd(), 'public', 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    const files = {
      'scan.json': type === 'SCAN' ? body : null,
      'trade.json': type === 'TRADE' ? body : null,
      'stats.json': type === 'STATS' ? body : null,
      'backtest.json': type === 'BACKTEST' ? body : null,
      'init.json': type === 'INIT' ? body : null,
    };

    Object.entries(files).forEach(([file, content]) => {
      if (content !== null) {
        writeFileSync(join(dataDir, file), JSON.stringify(content, null, 2));
      }
    });

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500 });
  }
}
