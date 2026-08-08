/**

* AlphaStream dashboard hook
*
* Date: 2026-08-08
*
* Changes:
* * Fixed status endpoint
* * Independent Core + ML polling
* * Individual endpoint error reporting
* * Preserves previously loaded data when one endpoint fails
* * Prevents failed endpoints from appearing as empty data
    */

"use client";

import {
useCallback,
useEffect,
useState,
} from "react";

import {
getHealth,
getStatus,
getMetrics,
getPositions,
getTrades,
getLogs,
getMLStatus,
getMLHealth,
triggerMLTraining,
} from "@/services/alphastream";

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

interface AlphaStreamData {
health: AlphaStreamHealth | null;
status: AlphaStreamStatus | null;
metrics: AlphaStreamMetrics | null;
positions: AlphaStreamPosition[];
trades: AlphaStreamTrade[];
logs: (AlphaStreamLog | string)[];
mlStatus: AlphaStreamMLStatus | null;
mlHealth: AlphaStreamMLHealth | null;
}

interface AlphaStreamErrors {
health: string | null;
status: string | null;
metrics: string | null;
positions: string | null;
trades: string | null;
logs: string | null;
mlStatus: string | null;
mlHealth: string | null;
}

const EMPTY_DATA: AlphaStreamData = {
health: null,
status: null,
metrics: null,
positions: [],
trades: [],
logs: [],
mlStatus: null,
mlHealth: null,
};

const EMPTY_ERRORS: AlphaStreamErrors = {
health: null,
status: null,
metrics: null,
positions: null,
trades: null,
logs: null,
mlStatus: null,
mlHealth: null,
};

function getErrorMessage(error: unknown): string {
if (error instanceof Error) {
return error.message;
}

if (typeof error === "string") {
return error;
}

return "Unknown error";
}

export function useAlphaStream(
pollIntervalMs = 30_000
) {
const [data, setData] =
useState<AlphaStreamData>(EMPTY_DATA);

const [endpointErrors, setEndpointErrors] =
useState<AlphaStreamErrors>(EMPTY_ERRORS);

const [connected, setConnected] =
useState(false);

const [mlConnected, setMlConnected] =
useState(false);

const [error, setError] =
useState<string | null>(null);

const [loading, setLoading] =
useState(true);

const refresh = useCallback(async () => {
const results = await Promise.allSettled([
getHealth(),
getStatus(),
getMetrics(),
getPositions(),
getTrades(),
getLogs(),
getMLStatus(),
getMLHealth(),
]);

```
const [
  healthResult,
  statusResult,
  metricsResult,
  positionsResult,
  tradesResult,
  logsResult,
  mlStatusResult,
  mlHealthResult,
] = results;

const errors: AlphaStreamErrors = {
  health:
    healthResult.status === "rejected"
      ? getErrorMessage(healthResult.reason)
      : null,

  status:
    statusResult.status === "rejected"
      ? getErrorMessage(statusResult.reason)
      : null,

  metrics:
    metricsResult.status === "rejected"
      ? getErrorMessage(metricsResult.reason)
      : null,

  positions:
    positionsResult.status === "rejected"
      ? getErrorMessage(positionsResult.reason)
      : null,

  trades:
    tradesResult.status === "rejected"
      ? getErrorMessage(tradesResult.reason)
      : null,

  logs:
    logsResult.status === "rejected"
      ? getErrorMessage(logsResult.reason)
      : null,

  mlStatus:
    mlStatusResult.status === "rejected"
      ? getErrorMessage(mlStatusResult.reason)
      : null,

  mlHealth:
    mlHealthResult.status === "rejected"
      ? getErrorMessage(mlHealthResult.reason)
      : null,
};

setEndpointErrors(errors);

setData((previous) => ({
  health:
    healthResult.status === "fulfilled"
      ? healthResult.value
      : previous.health,

  status:
    statusResult.status === "fulfilled"
      ? statusResult.value
      : previous.status,

  metrics:
    metricsResult.status === "fulfilled"
      ? metricsResult.value
      : previous.metrics,

  positions:
    positionsResult.status === "fulfilled"
      ? positionsResult.value
      : previous.positions,

  trades:
    tradesResult.status === "fulfilled"
      ? tradesResult.value
      : previous.trades,

  logs:
    logsResult.status === "fulfilled"
      ? logsResult.value
      : previous.logs,

  mlStatus:
    mlStatusResult.status === "fulfilled"
      ? mlStatusResult.value
      : previous.mlStatus,

  mlHealth:
    mlHealthResult.status === "fulfilled"
      ? mlHealthResult.value
      : previous.mlHealth,
}));

const coreIsConnected =
  healthResult.status === "fulfilled" ||
  statusResult.status === "fulfilled" ||
  metricsResult.status === "fulfilled";

const mlIsConnected =
  mlHealthResult.status === "fulfilled" ||
  mlStatusResult.status === "fulfilled";

setConnected(coreIsConnected);
setMlConnected(mlIsConnected);

const failedEndpoints = Object.entries(errors)
  .filter(([, message]) => Boolean(message))
  .map(
    ([name, message]) =>
      `${name}: ${message}`
  );

if (failedEndpoints.length > 0) {
  const diagnosticMessage =
    `AlphaStream endpoint errors: ${failedEndpoints.join(
      " | "
    )}`;

  console.error(diagnosticMessage);
  setError(diagnosticMessage);
} else {
  setError(null);
}

setLoading(false);
```

}, []);

const startTraining = useCallback(async () => {
try {
const result =
await triggerMLTraining();

```
  await refresh();

  return result;
} catch (err) {
  console.error(
    "Failed to start ML training:",
    err
  );

  throw err;
}
```

}, [refresh]);

useEffect(() => {
let mounted = true;

```
const runRefresh = async () => {
  if (!mounted) {
    return;
  }

  await refresh();
};

runRefresh();

const interval = setInterval(
  runRefresh,
  pollIntervalMs
);

return () => {
  mounted = false;
  clearInterval(interval);
};
```

}, [refresh, pollIntervalMs]);

return {
...data,

```
connected,
mlConnected,

error,
endpointErrors,

loading,

refresh,
startTraining,
```

};
}

