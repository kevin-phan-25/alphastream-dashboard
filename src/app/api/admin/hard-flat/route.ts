/**
 * Date: 2026-08-07
 * File: src/app/api/admin/hard-flat/route.ts
 *
 * Changes:
 * - Proxies POST to Core /admin/hard-flat
 * - Edge runtime
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/hard-flat", {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Hard-flat proxy error:", error);
    return Response.json(
      { error: "Failed to execute hard-flat on Core" },
      { status: 502 }
    );
  }
}
