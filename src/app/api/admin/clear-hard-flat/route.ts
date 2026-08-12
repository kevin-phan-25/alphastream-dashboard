/**
 * Date: 2026-08-12
 * File: src/app/api/admin/clear-hard-flat/route.ts
 *
 * Purpose:
 *   Proxy POST from the dashboard "Clear Hard Flat / Degraded" button to
 *   AlphaStream Core: POST /admin/clear-hard-flat
 *
 * Changes (2026-08-12):
 *   - New route (fixes browser 404 on /api/admin/clear-hard-flat)
 *   - Forwards to Core via coreFetch with admin key when configured
 *   - Edge runtime for Cloudflare Pages
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/clear-hard-flat", {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Clear hard-flat proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to clear hard flat on Core",
        details: message,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
