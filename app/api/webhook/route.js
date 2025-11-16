// pages/api/webhook.js
import { writeFile } from 'fs/promises';
import { join } from 'path';

const SECRET = 'alphastream-bot-secure-2025!x7k9';

export default async function handler(req, res) {
  if (req.headers['x-webhook-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = req.body;
  const filePath = join(process.cwd(), 'public', 'data.json');
  await writeFile(filePath, JSON.stringify(data, null, 2));

  res.status(200).json({ ok: true });
}
