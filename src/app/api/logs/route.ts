/**
 * Date: 2026-08-07
 * File: src/app/api/logs/route.ts
 *
 * Changes:
 * - Proxies to Core service
 * - Edge runtime for Cloudflare Pages
 * - Clean error handling
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/admin/logs"); // change to "/logs" if your Core uses that
    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Logs proxy error:", error);
    return Response.json(
      { error: "Failed to fetch logs from Core" },
      { status: 502 }
    );
  }
}
