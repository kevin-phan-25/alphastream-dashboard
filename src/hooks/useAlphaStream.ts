"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getStatus,
  getLogs,
} from "@/services/alphastream";


export interface AlphaStreamStatus {
  ok: boolean;

  equity: number;

  peakEquity: number;

  buyingPower: number;

  positions: number;

  positionsCount: number;

  hardFlat: boolean;

  degraded: boolean;

  winRate: number;

  drawdownPct: number;

  totalTrades: number;

  lastMag7Sentiment?: number;

  version?: string;
}



export function useAlphaStream() {

  const [status, setStatus] =
    useState<AlphaStreamStatus | null>(null);


  const [logs, setLogs] =
    useState<string[]>([]);


  const [connected, setConnected] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);



  const refresh = useCallback(async () => {

    try {

      const [
        statusResponse,
        logsResponse
      ] = await Promise.all([
        getStatus(),
        getLogs(),
      ]);


      setStatus(statusResponse);

      setLogs(logsResponse);

      setConnected(true);

      setError(null);


    } catch (err: any) {

      console.error(
        "AlphaStream connection failed:",
        err
      );


      setConnected(false);

      setError(
        err.message ||
        "AlphaStream Core unavailable"
      );

    }


  }, []);



  useEffect(() => {

    refresh();


    const interval =
      setInterval(
        refresh,
        15000
      );


    return () =>
      clearInterval(interval);


  }, [refresh]);



  return {

    status,

    logs,

    connected,

    error,

    refresh,

  };

}
