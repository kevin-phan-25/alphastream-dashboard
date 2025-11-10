// app/api/webhook/route.js
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SECRET = process.env.WEBHOOK_SECRET;

export default async function handler(req, res) {
  const secret = req.headers['x-webhook-secret'];
  const bypass = req.headers['x-vercel-protection-bypass'];

  if (secret !== SECRET || bypass !== 'v1.bypass_token_pwzfqlw14d4954dsbc9awhudccwkpl') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    // Create data folder
    const dataDir = join(process.cwd(), 'public', 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    // Save all types
    const files = {
      'scan.json': type === 'SCAN' ? body : null,
      'trade.json': type === 'TRADE' ? body : null,
      'stats.json': type === 'STATS' ? body : null,
      'backtest.json': type === 'BACKTEST' ? body : null,
      'init.json': type === 'INIT' ? body : null,
    };

    Object.entries(files).forEach(([file, content]) => {
      if (content) {
        writeFileSync(join(dataDir, file), JSON.stringify(content, null, 2));
      }
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}
