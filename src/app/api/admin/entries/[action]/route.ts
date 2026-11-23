import { coreFetch } from "@/lib/core";
import { requireOperator } from "@/lib/operator";

export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  const { action } = await params;
  if (action !== "pause" && action !== "resume") {
    return Response.json({ error: "Unknown entry control" }, { status: 404 });
  }
  try {
    const upstream = await coreFetch(`/admin/${action}-entries`, {
      method: "POST",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(245_000)]),
    });
    return Response.json(await upstream.json(), { status: upstream.status });
  } catch {
    return Response.json(
      { error: "Core entry control unavailable" },
      { status: 502 },
    );
  }
}
