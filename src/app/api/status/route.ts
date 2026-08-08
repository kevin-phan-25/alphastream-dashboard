/**
 * AlphaStream Status API
 * Proxies: Browser -> Next.js -> Core /status (or /)
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    // Core often exposes status at "/" or "/status"
    const response = await coreFetch("/status");
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
    console.error("Status proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      { error: "Failed to fetch status from Core", details: message },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
