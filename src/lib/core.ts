/**
 * Date: 2026-08-29
 * File: src/lib/core.ts
 *
 * Browser -> Next.js API routes -> AlphaStream Core / ML
 *
 * Reads ADMIN_KEY / CORE_URL / ML_URL at request time via Cloudflare
 * getRequestContext so next-on-pages does not bake an empty key at build.
 */
import { getRequestContext } from "@cloudflare/next-on-pages";

const FALLBACK_CORE =
  "https://alphastream-core-1017433009054.us-east1.run.app";
const FALLBACK_ML =
  "https://alphastream-ml-1017433009054.us-east1.run.app";

function runtimeEnv(name: string): string {
  try {
    const env = getRequestContext().env as Record<string, string | undefined>;
    const v = env?.[name];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  } catch {
    // local dev / non-CF context
  }
  const v = process.env[name];
  if (v != null && String(v).trim() !== "") return String(v).trim();
  return "";
}

function coreBase(): string {
  return (runtimeEnv("CORE_URL") || FALLBACK_CORE).replace(/\/$/, "");
}

function mlBase(): string {
  return (runtimeEnv("ML_URL") || FALLBACK_ML).replace(/\/$/, "");
}

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const adminKey = runtimeEnv("ADMIN_KEY");
  if (adminKey) {
    headers.set("x-admin-key", adminKey);
  }

  const url = `${coreBase()}${path.startsWith("/") ? path : `/${path}`}`;
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

  const adminKey = runtimeEnv("ML_ADMIN_KEY") || runtimeEnv("ADMIN_KEY");
  if (adminKey) {
    headers.set("x-admin-key", adminKey);
  }

  const url = `${mlBase()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
