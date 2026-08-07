/**
 * Date: 2026-08-07
 * File: src/app/api/health/route.ts
 *
 * Changes:
 * - Created health proxy endpoint
 * - Proxies to Core /health
 * - Edge runtime for Cloudflare Pages
 * - Clean error handling
 */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await coreFetch("/health");
    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Health proxy error:", error);
    return Response.json(
      {
        status: "error",
        service: "alphastream-dashboard",
        message: "Failed to reach Core service",
      },
      { status: 502 }
    );
  }
}
