// app/api/webhook/route.js
let latest = { type: 'INIT', data: { msg: 'Waiting for signals...' } };

export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    return new Response('Invalid secret', { status: 401 });
  }

  const body = await request.json();
  latest = body;
  console.log('WEBHOOK:', body);

  return new Response('OK', { status: 200 });
}

export async function GET() {
  return new Response(JSON.stringify(latest), {
    headers: { 'Content-Type': 'application/json' }
  });
}
