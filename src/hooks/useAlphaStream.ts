"use client";


import { useEffect, useState } from "react";


import {
  getStatus,
  getLogs,
} from "@/services/alphastream";


import type {
  AlphaStreamStatus,
  AlphaStreamLog,
} from "@/types/alphastream";



export function useAlphaStream() {


  const [status,setStatus] =
    useState<AlphaStreamStatus | null>(null);


  const [logs,setLogs] =
    useState<AlphaStreamLog[]>([]);


  const [loading,setLoading] =
    useState(true);



  async function refresh(){

    try {

      const [
        statusResponse,
        logsResponse,
      ] = await Promise.all([
        getStatus(),
        getLogs(),
      ]);


      setStatus(statusResponse);

      setLogs(logsResponse);


    } finally {

      setLoading(false);

    }

  }



  useEffect(()=>{

    refresh();


    const timer =
      setInterval(refresh,10000);


    return ()=>clearInterval(timer);


  },[]);



  return {

    status,

    logs,

    loading,

    refresh,

  };

}
