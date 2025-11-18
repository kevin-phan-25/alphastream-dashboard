import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const secret = body.secret || '';

  // Validate secret (from bot LOG_WEBHOOK_SECRET)
  if (process.env.LOG_WEBHOOK_SECRET && secret !== process.env.LOG_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Log to GAS or sheet (adapt to your GAS doPost)
  try {
    await fetch(process.env.GAS_SHEET_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return NextResponse.json({ status: 'OK' });
  } catch (e) {
    return NextResponse.json({ error: 'Log failed' }, { status: 500 });
  }
}
