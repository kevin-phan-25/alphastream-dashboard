import { parseTelemetry } from "@/lib/validation";
/**
 * AlphaStream API service
 *
 * Browser -> Next.js API routes -> AlphaStream Core / ML
 *
 * Date: 2026-08-15
 *
 * Changes:
 * - getMLAutonomyStatus, triggerAutonomyTrain (challenger path)
 * - triggerMLTraining still hits plain /train
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
  AlphaStreamMLAutonomyStatus,
} from "@/types/alphastream";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const requestHeaders = new Headers(options?.headers);
  if (!requestHeaders.has("Accept"))
    requestHeaders.set("Accept", "application/json");
  const response = await fetch(endpoint, {
    ...options,
    cache: "no-store",
    signal: options?.signal ?? AbortSignal.timeout(20_000),
    headers: requestHeaders,
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
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
    ) {
      message = (data as { detail: string }).detail;
    } else if (
      data &&
      typeof data === "object" &&
      "details" in data &&
      typeof (data as { details: unknown }).details === "string"
    ) {
      message = (data as { details: string }).details;
    }

    const coreTelemetry =
      endpoint === "/api/status" ||
      endpoint === "/api/positions" ||
      endpoint === "/api/trades" ||
      endpoint === "/api/metrics" ||
      endpoint === "/api/autonomy/status";
    if (
      coreTelemetry &&
      ((response.status === 401 && message === "unauthorized") ||
        (response.status === 503 && message === "ADMIN_KEY required"))
    ) {
      throw new Error(
        "Core authentication failed. Check the production CORE_URL and match the dashboard ADMIN_KEY to Core.",
      );
    }
    if (
      endpoint.startsWith("/api/ml/") &&
      response.status === 403 &&
      message === "admin key required"
    ) {
      throw new Error(
        "ML authentication failed. Check the dashboard ADMIN_KEY binding matches the shared service key.",
      );
    }

    throw new Error(message);
  }

  return data as T;
}

async function telemetry<T>(
  endpoint: Parameters<typeof parseTelemetry>[0],
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return parseTelemetry(
    endpoint,
    await apiFetch<unknown>(path, { signal }),
  ) as T;
}

export async function getHealth(
  signal?: AbortSignal,
): Promise<AlphaStreamHealth> {
  return telemetry<AlphaStreamHealth>("health", "/api/health", signal);
}

export async function getStatus(
  signal?: AbortSignal,
): Promise<AlphaStreamStatus> {
  return telemetry<AlphaStreamStatus>("status", "/api/status", signal);
}

export async function getMetrics(
  signal?: AbortSignal,
): Promise<AlphaStreamMetrics> {
  return telemetry<AlphaStreamMetrics>("metrics", "/api/metrics", signal);
}

/** Core autonomy (entry window, daily entries, scan reason) */
export async function getAutonomyStatus(
  signal?: AbortSignal,
): Promise<AlphaStreamAutonomyStatus> {
  return telemetry<AlphaStreamAutonomyStatus>(
    "autonomy",
    "/api/autonomy/status",
    signal,
  );
}

/** ML autonomy (canTrain, challenger, lifecycle, strategy, watchdog) */
export async function getMLAutonomyStatus(
  signal?: AbortSignal,
): Promise<AlphaStreamMLAutonomyStatus> {
  return telemetry<AlphaStreamMLAutonomyStatus>(
    "mlAutonomy",
    "/api/ml/autonomy/status",
    signal,
  );
}

export async function getPositions(
  signal?: AbortSignal,
): Promise<AlphaStreamPosition[]> {
  const data = await apiFetch<unknown>("/api/positions", { signal });
  const list =
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "positions" in data
      ? (data as { positions: unknown }).positions
      : data;
  return parseTelemetry("positions", list) as AlphaStreamPosition[];
}

export async function getTrades(
  signal?: AbortSignal,
): Promise<AlphaStreamTrade[]> {
  const data = await apiFetch<unknown>("/api/trades", { signal });
  const list =
    data && typeof data === "object" && !Array.isArray(data) && "trades" in data
      ? (data as { trades: unknown }).trades
      : data;
  return parseTelemetry("trades", list) as AlphaStreamTrade[];
}

export async function getLogs(
  signal?: AbortSignal,
): Promise<(AlphaStreamLog | string)[]> {
  const data = await apiFetch<unknown>("/api/logs", { signal });
  const list =
    data && typeof data === "object" && !Array.isArray(data) && "logs" in data
      ? (data as { logs: unknown }).logs
      : data;
  return parseTelemetry("logs", list) as (AlphaStreamLog | string)[];
}

export async function getMLStatus(
  signal?: AbortSignal,
): Promise<AlphaStreamMLStatus> {
  return telemetry<AlphaStreamMLStatus>("mlStatus", "/api/ml/status", signal);
}

export async function getMLHealth(
  signal?: AbortSignal,
): Promise<AlphaStreamMLHealth> {
  return telemetry<AlphaStreamMLHealth>("mlHealth", "/api/ml/health", signal);
}

/** Plain GLOBAL train → POST /api/ml/train → ML /train */
export async function triggerMLTraining(): Promise<unknown> {
  return apiFetch<unknown>("/api/ml/train", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

/** Challenger cycle → POST /api/ml/autonomy/train → ML /autonomy/train */
export async function triggerAutonomyTrain(): Promise<unknown> {
  return apiFetch<unknown>("/api/ml/autonomy/train", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
}

/** A 503 with a readiness body is a valid not-ready observation. */
export async function getReadiness(
  endpoint: string,
  signal?: AbortSignal,
): Promise<import("@/types/alphastream").AlphaStreamReadiness> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(20_000),
  });
  const raw = await response.json();
  const data = raw?.detail && typeof raw.detail === "object" ? raw.detail : raw;
  if (
    (response.ok || response.status === 503) &&
    typeof data?.ready === "boolean"
  )
    return parseTelemetry(
      "ready",
      data,
    ) as import("@/types/alphastream").AlphaStreamReadiness;
  throw new Error(
    data?.error || `Readiness request failed (${response.status})`,
  );
}
