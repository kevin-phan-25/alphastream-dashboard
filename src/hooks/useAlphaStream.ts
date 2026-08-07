"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHealth,
  getStatus,
  getMetrics,
  getPositions,
  getTrades,
  getLogs,
} from "@/services/alphastream";
import type {
  AlphaStreamHealth,
  AlphaStreamStatus,
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamTrade,
  AlphaStreamLog,
} from "@/types/alphastream";

interface AlphaStreamData {
  health: AlphaStreamHealth | null;
  status: AlphaStreamStatus | null;
  metrics: AlphaStreamMetrics | null;
  positions: AlphaStreamPosition[];
  trades: AlphaStreamTrade[];
  logs: (AlphaStreamLog | string)[];
}

export function useAlphaStream(pollIntervalMs = 30_000) {
  const [data, setData] = useState<AlphaStreamData>({
    health: null,
    status: null,
    metrics: null,
    positions: [],
    trades: [],
    logs: [],
  });

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [health, status, metrics, positions, trades, logs] =
        await Promise.all([
          getHealth(),
          getStatus(),
          getMetrics(),
          getPositions(),
          getTrades(),
          getLogs(),
        ]);

      setData({
        health,
        status,
        metrics,
        positions,
        trades,
        logs: Array.isArray(logs) ? logs : [],
      });

      setConnected(true);
      setError(null);
    } catch (err: unknown) {
      console.error("AlphaStream refresh failed:", err);
      setConnected(false);
      setError(
        err instanceof Error ? err.message : "Unable to connect to Core"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return {
    ...data,
    connected,
    error,
    loading,
    refresh,
  };
}
