/**
 * AlphaStream Logs API
 * Proxies: Browser -> Next.js -> Core /admin/logs
 *
 * Requires ADMIN_KEY in Cloudflare Pages Function env
 * (same value as Core ADMIN_KEY). coreFetch attaches x-admin-key.
 */
import { coreFetch, hasAdminKey } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    if (!hasAdminKey()) {
      return Response.json(
        {
          ok: false,
          error: "ADMIN_KEY missing in Pages Function env",
          details:
            "Set ADMIN_KEY on the Cloudflare Pages project (Production) to the same value as Core ADMIN_KEY, then redeploy.",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const response = await coreFetch("/admin/logs");
    const body = await response.text();

    // Surface Core auth failures clearly (wrong/mismatched key)
    if (response.status === 401 || response.status === 403) {
      return Response.json(
        {
          ok: false,
          error: "unauthorized",
          details:
            "Core rejected /admin/logs. Confirm ADMIN_KEY on Pages matches Core ADMIN_KEY exactly, then redeploy.",
          status: response.status,
        },
        {
          status: response.status,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Logs proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        ok: false,
        error: "Failed to fetch logs from Core",
        details: message,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
