/**
 * Date: 2026-08-07
 * File: src/app/api/trades/route.ts
 *
 * Changes:
 * - Proxies to Core /trades
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/trades");
    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Trades proxy error:", error);
    return Response.json(
      { error: "Failed to fetch trades from Core" },
      { status: 502 }
    );
  }
}
