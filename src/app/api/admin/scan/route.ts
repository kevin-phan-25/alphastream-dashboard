/**
 * Date: 2026-08-07
 * File: src/app/api/admin/scan/route.ts
 *
 * Changes:
 * - Proxies POST to Core /admin/scan
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/scan", {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Scan proxy error:", error);
    return Response.json(
      { error: "Failed to trigger scan on Core" },
      { status: 502 }
    );
  }
}
