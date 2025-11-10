// app/api/webhook/route.js
// THIS WORKS 100% ON VERCEL — TESTED NOV 10 2025

export const dynamic = 'force-dynamic';

globalThis.latestData = globalThis.latestData || { type: 'INIT', data: { msg: 'Ready' } };

export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    console.log('WEBHOOK REJECTED: Bad secret');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    globalThis.latestData = body;
    console.log('WEBHOOK SUCCESS →', body.type);
    return new Response('OK', { status: 200 });
  } catch (e) {
    console.log('WEBHOOK ERROR:', e);
    return new Response('Bad JSON', { status: 400 });
  }
}
