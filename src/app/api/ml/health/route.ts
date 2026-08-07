/**
 * Date: 2026-08-07
 * File: src/app/api/ml/health/route.ts
 */

import { mlFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await mlFetch("/health");
    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("ML health proxy error:", error);
    return Response.json(
      { status: "error", service: "alphastream-ml" },
      { status: 502 }
    );
  }
}
