/**
 * Date: 2026-08-15
 * File: src/app/api/ml/train/route.ts
 *
 * POST /api/ml/train → ML POST /train (plain GLOBAL train)
 * Admin key via mlFetch (ADMIN_KEY / ML_ADMIN_KEY)
 *
 * Changes:
 * - Removed unused @ts-expect-error (AbortSignal.timeout is typed on current TS/DOM)
 */

import { mlFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const res = await mlFetch("/train", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
    });

    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep raw
    }

    if (!res.ok) {
      console.error("ML /train failed", res.status, body);
      return Response.json(
        {
          error: "ML training failed",
          status: res.status,
          detail: body,
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    return Response.json(body ?? { ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ML /train proxy error", err);
    return Response.json(
      { error: "Failed to reach ML service", detail: message },
      { status: 500 }
    );
  }
}
