/**
 * AlphaStream Core API Client
 *
 * Cloudflare Pages frontend
 * ->
 * Google Cloud Run Go Core
 */


import axios from "axios";


const CORE_URL =
  process.env.NEXT_PUBLIC_CORE_URL ??
  "https://alphastream-core-1017433009054.us-east1.run.app";


const client = axios.create({

  baseURL: CORE_URL,

  timeout: 15000,

  headers:{
    "Content-Type":"application/json",
  },

});



// ============================
// HEALTH
// ============================

export async function getHealth(){

  const response =
    await client.get("/health");

  return response.data;

}



// ============================
// STATUS
// ============================

export async function getStatus(){

  const response =
    await client.get("/status");

  return response.data;

}



// ============================
// METRICS
// ============================

export async function getMetrics(){

  const response =
    await client.get("/metrics");

  return response.data;

}



// ============================
// POSITIONS
// ============================

export async function getPositions(){

  const response =
    await client.get("/positions");

  return response.data;

}



// ============================
// TRADES
// ============================

export async function getTrades(){

  const response =
    await client.get("/trades");

  return response.data;

}



// ============================
// LOGS
// ============================

export async function getLogs(){

  const response =
    await client.get("/admin/logs");

  return response.data;

}



export default client;
