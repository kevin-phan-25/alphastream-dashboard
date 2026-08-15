/**
 * Date: 2026-08-15
 * File: src/lib/core.ts
 *
 * Browser -> Next.js API routes -> AlphaStream Core / ML
 *
 * - CORE_URL / ML_URL hard fallbacks for Cloudflare Pages edge
 * - Single admin secret: ADMIN_KEY (ML_ADMIN_KEY optional override, defaults to ADMIN_KEY)
 * - Forwards x-admin-key on Core and ML admin calls
 */

const CORE_URL =
  process.env.CORE_URL ||
  "https://alphastream-core-1017433009054.us-east1.run.app";

const ML_URL =
  process.env.ML_URL ||
  "https://alphastream-ml-1017433009054.us-east1.run.app";

/** Core admin key. Set in Cloudflare Pages → Environment variables. */
const ADMIN_KEY = process.env.ADMIN_KEY || "";

/**
 * ML admin key. Prefer ML_ADMIN_KEY if set; otherwise same as ADMIN_KEY.
 * Use one secret for both services when Core and ML share the same key value.
 */
const ML_ADMIN_KEY = process.env.ML_ADMIN_KEY || process.env.ADMIN_KEY || "";

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (ADMIN_KEY) {
    headers.set("x-admin-key", ADMIN_KEY);
  }

  const url = `${CORE_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}

export async function mlFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (ML_ADMIN_KEY) {
    headers.set("x-admin-key", ML_ADMIN_KEY);
  }

  const url = `${ML_URL.replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
