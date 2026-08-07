/**
 * Date: 2026-08-07
 * File: src/app/api/admin/clear-blacklist/route.ts
 *
 * Changes:
 * - Proxies POST to Core /admin/clear-blacklist
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/clear-blacklist", {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Clear-blacklist proxy error:", error);
    return Response.json(
      { error: "Failed to clear blacklist on Core" },
      { status: 502 }
    );
  }
}
