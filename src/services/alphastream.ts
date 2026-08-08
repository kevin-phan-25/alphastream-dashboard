/**

* AlphaStream API service
*
* Date: 2026-08-08
*
* Browser-safe API client.
* All requests go through local Next.js /api routes.
*
* IMPORTANT:
* CORE_URL, ML_URL, and ADMIN_KEY remain server-side.
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

type ApiError = {
error?: string;
message?: string;
details?: string;
};

async function apiFetch<T>(
path: string,
options: RequestInit = {}
): Promise<T> {
const response = await fetch(path, {
...options,
cache: "no-store",
headers: {
Accept: "application/json",
...(options.headers || {}),
},
});

const text = await response.text();

if (!response.ok) {
let message = text || response.statusText;

try {
  const parsed = JSON.parse(text) as ApiError;

  message =
    parsed.error ||
    parsed.message ||
    parsed.details ||
    message;
} catch {
  // Response was not JSON.
}

throw new Error(
  `${path} failed (${response.status}): ${message}`
);

}

if (!text) {
return {} as T;
}

try {
return JSON.parse(text) as T;
} catch {
throw new Error(
`${path} returned invalid JSON`
);
}
}

// ======================================================
// Core
// ======================================================

export async function getHealth(): Promise<AlphaStreamHealth> {
return apiFetch<AlphaStreamHealth>("/api/health");
}

export async function getStatus(): Promise<AlphaStreamStatus> {
return apiFetch<AlphaStreamStatus>("/api/status");
}

export async function getMetrics(): Promise<AlphaStreamMetrics> {
return apiFetch<AlphaStreamMetrics>("/api/metrics");
}

export async function getPositions(): Promise<AlphaStreamPosition[]> {
const data = await apiFetch<
| AlphaStreamPosition[]
| {
positions?: AlphaStreamPosition[];
}

> ("/api/positions");

if (Array.isArray(data)) {
return data;
}

return Array.isArray(data.positions)
? data.positions
: [];
}

export async function getTrades(): Promise<AlphaStreamTrade[]> {
const data = await apiFetch<
| AlphaStreamTrade[]
| {
trades?: AlphaStreamTrade[];
}

> ("/api/trades");

if (Array.isArray(data)) {
return data;
}

return Array.isArray(data.trades)
? data.trades
: [];
}

export async function getLogs(): Promise<
(AlphaStreamLog | string)[]

> {
> const data = await apiFetch<
> | (AlphaStreamLog | string)[]
> | {
> logs?: (AlphaStreamLog | string)[];
> }
> ("/api/logs");

if (Array.isArray(data)) {
return data;
}

return Array.isArray(data.logs)
? data.logs
: [];
}

// ======================================================
// ML
// ======================================================

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
return apiFetch<{
ok: boolean;
message: string;
}>("/api/ml/train", {
method: "POST",
});
}

