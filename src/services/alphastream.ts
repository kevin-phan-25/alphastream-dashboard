/**
 * ---
 * File:
 * src/services/alphastream.ts
 *
 * Description:
 * AlphaStream Dashboard API Client
 *
 * Changes:
 * - Removed direct Cloud Run admin calls
 * - Uses Next.js API proxy for protected endpoints
 * - Keeps ADMIN_KEY server-side
 * - Added typed dashboard fetch helpers
 *
 * ---
 */


import type {
  AlphaStreamMetrics,
  AlphaStreamPosition,
  AlphaStreamStatus,
  AlphaStreamTrades,
  AlphaStreamLogs,
} from "@/types/alphastream";


// ======================================================
// BASE API
// ======================================================
//
// Public dashboard endpoints
// go directly to Cloud Run.
//
// Protected admin endpoints
// go through Next.js API routes.
//

const CORE_URL =
  process.env.NEXT_PUBLIC_CORE_URL ||
  "";



// ======================================================
// GENERIC FETCH
// ======================================================

async function apiFetch<T>(
  url:string
):Promise<T>{

  const response =
    await fetch(
      url,
      {
        cache:"no-store",
      }
    );


  if(!response.ok){

    throw new Error(
      `AlphaStream API failed ${response.status}`
    );

  }


  return response.json();

}



// ======================================================
// HEALTH
// ======================================================

export async function getHealth(){

  return apiFetch(
    `${CORE_URL}/health`
  );

}



// ======================================================
// STATUS
// ======================================================

export async function getStatus(){

  return apiFetch<AlphaStreamStatus>(
    `${CORE_URL}/status`
  );

}



// ======================================================
// METRICS
// ======================================================

export async function getMetrics(){

  return apiFetch<AlphaStreamMetrics>(
    `${CORE_URL}/metrics`
  );

}



// ======================================================
// POSITIONS
// ======================================================

export async function getPositions(){

  return apiFetch<AlphaStreamPosition[]>(
    `${CORE_URL}/positions`
  );

}



// ======================================================
// TRADES
// ======================================================

export async function getTrades(){

  return apiFetch<AlphaStreamTrades>(
    `${CORE_URL}/trades`
  );

}



// ======================================================
// LOGS
// ======================================================
//
// IMPORTANT:
// Do NOT call:
// https://alphastream-core.../admin/logs
//
// That requires ADMIN_KEY.
//
// Instead call:
// /api/logs
//
// Next.js attaches ADMIN_KEY server-side.
//

export async function getLogs(){

  return apiFetch<AlphaStreamLogs>(
    "/api/logs"
  );

}



// ======================================================
// ADMIN SCAN
// ======================================================

export async function startScan(){

  const response =
    await fetch(
      "/api/admin/scan",
      {
        method:"POST",
        cache:"no-store",
      }
    );


  if(!response.ok){

    throw new Error(
      `Scan failed ${response.status}`
    );

  }


  return response.json();

}



// ======================================================
// HARD FLAT
// ======================================================

export async function triggerHardFlat(){

  const response =
    await fetch(
      "/api/admin/hard-flat",
      {
        method:"POST",
        cache:"no-store",
      }
    );


  if(!response.ok){

    throw new Error(
      `Hard flat failed ${response.status}`
    );

  }


  return response.json();

}



// ======================================================
// CLEAR BLACKLIST
// ======================================================

export async function clearBlacklist(){

  const response =
    await fetch(
      "/api/admin/clear-blacklist",
      {
        method:"POST",
        cache:"no-store",
      }
    );


  if(!response.ok){

    throw new Error(
      `Blacklist clear failed ${response.status}`
    );

  }


  return response.json();

}
