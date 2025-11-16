// app/api/scan/route.ts
export async function POST() {
  return new Response('Scan triggered', { status: 200 });
}
