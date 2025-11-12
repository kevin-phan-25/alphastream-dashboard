// app/api/webhook/route.ts — Secure Webhook for GAS Bot
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.WEBHOOK_SECRET || 'alphastream-bot-secure-2025!x7k9';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-webhook-secret');
  if (authHeader !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data, t } = body;

    // Log to console (or integrate with Google Sheets/DB in prod)
    console.log(`[AlphaStream] ${type}:`, data, `at ${t}`);

    // Broadcast to dashboard (use Redis/WebSockets for real-time)
    // For now, just respond OK
    return NextResponse.json({ received: type, timestamp: t });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

// GET for polling stats (dashboard uses this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stats';

  // Mock stats — replace with real DB query
  if (type === 'stats') {
    return NextResponse.json({
      equity: 25250.50,
      positions: 2,
      dailyLoss: 45.20,
      winRate: 78.5
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
