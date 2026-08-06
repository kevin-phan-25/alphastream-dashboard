/**
 * -------------------------------------------------------------------
 * File: src/services/alphastream.ts
 *
 * Description:
 * AlphaStream Dashboard API Client
 *
 * Changes:
 * - Cloudflare Pages compatible
 * - Uses NEXT_PUBLIC_CORE_URL
 * - Public endpoints call Cloud Run directly
 * - Admin endpoints go through Next.js API routes
 * - Strong TypeScript typing
 * - Improved error handling
 * -------------------------------------------------------------------
 */

import type {
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamStatus,
  AlphaStreamTrades,
  AlphaStreamLogs,
} from "@/types/alphastream";

// ======================================================
// CORE URL
// ======================================================

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL ?? "";

if (!CORE_URL) {
  console.warn(
    "NEXT_PUBLIC_CORE_URL is not defined. Dashboard API calls will fail."
  );
}

// ======================================================
// GENERIC FETCH
// ======================================================

async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `AlphaStream API ${response.status}: ${
        body || response.statusText
      }`
    );
  }

  return response.json() as Promise<T>;
}

// ======================================================
// HEALTH
// ======================================================

export function getHealth() {
  return apiFetch<{
    status: string;
    service: string;
    time: string;
  }>(`${CORE_URL}/health`);
}

// ======================================================
// STATUS
// ======================================================

export function getStatus() {
  return apiFetch<AlphaStreamStatus>(
    `${CORE_URL}/status`
  );
}

// ======================================================
// METRICS
// ======================================================

export function getMetrics() {
  return apiFetch<AlphaStreamMetrics>(
    `${CORE_URL}/metrics`
  );
}

// ======================================================
// POSITIONS
// ======================================================

export function getPositions() {
  return apiFetch<{
    positions: AlphaStreamPosition[];
    count: number;
  }>(`${CORE_URL}/positions`);
}

// ======================================================
// TRADES
// ======================================================

export function getTrades() {
  return apiFetch<AlphaStreamTrades>(
    `${CORE_URL}/trades`
  );
}

// ======================================================
// LOGS
// ======================================================
//
// Uses the dashboard API proxy.
// ADMIN_KEY never reaches the browser.
//

export function getLogs() {
  return apiFetch<AlphaStreamLogs>("/api/logs");
}

// ======================================================
// ADMIN SCAN
// ======================================================

export async function startScan() {
  const response = await fetch("/api/admin/scan", {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Scan failed (${response.status})`
    );
  }

  return response.json();
}

// ======================================================
// HARD FLAT
// ======================================================

export async function triggerHardFlat() {
  const response = await fetch("/api/admin/hard-flat", {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Hard Flat failed (${response.status})`
    );
  }

  return response.json();
}

// ======================================================
// CLEAR BLACKLIST
// ======================================================

export async function clearBlacklist() {
  const response = await fetch(
    "/api/admin/clear-blacklist",
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Clear blacklist failed (${response.status})`
    );
  }

  return response.json();
}
