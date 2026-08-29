import { getRequestContext } from "@cloudflare/next-on-pages";

/**

* AlphaStream Logs API
*
* Browser
* -> Next.js /api/logs
* -> Cloudflare Pages runtime
* -> AlphaStream Core /admin/logs
*
* ADMIN_KEY is read ONLY at runtime from Cloudflare.
* It is never exposed to the browser.
  */

export const runtime = "edge";

export async function GET() {
try {
const ctx = getRequestContext();
const env = ctx.env as Record<string, unknown>;

const adminKey =
  typeof env.ADMIN_KEY === "string"
    ? env.ADMIN_KEY
    : "";

const coreUrl =
  typeof env.CORE_URL === "string"
    ? env.CORE_URL
    : "";

if (!adminKey) {
  console.error(
    "AlphaStream /api/logs: ADMIN_KEY is missing from Cloudflare runtime environment"
  );

  return Response.json(
    {
      ok: false,
      error: "ADMIN_KEY missing in Cloudflare runtime environment",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

if (!coreUrl) {
  console.error(
    "AlphaStream /api/logs: CORE_URL is missing from Cloudflare runtime environment"
  );

  return Response.json(
    {
      ok: false,
      error: "CORE_URL missing in Cloudflare runtime environment",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

const url = `${coreUrl.replace(/\/+$/, "")}/admin/logs`;

console.log(
  `AlphaStream /api/logs: requesting ${url}`
);

const response = await fetch(url, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${adminKey}`,
    Accept: "application/json",
  },
  cache: "no-store",
});

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
        "Cloudflare has ADMIN_KEY, but AlphaStream Core rejected it. Verify that Pages ADMIN_KEY exactly matches Core ADMIN_KEY.",
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
console.error(
"AlphaStream /api/logs proxy error:",
error
);

const message =
  error instanceof Error
    ? error.message
    : String(error);

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

