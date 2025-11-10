// app/api/webhook/route.js
let latestData = { type: 'INIT', data: { msg: 'AlphaStream v4.0 Ready' } };

export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  latestData = { ...body, t: new Date().toISOString() };
  console.log('LIVE WEBHOOK →', body.type);

  return new Response('OK', { status: 200 });
}

export async function GET() {
  return Response.json(latestData);
}
