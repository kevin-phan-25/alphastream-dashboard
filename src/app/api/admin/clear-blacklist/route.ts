/**
 * Date: 2026-08-07
 * File: src/app/api/admin/clear-hard-flat/route.ts
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/clear-hard-flat", {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Clear hard-flat proxy error:", error);
    return Response.json(
      { error: "Failed to clear hard flat" },
      { status: 502 }
    );
  }
}
