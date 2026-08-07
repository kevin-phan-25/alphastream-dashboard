/**
 * Date: 2026-08-07
 * File: src/hooks/useAlphaStream.ts
 *
 * Changes:
 * - Added ML status + health
 * - Added triggerTraining helper
 */

"use client";

import { useEffect, useState, useCallback } from "react";
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

export function useAlphaStream(pollIntervalMs = 30_000) {
  const [data, setData] = useState<AlphaStreamData>({
    health: null,
    status: null,
    metrics: null,
    positions: [],
    trades: [],
    logs: [],
    mlStatus: null,
    mlHealth: null,
  });

  const [connected, setConnected] = useState(false);
  const [mlConnected, setMlConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [
        health,
        status,
        metrics,
        positions,
        trades,
        logs,
        mlStatus,
        mlHealth,
      ] = await Promise.all([
        getHealth().catch(() => null),
        getStatus().catch(() => null),
        getMetrics().catch(() => null),
        getPositions().catch(() => []),
        getTrades().catch(() => []),
        getLogs().catch(() => []),
        getMLStatus().catch(() => null),
        getMLHealth().catch(() => null),
      ]);

      setData({
        health,
        status,
        metrics,
        positions,
        trades,
        logs: Array.isArray(logs) ? logs : [],
        mlStatus,
        mlHealth,
      });

      setConnected(!!health || !!status);
      setMlConnected(!!mlHealth || !!mlStatus);
      setError(null);
    } catch (err: unknown) {
      console.error("AlphaStream refresh failed:", err);
      setConnected(false);
      setMlConnected(false);
      setError(
        err instanceof Error ? err.message : "Unable to connect"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const startTraining = useCallback(async () => {
    try {
      const result = await triggerMLTraining();
      await refresh(); // refresh buffers after triggering
      return result;
    } catch (err) {
      console.error("Failed to start training:", err);
      throw err;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return {
    ...data,
    connected,
    mlConnected,
    error,
    loading,
    refresh,
    startTraining,
  };
}
