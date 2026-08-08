/**

* AlphaStream API service
*
* Browser -> Next.js API routes -> AlphaStream Core / ML
*
* Date: 2026-08-08
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

```
if (typeof data === "string" && data.trim()) {
  message = data;
} else if (
  data &&
  typeof data === "object" &&
  "error" in data &&
  typeof data.error === "string"
) {
  message = data.error;
} else if (
  data &&
  typeof data === "object" &&
  "details" in data &&
  typeof data.details === "string"
) {
  message = data.details;
}

throw new Error(message);
```

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

export async function getPositions(): Promise<AlphaStreamPosition[]> {
const data = await apiFetch<
AlphaStreamPosition[] | {
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
AlphaStreamTrade[] | {
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
> (AlphaStreamLog | string)[] | {
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
