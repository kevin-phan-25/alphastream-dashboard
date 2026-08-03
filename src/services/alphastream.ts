import axios from "axios";

import type {
  AlphaStreamStatus,
  AlphaStreamPosition,
  AlphaStreamScanResult,
  AlphaStreamActionResponse,
} from "@/types/alphastream";


const API_URL =
  process.env.NEXT_PUBLIC_ALPHASTREAM_API ||
  "http://localhost:8080";


const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});



export async function getStatus(): Promise<AlphaStreamStatus> {

  const response = await api.get("/status");

  return response.data;

}



export async function getPositions(): Promise<AlphaStreamPosition[]> {

  const response = await api.get("/positions");

  return response.data;

}



export async function getLogs(): Promise<string[]> {

  try {

    const response = await api.get("/logs");

    return response.data.logs ?? [];

  } catch {

    return [];

  }

}



export async function triggerScan(): Promise<AlphaStreamScanResult> {

  const response = await api.post("/admin/scan");

  return response.data;

}



export async function triggerHardFlat(): Promise<AlphaStreamActionResponse> {

  const response = await api.post("/admin/hard-flat");

  return response.data;

}



export async function clearBlacklist(): Promise<AlphaStreamActionResponse> {

  const response = await api.post("/admin/clear-blacklist");

  return response.data;

}
