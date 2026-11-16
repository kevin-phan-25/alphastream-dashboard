import { getRuntimeConfig } from "@/lib/core";
import { cookie, login, operatorSession, sameOrigin } from "@/lib/operator";
export const runtime = "edge";
export async function GET(request: Request) {
  return Response.json(
    {
      authenticated: await operatorSession(request),
      configured: getRuntimeConfig().operatorKey.length >= 32,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  return login(request);
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Same-origin request required" },
      { status: 403 },
    );
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": cookie(request, "", 0),
        "Cache-Control": "no-store",
      },
    },
  );
}
