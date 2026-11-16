"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHealth,
  getStatus,
  getMetrics,
  getAutonomyStatus,
  getMLAutonomyStatus,
  getPositions,
  getTrades,
  getLogs,
  getMLStatus,
  getMLHealth,
  getReadiness,
  triggerAutonomyTrain,
} from "@/services/alphastream";
import type {
  AlphaStreamHealth,
  AlphaStreamStatus,
  AlphaStreamMetrics,
  AlphaStreamAutonomyStatus,
  AlphaStreamMLAutonomyStatus,
  Position,
  Trade,
  AlphaStreamLog,
  AlphaStreamMLStatus,
  AlphaStreamMLHealth,
  AlphaStreamReadiness,
} from "@/types/alphastream";

interface Data {
  health: AlphaStreamHealth | null;
  status: AlphaStreamStatus | null;
  metrics: AlphaStreamMetrics | null;
  autonomy: AlphaStreamAutonomyStatus | null;
  mlAutonomy: AlphaStreamMLAutonomyStatus | null;
  positions: Position[];
  trades: Trade[];
  logs: (AlphaStreamLog | string)[];
  mlStatus: AlphaStreamMLStatus | null;
  mlHealth: AlphaStreamMLHealth | null;
  ready: AlphaStreamReadiness | null;
  mlReady: AlphaStreamReadiness | null;
}
export type Endpoint = keyof Data;
export interface EndpointState {
  lastSuccess: string | null;
  lastAttempt: string | null;
  error: string | null;
}
const INITIAL: Data = {
  health: null,
  status: null,
  metrics: null,
  autonomy: null,
  mlAutonomy: null,
  positions: [],
  trades: [],
  logs: [],
  mlStatus: null,
  mlHealth: null,
  ready: null,
  mlReady: null,
};
const loaders = {
  health: getHealth,
  status: getStatus,
  metrics: getMetrics,
  autonomy: getAutonomyStatus,
  mlAutonomy: getMLAutonomyStatus,
  positions: getPositions,
  trades: getTrades,
  logs: getLogs,
  mlStatus: getMLStatus,
  mlHealth: getMLHealth,
  ready: () => getReadiness("/api/ready"),
  mlReady: () => getReadiness("/api/ml/ready"),
};
const keys = Object.keys(loaders) as Endpoint[];
const initialEndpoints = Object.fromEntries(
  keys.map((key) => [
    key,
    { lastSuccess: null, lastAttempt: null, error: null },
  ]),
) as Record<Endpoint, EndpointState>;

export function useAlphaStream(pollIntervalMs = 30_000) {
  const [data, setData] = useState<Data>(INITIAL);
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(0);
  const alive = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const run = async () => {
      if (!alive.current) return;
      setRefreshing(true);
      await Promise.allSettled(
        keys.map(async (key) => {
          const attempt = new Date().toISOString();
          try {
            const value = await loaders[key]();
            if (value === null || typeof value !== "object")
              throw new Error("Invalid service response");
            if (!alive.current) return;
            setData((previous) => ({ ...previous, [key]: value }));
            setEndpoints((previous) => ({
              ...previous,
              [key]: {
                lastSuccess: new Date().toISOString(),
                lastAttempt: attempt,
                error: null,
              },
            }));
          } catch (error) {
            if (!alive.current) return;
            setEndpoints((previous) => ({
              ...previous,
              [key]: {
                ...previous[key],
                lastAttempt: attempt,
                error:
                  error instanceof Error ? error.message : "Request failed",
              },
            }));
          }
        }),
      );
      if (alive.current) {
        setRefreshing(false);
        setNow(Date.now());
      }
    };
    const promise = run().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    alive.current = true;
    setNow(Date.now());
    void refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, pollIntervalMs);
    const tick = window.setInterval(() => setNow(Date.now()), 5_000);
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive.current = false;
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, pollIntervalMs]);

  const isStale = (key: Endpoint) =>
    !endpoints[key].lastSuccess ||
    Boolean(endpoints[key].error) ||
    now - Date.parse(endpoints[key].lastSuccess!) > pollIntervalMs * 2;
  return {
    ...data,
    endpoints,
    refreshing,
    now,
    refresh,
    isStale,
    loading: !endpoints.status.lastAttempt,
    connected: !isStale("health") && data.health?.status === "ok",
    mlConnected:
      !isStale("mlHealth") &&
      (data.mlHealth?.status === "ok" || data.mlHealth?.ok === true),
    startTraining: async () => {
      const result = await triggerAutonomyTrain();
      await refresh();
      return result;
    },
  };
}
