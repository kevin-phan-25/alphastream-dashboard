/**
 * Date: 2026-08-07
 * File: src/lib/core.ts
 *
 * Changes:
 * - Added mlFetch for ML service
 * - Uses ML_URL environment variable
 */

const CORE_URL = process.env.CORE_URL;
const ML_URL = process.env.ML_URL;
const ADMIN_KEY = process.env.ADMIN_KEY;

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!CORE_URL) {
    throw new Error("CORE_URL is missing");
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (ADMIN_KEY) {
    headers.set("x-admin-key", ADMIN_KEY);
  }

  return fetch(`${CORE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

export async function mlFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!ML_URL) {
    throw new Error("ML_URL is missing");
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (ADMIN_KEY) {
    headers.set("x-admin-key", ADMIN_KEY);
  }

  return fetch(`${ML_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}
