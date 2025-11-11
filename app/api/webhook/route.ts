import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'alphastream-bot-secure-2025!x7k9';
let sseClients: any[] = [];

export async function POST(request: Request) {
  const headerSecret = request.headers.get('X-Webhook-Secret');
  if (headerSecret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();
  console.log('Webhook:', body);

  // Broadcast to all SSE clients
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(body)}\n\n`);
  });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}

// SSE Endpoint for live updates
export async function GET(request: Request) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  sseClients.push(writer);

  request.signal.addEventListener('abort', () => {
    sseClients = sseClients.filter(c => c !== writer);
    writer.close();
  });

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // Keep connection alive
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(`data: {"type":"PING"}\n\n`));
  }, 15000);

  writer.closed.finally(() => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter(c => c !== writer);
  });

  return new Response(responseStream.readable, { headers });
}
