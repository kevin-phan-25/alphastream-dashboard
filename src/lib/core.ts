/**
 * AlphaStream Dashboard
 * Cloudflare Pages runtime configuration
 *
 * Browser
 *   -> Next.js API route
 *   -> Cloudflare runtime env
 *   -> AlphaStream Core / ML
 *
 * IMPORTANT:
 * ADMIN_KEY is NEVER exposed to the browser.
 * It is read from Cloudflare bindings, or process.env for local development.
 */

import { getRequestContext } from "@cloudflare/next-on-pages";

const FALLBACK_CORE = "https://alphastream-core-1017433009054.us-east1.run.app";

const FALLBACK_ML = "https://alphastream-ml-1017433009054.us-east1.run.app";

type CloudflareEnv = {
  ADMIN_KEY?: string;
  CORE_URL?: string;
  ML_URL?: string;
  DASHBOARD_OPERATOR_KEY?: string;
};

function getCloudflareEnv(): CloudflareEnv {
  try {
    const { env } = getRequestContext();
    return env as CloudflareEnv;
  } catch {
    // next dev has no Cloudflare request context.
    return process.env as CloudflareEnv;
  }
}

function getEnvValue(env: CloudflareEnv, name: keyof CloudflareEnv): string {
  const value = env[name];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function getRuntimeConfig() {
  const env = getCloudflareEnv();

  const adminKey = getEnvValue(env, "ADMIN_KEY");

  const coreUrl = getEnvValue(env, "CORE_URL") || FALLBACK_CORE;

  const mlUrl = getEnvValue(env, "ML_URL") || FALLBACK_ML;

  return {
    operatorKey: getEnvValue(env, "DASHBOARD_OPERATOR_KEY"),
    adminKey,
    coreUrl: coreUrl.replace(/\/$/, ""),
    mlUrl: mlUrl.replace(/\/$/, ""),
  };
}

export function hasAdminKey(): boolean {
  return getRuntimeConfig().adminKey.length > 0;
}

async function fetchService(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(35_000),
    // Workers supports manual redirects. Never forward admin headers to a redirected URL.
    redirect: "manual",
    cache: "no-store",
  });
  if (
    response.type === "opaqueredirect" ||
    (response.status >= 300 && response.status < 400)
  ) {
    await response.body?.cancel();
    throw new Error("Service URL returned an unexpected redirect");
  }
  return response;
}

export async function coreFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const config = getRuntimeConfig();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (config.adminKey) {
    headers.set("x-admin-key", config.adminKey);
  }

  const url = `${config.coreUrl}${path.startsWith("/") ? path : `/${path}`}`;

  return fetchService(url, { ...options, headers });
}

export async function mlFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const config = getRuntimeConfig();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (config.adminKey) {
    headers.set("x-admin-key", config.adminKey);
  }

  const url = `${config.mlUrl}${path.startsWith("/") ? path : `/${path}`}`;

  return fetchService(url, { ...options, headers });
}
