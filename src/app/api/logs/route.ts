/**
 * Date: 2026-08-07
 * File: src/app/api/ml/status/route.ts
 */

import { mlFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await mlFetch("/ml/status");
    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("ML status proxy error:", error);
    return Response.json(
      { error: "Failed to reach ML service" },
      { status: 502 }
    );
  }
}
