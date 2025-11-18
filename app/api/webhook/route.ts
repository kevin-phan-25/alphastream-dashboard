import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.secret !== process.env.LOG_WEBHOOK_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await fetch(process.env.GAS_SHEET_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return NextResponse.json({ status: 'OK' });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
