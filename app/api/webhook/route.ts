// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { broadcast } from '@/lib/sse';

export const dynamic = 'force-dynamic'; // ADD THIS LINE

const SECRET = process.env.WEBHOOK_SECRET || 'alphastream-bot-secure-2025!x7k9';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-webhook-secret');
  if (authHeader !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data, t } = body;

    console.log(`[AlphaStream] ${type}:`, data, `at ${t}`);
    broadcast({ type, data, t });

    return NextResponse.json({ received: type, timestamp: t });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stats';

  if (type === 'stats') {
    return NextResponse.json({
      equity: 25250.50,
      positions: 2,
      dailyLoss: 45.20,
      dailyLossCap: 300,
      maxPositions: 3,
      drawdownShutoff: 15,
      winRate: 78.5
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
