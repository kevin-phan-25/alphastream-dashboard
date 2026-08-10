/**
 * Date: 2026-08-10
 * File: src/lib/core.ts
 *
 * Browser -> Next.js API routes -> AlphaStream Core / ML
 *
 * Changes:
 * - Hard fallbacks for CORE_URL / ML_URL (Cloudflare Pages edge)
 * - Never throw "CORE_URL is missing" when vars are unset at runtime
 * - Forwards x-admin-key when ADMIN_KEY is present
 */

const CORE_URL =
  process.env.CORE_URL ||
  "https://alphastream-core-1017433009054.us-east1.run.app";

const ML_URL =
  process.env.ML_URL ||
  "https://alphastream-ml-1017433009054.us-east1.run.app";

const ADMIN_KEY = process.env.ADMIN_KEY;

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (ADMIN_KEY) {
    headers.set("x-admin-key", ADMIN_KEY);
  }

  const url = `${CORE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

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

  if (ADMIN_KEY) {
    headers.set("x-admin-key", ADMIN_KEY);
  }

  const url = `${ML_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
