/**
 * AlphaStream Autonomy Status API
 * Browser -> Next.js -> AlphaStream Core /autonomy/status
 *
 * Date: 2026-08-13
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/autonomy/status");
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
    console.error("Autonomy status proxy error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to fetch autonomy status from Core",
        details: message,
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
