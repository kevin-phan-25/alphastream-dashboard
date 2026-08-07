/**
 * Date: 2026-08-07
 * File: src/services/alphastream.ts
 *
 * Changes:
 * - Calls local /api routes (safe for browser)
 * - Added ML status + health + train
 */

import type {
  AlphaStreamHealth,
  AlphaStreamStatus,
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamTrade,
  AlphaStreamLog,
  AlphaStreamMLStatus,
  AlphaStreamMLHealth,
} from "@/types/alphastream";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    ...options,
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
  return apiFetch<AlphaStreamStatus>("/api/metrics");
}

export async function getMetrics(): Promise<AlphaStreamMetrics> {
  return apiFetch<AlphaStreamMetrics>("/api/metrics");
}

export async function getPositions(): Promise<AlphaStreamPosition[]> {
  const data = await apiFetch<
    { positions?: AlphaStreamPosition[] } | AlphaStreamPosition[]
  >("/api/positions");
  return Array.isArray(data) ? data : data.positions ?? [];
}

export async function getTrades(): Promise<AlphaStreamTrade[]> {
  const data = await apiFetch<
    { trades?: AlphaStreamTrade[] } | AlphaStreamTrade[]
  >("/api/trades");
  return Array.isArray(data) ? data : data.trades ?? [];
}

export async function getLogs(): Promise<(AlphaStreamLog | string)[]> {
  const data = await apiFetch<
    { logs?: (AlphaStreamLog | string)[] } | (AlphaStreamLog | string)[]
  >("/api/logs");
  return Array.isArray(data) ? data : data.logs ?? [];
}

// ---------- ML ----------
export async function getMLStatus(): Promise<AlphaStreamMLStatus> {
  return apiFetch<AlphaStreamMLStatus>("/api/ml/status");
}

export async function getMLHealth(): Promise<AlphaStreamMLHealth> {
  return apiFetch<AlphaStreamMLHealth>("/api/ml/health");
}

export async function triggerMLTraining(): Promise<{
  ok: boolean;
  message: string;
}> {
  return apiFetch("/api/ml/train", { method: "POST" });
}
