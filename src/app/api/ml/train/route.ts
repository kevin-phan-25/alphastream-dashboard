import { NextResponse } from "next/server";

export const runtime = "edge"; // or "nodejs" if you prefer

export async function POST() {
  const mlUrl = process.env.ML_URL ?? process.env.NEXT_PUBLIC_ML_URL;
  if (!mlUrl) {
    return NextResponse.json(
      { error: "ML_URL not configured" },
      { status: 500 }
    );
  }

  const adminKey = process.env.ADMIN_KEY ?? process.env.ML_API_KEY ?? "";

  try {
    const res = await fetch(`${mlUrl.replace(/\/$/, "")}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminKey
          ? {
              "x-admin-key": adminKey,
              Authorization: `Bearer ${adminKey}`,
            }
          : {}),
      },
      // Train can be slow
      signal: AbortSignal.timeout(120_000),
    });

    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep raw text
    }

    if (!res.ok) {
      console.error("ML /train failed", res.status, body);
      return NextResponse.json(
        {
          error: "ML training failed",
          status: res.status,
          detail: body,
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    return NextResponse.json(body ?? { ok: true });
  } catch (err: any) {
    console.error("ML /train proxy error", err);
    return NextResponse.json(
      {
        error: "Failed to reach ML service",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
