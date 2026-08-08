/**

* AlphaStream Logs API
*
* Date: 2026-08-08
*
* Proxies:
* Browser -> Next.js -> AlphaStream Core /admin/logs
*
* Edge runtime for Cloudflare Pages.
  */

import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
try {
const response = await coreFetch("/admin/logs");

const body = await response.text();

console.log(
  "Logs Core response:",
  response.status,
  body
);

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
"Logs proxy error:",
error
);

const message =
  error instanceof Error
    ? error.message
    : "Unknown error";

return Response.json(
  {
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

