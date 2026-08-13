/**
 * AlphaStream API service
 *
 * Browser -> Next.js API routes -> AlphaStream Core / ML
 *
 * Date: 2026-08-13
 *
 * Changes:
 * - Added getAutonomyStatus()
 * - Preserves existing Core + ML behavior
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
  AlphaStreamAutonomyStatus,
} from "@/types/alphastream";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });

  const body = await response.text();

  let data: unknown = null;

  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = body;
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof data === "string" && data.trim()) {
      message = data;
    } else if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      message = (data as { error: string }).error;
    } else if (
      data &&
      typeof data === "object" &&
      "details" in data &&
      typeof (data as { details: unknown }).details === "string"
    ) {
      message = (data as { details: string }).details;
    }

    throw new Error(message);
  }

  return data as T;
}

export async function getHealth(): Promise<AlphaStreamHealth> {
  return apiFetch<AlphaStreamHealth>("/api/health");
}

export async function getStatus(): Promise<AlphaStreamStatus> {
  return apiFetch<AlphaStreamStatus>("/api/status");
}

export async function getMetrics(): Promise<AlphaStreamMetrics> {
  return apiFetch<AlphaStreamMetrics>("/api/metrics");
}

export async function getAutonomyStatus(): Promise<AlphaStreamAutonomyStatus> {
  return apiFetch<AlphaStreamAutonomyStatus>("/api/autonomy/status");
}

export async function getPositions(): Promise<AlphaStreamPosition[]> {
  const data = await apiFetch<
    AlphaStreamPosition[] | { positions?: AlphaStreamPosition[] } | null
  >("/api/positions");

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && Array.isArray(data.positions)) {
    return data.positions;
  }

  return [];
}

export async function getTrades(): Promise<AlphaStreamTrade[]> {
  const data = await apiFetch<
    AlphaStreamTrade[] | { trades?: AlphaStreamTrade[] } | null
  >("/api/trades");

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && Array.isArray(data.trades)) {
    return data.trades;
  }

  return [];
}

export async function getLogs(): Promise<(AlphaStreamLog | string)[]> {
  const data = await apiFetch<
    (AlphaStreamLog | string)[] | { logs?: (AlphaStreamLog | string)[] } | null
  >("/api/logs");

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && Array.isArray(data.logs)) {
    return data.logs;
  }

  return [];
}

export async function getMLStatus(): Promise<AlphaStreamMLStatus> {
  return apiFetch<AlphaStreamMLStatus>("/api/ml/status");
}

export async function getMLHealth(): Promise<AlphaStreamMLHealth> {
  return apiFetch<AlphaStreamMLHealth>("/api/ml/health");
}

export async function triggerMLTraining(): Promise<unknown> {
  return apiFetch<unknown>("/api/ml/train", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}
