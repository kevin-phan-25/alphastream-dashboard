import { coreFetch } from "@/lib/core";
import type {
  AlphaStreamHealth,
  AlphaStreamStatus,
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamTrade,
  AlphaStreamLog,
} from "@/types/alphastream";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Core API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<AlphaStreamHealth> {
  const res = await coreFetch("/health");
  return handleResponse<AlphaStreamHealth>(res);
}

export async function getStatus(): Promise<AlphaStreamStatus> {
  const res = await coreFetch("/status");
  return handleResponse<AlphaStreamStatus>(res);
}

export async function getMetrics(): Promise<AlphaStreamMetrics> {
  const res = await coreFetch("/metrics");
  return handleResponse<AlphaStreamMetrics>(res);
}

export async function getPositions(): Promise<AlphaStreamPosition[]> {
  const res = await coreFetch("/positions");
  const data = await handleResponse<{ positions?: AlphaStreamPosition[] } | AlphaStreamPosition[]>(res);
  return Array.isArray(data) ? data : data.positions ?? [];
}

export async function getTrades(): Promise<AlphaStreamTrade[]> {
  const res = await coreFetch("/trades");
  const data = await handleResponse<{ trades?: AlphaStreamTrade[] } | AlphaStreamTrade[]>(res);
  return Array.isArray(data) ? data : data.trades ?? [];
}

export async function getLogs(): Promise<(AlphaStreamLog | string)[]> {
  const res = await coreFetch("/logs");
  const data = await handleResponse<{ logs?: (AlphaStreamLog | string)[] } | (AlphaStreamLog | string)[]>(res);
  return Array.isArray(data) ? data : data.logs ?? [];
}
