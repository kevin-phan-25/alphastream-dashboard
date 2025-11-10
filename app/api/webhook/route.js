// app/api/webhook/route.js
export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    return new Response('Invalid secret', { status: 401 });
  }

  const body = await request.json();
  console.log('WEBHOOK RECEIVED:', body);

  // Here you can save to global state, file, DB, etc.
  globalThis.lastPayload = body;

  return new Response('OK', { status: 200 });
}
