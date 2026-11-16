import { getRuntimeConfig } from "@/lib/core";

import {
  COOKIE,
  MAX_AGE,
  equal,
  signature,
  verifyToken,
} from "@/lib/operator-token";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    // Next's Edge adapter can normalize request.url to localhost in development.
    // The HTTP Host header retains the actual browser-facing authority.
    const host = request.headers.get("host") || target.host;
    return (
      source.origin === origin &&
      source.protocol === target.protocol &&
      source.host === host
    );
  } catch {
    return false;
  }
}

export async function operatorSession(request: Request) {
  const secret = getRuntimeConfig().operatorKey;
  if (secret.length < 32) return false;
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!token) return false;
  return verifyToken(token, secret);
}

export async function requireOperator(
  request: Request,
): Promise<Response | null> {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403 },
    );
  if (getRuntimeConfig().operatorKey.length < 32)
    return Response.json(
      {
        error:
          "Operator access is not configured. Set DASHBOARD_OPERATOR_KEY to at least 32 characters.",
      },
      { status: 503 },
    );
  if (!(await operatorSession(request)))
    return Response.json(
      { error: "Unlock operator controls before continuing" },
      { status: 401 },
    );
  return null;
}

export async function login(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403 },
    );
  const secret = getRuntimeConfig().operatorKey;
  if (secret.length < 32)
    return Response.json(
      { error: "Operator access is not configured" },
      { status: 503 },
    );
  let password: unknown;
  try {
    password = (await request.json()).password;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (
    typeof password !== "string" ||
    password.length < 32 ||
    password.length > 1024 ||
    !equal(await signature("login", password), await signature("login", secret))
  ) {
    return Response.json({ error: "Invalid operator key" }, { status: 401 });
  }
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const token = `${expires}.${await signature(expires, secret)}`;
  return Response.json(
    { authenticated: true },
    {
      headers: {
        "Set-Cookie": cookie(request, token, MAX_AGE),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function cookie(request: Request, token: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
