/**
 * Date: 2026-08-07
 * File: src/services/alphastream.ts
 *
 * Changes:
 * - Now calls local /api/* routes instead of coreFetch
 * - Works correctly in the browser (no CORE_URL needed on client)
 * - Edge routes handle the real proxy to Cloud Run
 */

import type {
  AlphaStreamHealth,
  AlphaStreamStatus,
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamTrade,
  AlphaStreamLog,
} from "@/types/alphastream";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<AlphaStreamHealth> {
  return apiFetch<AlphaStreamHealth>("/api/health");
}

export async function getStatus(): Promise<AlphaStreamStatus> {
  // Most Cores expose status under /status or /metrics
  // Adjust if needed
  return apiFetch<AlphaStreamStatus>("/api/metrics");
}

export async function getMetrics(): Promise<AlphaStreamMetrics> {
  return apiFetch<AlphaStreamMetrics>("/api/metrics");
}

export async function getPositions(): Promise<AlphaStreamPosition[]> {
  const data = await apiFetch<{ positions?: AlphaStreamPosition[] } | AlphaStreamPosition[]>(
    "/api/positions"
  );
  return Array.isArray(data) ? data : data.positions ?? [];
}

export async function getTrades(): Promise<AlphaStreamTrade[]> {
  const data = await apiFetch<{ trades?: AlphaStreamTrade[] } | AlphaStreamTrade[]>(
    "/api/trades"
  );
  return Array.isArray(data) ? data : data.trades ?? [];
}

export async function getLogs(): Promise<(AlphaStreamLog | string)[]> {
  const data = await apiFetch<{ logs?: (AlphaStreamLog | string)[] } | (AlphaStreamLog | string)[]>(
    "/api/logs"
  );
  return Array.isArray(data) ? data : data.logs ?? [];
}
