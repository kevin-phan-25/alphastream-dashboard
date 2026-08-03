/**
 * File:
 * src/hooks/useAlphaStream.ts
 *
 * Description:
 * AlphaStream dashboard data hook.
 */

"use client";

import { useEffect, useState } from "react";

import {
  getStatus,
  getLogs,
  getPositions,
  getTrades,
} from "@/services/alphastream";

import type {
  AlphaStreamStatus,
  AlphaStreamLog,
  AlphaStreamPosition,
  AlphaStreamTrade,
} from "@/types/alphastream";


export function useAlphaStream() {

  const [status, setStatus] =
    useState<AlphaStreamStatus | null>(null);

  const [logs, setLogs] =
    useState<AlphaStreamLog[]>([]);

  const [positions, setPositions] =
    useState<AlphaStreamPosition[]>([]);

  const [trades, setTrades] =
    useState<AlphaStreamTrade[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [connected, setConnected] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);



  async function refresh() {

    try {

      setError(null);


      const [
        statusResponse,
        logsResponse,
        positionsResponse,
        tradesResponse,
      ] = await Promise.all([
        getStatus(),
        getLogs(),
        getPositions(),
        getTrades(),
      ]);



      const normalizedStatus: AlphaStreamStatus = {

        ok:
          statusResponse.ok ??
          true,


        equity:
          statusResponse.equity ??
          0,


        peakEquity:
          statusResponse.peakEquity ??
          statusResponse.equity ??
          0,


        positionsCount:
          statusResponse.positionsCount ??
          0,


        hardFlat:
          statusResponse.hardFlat ??
          false,


        drawdown:
          statusResponse.drawdown ??
          0,


        winRate:
          statusResponse.winRate ??
          0,


        uptime:
          statusResponse.uptime ??
          0,

      };


      setStatus(normalizedStatus);

      setLogs(logsResponse ?? []);

      setPositions(
        positionsResponse ?? []
      );

      setTrades(
        tradesResponse ?? []
      );


      setConnected(true);


    } catch (err) {


      console.error(
        "AlphaStream refresh failed:",
        err
      );


      setConnected(false);


      setError(
        err instanceof Error
          ? err.message
          : "Unknown error"
      );


    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    refresh();


    const interval =
      setInterval(
        refresh,
        10000
      );


    return () =>
      clearInterval(interval);


  }, []);



  return {

    status,

    logs,

    positions,

    trades,

    loading,

    connected,

    error,

    refresh,

  };

}
