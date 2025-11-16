// app/api/webhook/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();

  if (globalThis.sseClients) {
    globalThis.sseClients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(body)}\n\n`);
      } catch {}
    });
  }

  return new Response('OK', { status: 200 });
}
