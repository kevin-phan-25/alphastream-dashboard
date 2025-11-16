// app/api/scan/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  // Trigger your GAS scan via web app (optional)
  // Or just return OK for now
  return NextResponse.json({ status: 'scan triggered' });
}
