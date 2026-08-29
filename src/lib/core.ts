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

function cfEnv(name: string): string {
  try {
    const env = getRequestContext().env as Record<string, unknown>;
    const v = env?.[name];
    if (typeof v === "string" && v.trim()) return v.trim();
  } catch {
    /* local */
  }
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

export function hasAdminKey(): boolean {
  return cfEnv("ADMIN_KEY").length > 0;
}

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const key = cfEnv("ADMIN_KEY");
  if (key) {
    headers.set("x-admin-key", key);
    headers.set("Authorization", `Bearer ${key}`);
  }
  const base = (cfEnv("CORE_URL") || FALLBACK_CORE).replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, { ...options, headers, cache: "no-store" });
}

export async function mlFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const key = cfEnv("ML_ADMIN_KEY") || cfEnv("ADMIN_KEY");
  if (key) {
    headers.set("x-admin-key", key);
    headers.set("Authorization", `Bearer ${key}`);
  }
  const base = (cfEnv("ML_URL") || FALLBACK_ML).replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, { ...options, headers, cache: "no-store" });
}
