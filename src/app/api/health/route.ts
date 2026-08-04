export const runtime = "edge";

export async function GET() {
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
