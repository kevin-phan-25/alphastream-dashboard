// app/api/webhook/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

globalThis.latestData = globalThis.latestData || { type: 'INIT', data: { msg: 'AlphaStream v4.0 LIVE' } };

export async function POST(request) {
  const secret = process.env.WEBHOOK_SECRET;
  const headerSecret = request.headers.get('x-webhook-secret');

  if (headerSecret !== secret) {
    console.log('WEBHOOK REJECTED: Bad secret');
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  globalThis.latestData = body;
  console.log('WEBHOOK POST SUCCESS →', body.type);
  return new Response('OK', { status: 200 });
}

// GET handler so it doesn't 404 in browser
export async function GET() {
  console.log('WEBHOOK GET — CURRENT DATA:', globalThis.latestData?.type);
  return NextResponse.json(globalThis.latestData);
}
