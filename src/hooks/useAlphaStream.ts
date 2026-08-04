/**
 * ---
 * File:
 * src/hooks/useAlphaStream.ts
 *
 * AlphaStream dashboard data hook.
 *
 * Updates:
 * - Added strict TypeScript types
 * - Fixed logs implicit any error
 * - Added connected state
 * - Added refresh handling
 * - Matches Core API response format
 * ---
 */

"use client";

import {
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
} from "@/services/alphastream";


export type AlphaStreamLog =
  | string
  | {
      id?: string | number;
      level?: string;
      timestamp?: string;
      message?: string;
    };


export interface AlphaStreamStatus {
  ok?: boolean;

  equity?: number;

  peakEquity?: number;

  buyingPower?: number;

  positions?: number;

  positionsCount?: number;

  hardFlat?: boolean;

  degraded?: boolean;

  winRate?: number;

  drawdownPct?: number;

  drawdown?: number;

  totalTrades?: number;

  lastMag7Sentiment?: number;

  version?: string;
}


interface AlphaStreamData {

  health: unknown;

  status: AlphaStreamStatus | null;

  metrics: unknown;

  positions: unknown;

  trades: unknown;

  logs: AlphaStreamLog[];

}


export function useAlphaStream() {


  const [data, setData] =
    useState<AlphaStreamData>({
      health: null,
      status: null,
      metrics: null,
      positions: null,
      trades: null,
      logs: [],
    });


  const [connected,setConnected] =
    useState(false);


  const [error,setError] =
    useState<string | null>(null);



  async function refresh() {

    try {

      const [
        health,
        status,
        metrics,
        positions,
        trades,
        logs,

      ] = await Promise.all([

        getHealth(),

        getStatus(),

        getMetrics(),

        getPositions(),

        getTrades(),

        getLogs(),

      ]);



      setData({

        health,

        status:
          status as AlphaStreamStatus,

        metrics,

        positions,

        trades,

        logs:
          Array.isArray(logs)
            ? logs as AlphaStreamLog[]
            : [],

      });



      setConnected(true);

      setError(null);


    } catch(err:any) {


      console.error(
        "AlphaStream refresh failed:",
        err
      );


      setConnected(false);


      setError(
        err?.message ??
        "Unable to connect"
      );


    }

  }



  useEffect(()=>{

    refresh();


    const interval =
      setInterval(
        refresh,
        30000
      );


    return ()=>clearInterval(interval);


  },[]);



  return {

    ...data,

    connected,

    error,

    refresh,

  };

}
