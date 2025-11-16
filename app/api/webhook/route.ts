import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  console.log('[WEBHOOK]', body.type, body.data);

  if (globalThis.sseClients) {
    globalThis.sseClients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(body)}\n\n`);
      } catch (e) {
        globalThis.sseClients = globalThis.sseClients.filter(c => c !== client);
      }
    });
  }

  return NextResponse.json({ status: 'ok' });
}
