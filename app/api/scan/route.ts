// app/api/scan/route.ts
export async function POST() {
  return new Response(JSON.stringify({ status: 'scan triggered' }), { status: 200 });
}
