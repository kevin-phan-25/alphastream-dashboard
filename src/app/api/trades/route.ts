/**
 * AlphaStream Trades API
 *
 * Date: 2026-08-08
 *
 * Proxies:
 * Browser -> Next.js -> AlphaStream Core /trades
 *
 * Edge runtime for Cloudflare Pages.
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/trades");
    const body = await response.text();

    console.log("Trades Core response:", response.status, body);

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Trades proxy error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to fetch trades from Core",
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
