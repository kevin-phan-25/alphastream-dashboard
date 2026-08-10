import { NextResponse } from "next/server";

export async function POST() {
  const coreUrl = process.env.CORE_URL;
  const adminKey = process.env.ADMIN_KEY;

  if (!coreUrl) {
    return NextResponse.json({ error: "CORE_URL not set" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${coreUrl.replace(/\/$/, "")}/admin/clear-hard-flat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        cache: "no-store",
      }
    );

    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "clear hard flat failed", detail: body },
        { status: res.status }
      );
    }

    return NextResponse.json(body ?? { ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "proxy failed" },
      { status: 500 }
    );
  }
}
