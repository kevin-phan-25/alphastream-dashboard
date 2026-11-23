import { requireOperator } from "@/lib/operator";
/**
 * Date: 2026-08-07
 * File: src/app/api/admin/scan/route.ts
 *
 * Changes:
 * - Proxies POST to Core /admin/scan
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST(request: Request) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  try {
    const response = await coreFetch("/admin/scan", {
      method: "POST",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(245_000)]),
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Scan proxy error:", error);
    return Response.json(
      { error: "Failed to trigger scan on Core" },
      { status: 502 },
    );
  }
}
