import { NextResponse } from 'next/server';

// const WEBHOOK_SECRET = 'alphastream-bot-secure-2025!x7k9';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  const headerSecret = request.headers.get('X-Webhook-Secret');
  if (headerSecret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();
  console.log('Webhook received:', body); // Will show in Vercel logs

  // TODO: Save to your DB / update state / etc.
  // For now just acknowledge
  return NextResponse.json({ success: true });
}
