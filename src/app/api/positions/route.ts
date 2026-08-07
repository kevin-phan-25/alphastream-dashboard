/**
 * Date: 2026-08-07
 * File: src/app/api/positions/route.ts
 *
 * Changes:
 * - Proxies to Core /positions
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/positions");
    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Positions proxy error:", error);
    return Response.json(
      { error: "Failed to fetch positions from Core" },
      { status: 502 }
    );
  }
}
