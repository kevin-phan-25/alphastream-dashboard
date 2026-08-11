/**
 * Date: 2026-08-11
 * File: src/app/api/admin/hard-flat/route.ts
 */
import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/hard-flat", {
      method: "POST",
    });
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
    console.error("Hard-flat proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to trigger hard-flat on Core", details: message },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
