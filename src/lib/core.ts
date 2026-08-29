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
 * It is read only from the Cloudflare request context.
 */

import { getRequestContext } from "@cloudflare/next-on-pages";

const FALLBACK_CORE =
  "https://alphastream-core-1017433009054.us-east1.run.app";

const FALLBACK_ML =
  "https://alphastream-ml-1017433009054.us-east1.run.app";

type CloudflareEnv = {
  ADMIN_KEY?: string;
  ML_ADMIN_KEY?: string;
  CORE_URL?: string;
  ML_URL?: string;
};

function getCloudflareEnv(): CloudflareEnv {
  const { env } = getRequestContext();

  return env as CloudflareEnv;
}

function getEnvValue(
  env: CloudflareEnv,
  name: keyof CloudflareEnv
): string {
  const value = env[name];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function getRuntimeConfig() {
  const env = getCloudflareEnv();

  const adminKey = getEnvValue(env, "ADMIN_KEY");

  const mlAdminKey =
    getEnvValue(env, "ML_ADMIN_KEY") || adminKey;

  const coreUrl =
    getEnvValue(env, "CORE_URL") || FALLBACK_CORE;

  const mlUrl =
    getEnvValue(env, "ML_URL") || FALLBACK_ML;

  return {
    adminKey,
    mlAdminKey,
    coreUrl: coreUrl.replace(/\/$/, ""),
    mlUrl: mlUrl.replace(/\/$/, ""),
  };
}

export function hasAdminKey(): boolean {
  return getRuntimeConfig().adminKey.length > 0;
}

export async function coreFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getRuntimeConfig();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (config.adminKey) {
    headers.set("x-admin-key", config.adminKey);
    headers.set("Authorization", `Bearer ${config.adminKey}`);
  }

  const url = `${config.coreUrl}${
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
  const config = getRuntimeConfig();

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (config.mlAdminKey) {
    headers.set("x-admin-key", config.mlAdminKey);
    headers.set("Authorization", `Bearer ${config.mlAdminKey}`);
  }

  const url = `${config.mlUrl}${
    path.startsWith("/") ? path : `/${path}`
  }`;

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
