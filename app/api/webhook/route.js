// app/api/webhook/route.js
export const dynamic = 'force-dynamic';

globalThis.latestData = globalThis.latestData || { type: 'INIT', data: { msg: 'AlphaStream v4.0 LIVE' } };

export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  globalThis.latestData = body;
  console.log('WEBHOOK HIT →', body.type);
  return new Response('OK', { status: 200 });
}
