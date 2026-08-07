/**
 * Date: 2026-08-07
 * File: src/app/api/ml/train/route.ts
 */

import { mlFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await mlFetch("/train", {
      method: "POST",
    });

    const data = await response.json().catch(() => ({}));

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("ML train proxy error:", error);
    return Response.json(
      { error: "Failed to start training" },
      { status: 502 }
    );
  }
}
