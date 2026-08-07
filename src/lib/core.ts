/**
 * Centralized Cloud Run / Core proxy
 * Injects x-admin-key server-side
 */
const CORE_URL = process.env.CORE_URL;
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
