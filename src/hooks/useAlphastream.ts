"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCoreStatus,
  getCoreLogs,
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



export function useAlphastream() {


  const [status,setStatus] =
    useState<AlphaStreamStatus | null>(null);


  const [logs,setLogs] =
    useState<string[]>([]);


  const [connected,setConnected] =
    useState(false);


  const [error,setError] =
    useState<string | null>(null);



  const refresh = useCallback(async()=>{


    try {


      setError(null);


      const [
        statusData,
        logsData
      ] = await Promise.all([

        getCoreStatus(),

        getCoreLogs(),

      ]);



      setStatus(statusData);

      setLogs(logsData);

      setConnected(true);



    } catch(err:any){


      console.error(err);


      setConnected(false);


      setError(
        err.message ||
        "Core service unavailable"
      );


    }


  },[]);



  useEffect(()=>{


    refresh();


    const timer =
      setInterval(
        refresh,
        15000
      );


    return ()=>clearInterval(timer);


  },[refresh]);



  return {

    status,

    logs,

    connected,

    error,

    refresh,

  };


}
