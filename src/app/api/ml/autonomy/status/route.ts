/**
 * Date: 2026-08-15
 * File: src/app/api/ml/autonomy/status/route.ts
 *
 * GET → ML /autonomy/status (challenger, canTrain, lifecycle, strategy, watchdog)
 * Core autonomy stays at /api/autonomy/status
 */

import { mlFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await mlFetch("/autonomy/status");
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("ML autonomy status proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Failed to fetch autonomy status from ML",
        details: message,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
