/**
 * Date: 2026-08-07
 * File: src/app/api/metrics/route.ts
 *
 * Changes:
 * - Proxies to Core /metrics (or /status)
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/metrics"); // or "/status" if that's what Core exposes
    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Metrics proxy error:", error);
    return Response.json(
      { error: "Failed to fetch metrics from Core" },
      { status: 502 }
    );
  }
}
