/**
 * AlphaStream dashboard hook
 *
 * Date: 2026-08-15
 *
 * Changes:
 * - startTraining → autonomy challenger train (preferred)
 * - startPlainTrain → plain /train
 * - Optional mlAutonomy poll (full ML /autonomy/status)
 */

"use client";

import { useCallback, useEffect, useState } from "react";

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
  triggerMLTraining,
  triggerAutonomyTrain,
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
  AlphaStreamAutonomyStatus,
  AlphaStreamMLAutonomyStatus,
} from "@/types/alphastream";

interface AlphaStreamData {
  health: AlphaStreamHealth | null;
  status: AlphaStreamStatus | null;
  metrics: AlphaStreamMetrics | null;
  autonomy: AlphaStreamAutonomyStatus | null;
  mlAutonomy: AlphaStreamMLAutonomyStatus | null;
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
  autonomy: string | null;
  mlAutonomy: string | null;
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
  autonomy: null,
  mlAutonomy: null,
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
  autonomy: null,
  mlAutonomy: null,
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
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Unknown error";
}

export function useAlphaStream(pollIntervalMs = 30000) {
  const [data, setData] = useState<AlphaStreamData>(EMPTY_DATA);
  const [endpointErrors, setEndpointErrors] =
    useState<AlphaStreamErrors>(EMPTY_ERRORS);
  const [connected, setConnected] = useState(false);
  const [mlConnected, setMlConnected] = useState(false);
  const [autonomyConnected, setAutonomyConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      getHealth(),
      getStatus(),
      getMetrics(),
      getAutonomyStatus(),
      getMLAutonomyStatus(),
      getPositions(),
      getTrades(),
      getLogs(),
      getMLStatus(),
      getMLHealth(),
    ]);

    const [
      healthResult,
      statusResult,
      metricsResult,
      autonomyResult,
      mlAutonomyResult,
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
      autonomy:
        autonomyResult.status === "rejected"
          ? getErrorMessage(autonomyResult.reason)
          : null,
      mlAutonomy:
        mlAutonomyResult.status === "rejected"
          ? getErrorMessage(mlAutonomyResult.reason)
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
      autonomy:
        autonomyResult.status === "fulfilled"
          ? autonomyResult.value
          : previous.autonomy,
      mlAutonomy:
        mlAutonomyResult.status === "fulfilled"
          ? mlAutonomyResult.value
          : previous.mlAutonomy,
      positions:
        positionsResult.status === "fulfilled"
          ? positionsResult.value
          : previous.positions,
      trades:
        tradesResult.status === "fulfilled"
          ? tradesResult.value
          : previous.trades,
      logs:
        logsResult.status === "fulfilled" ? logsResult.value : previous.logs,
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
      metricsResult.status === "fulfilled" ||
      positionsResult.status === "fulfilled" ||
      tradesResult.status === "fulfilled" ||
      logsResult.status === "fulfilled";

    const mlIsConnected =
      mlHealthResult.status === "fulfilled" ||
      mlStatusResult.status === "fulfilled" ||
      mlAutonomyResult.status === "fulfilled";

    const autonomyIsConnected = autonomyResult.status === "fulfilled";

    setConnected(coreIsConnected);
    setMlConnected(mlIsConnected);
    setAutonomyConnected(autonomyIsConnected);

    const failedEndpoints = Object.entries(errors)
      .filter(([, message]) => Boolean(message))
      .map(([endpoint, message]) => `${endpoint}: ${message}`);

    if (failedEndpoints.length > 0) {
      const diagnosticMessage = `AlphaStream endpoint errors: ${failedEndpoints.join(
        " | "
      )}`;
      console.error(diagnosticMessage);
      setError(diagnosticMessage);
    } else {
      setError(null);
    }

    setLoading(false);
  }, []);

  /** Preferred: challenger autonomy train */
  const startTraining = useCallback(async () => {
    try {
      const result = await triggerAutonomyTrain();
      await refresh();
      return result;
    } catch (err) {
      console.error("Failed to start autonomy train:", err);
      throw err;
    }
  }, [refresh]);

  /** Fallback: plain GLOBAL /train */
  const startPlainTrain = useCallback(async () => {
    try {
      const result = await triggerMLTraining();
      await refresh();
      return result;
    } catch (err) {
      console.error("Failed to start plain ML train:", err);
      throw err;
    }
  }, [refresh]);

  useEffect(() => {
    let mounted = true;
    let refreshing = false;

    const runRefresh = async () => {
      if (!mounted || refreshing) {
        return;
      }

      refreshing = true;

      try {
        await refresh();
      } finally {
        refreshing = false;
      }
    };

    void runRefresh();

    const interval = window.setInterval(() => {
      void runRefresh();
    }, pollIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [refresh, pollIntervalMs]);

  return {
    ...data,
    connected,
    mlConnected,
    autonomyConnected,
    error,
    endpointErrors,
    loading,
    refresh,
    startTraining,
    startPlainTrain,
  };
}
