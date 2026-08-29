import { getRuntimeConfig, coreFetch } from "@/lib/core";

/**

* AlphaStream Logs API
*
* Browser
* -> Next.js /api/logs
* -> Cloudflare runtime env
* -> AlphaStream Core /admin/logs
*
* ADMIN_KEY remains server-side.
  */

export const runtime = "edge";

export async function GET() {
try {
const config = getRuntimeConfig();

if (!config.adminKey) {
  console.error(
    "AlphaStream /api/logs: ADMIN_KEY is missing from Cloudflare runtime environment"
  );

  return Response.json(
    {
      ok: false,
      error: "ADMIN_KEY missing in Cloudflare runtime environment",
      details:
        "The Pages Function executed, but ADMIN_KEY was not available from getRequestContext().env.",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

const response = await coreFetch("/admin/logs");
const body = await response.text();

if (response.status === 401 || response.status === 403) {
  console.error(
    `AlphaStream Core rejected /admin/logs with HTTP ${response.status}`
  );

  return Response.json(
    {
      ok: false,
      error: "Core authorization failed",
      details:
        "ADMIN_KEY exists in the Cloudflare runtime but Core rejected it. Verify that Pages ADMIN_KEY exactly matches Core ADMIN_KEY.",
      status: response.status,
    },
    {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

return new Response(body, {
  status: response.status,
  headers: {
    "Content-Type":
      response.headers.get("content-type") ||
      "application/json",
    "Cache-Control":
      "no-store, no-cache, must-revalidate",
  },
});

} catch (error) {
console.error("Logs proxy error:", error);

const message =
  error instanceof Error
    ? error.message
    : "Unknown error";

return Response.json(
  {
    ok: false,
    error: "Failed to fetch logs from Core",
    details: message,
  },
  {
    status: 502,
    headers: {
      "Cache-Control": "no-store",
    },
  }
);

}
}

