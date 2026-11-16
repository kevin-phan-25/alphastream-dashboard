import { coreFetch } from "@/lib/core";
export const runtime = "edge";
export async function GET() {
  try {
    const response = await coreFetch("/ready");
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Readiness service unavailable" },
      { status: 502 },
    );
  }
}
