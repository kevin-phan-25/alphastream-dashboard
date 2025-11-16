// app/api/webhook/route.js
import { writeFile } from 'fs/promises';
import { join } from 'path';

const SECRET = 'alphastream-bot-secure-2025!x7k9';

export async function POST(req) {
  const header = req.headers.get('x-webhook-secret');
  if (header !== SECRET) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const data = JSON.stringify(body, null, 2);

  const filePath = join(process.cwd(), 'public', 'data.json');
  await writeFile(filePath, data);

  return new Response('OK', { status: 200 });
}
