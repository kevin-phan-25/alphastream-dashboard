import axios from "axios";

import type {
  AlphaStreamStatus,
  AlphaStreamPosition,
  AlphaStreamScanResult,
  AlphaStreamActionResponse,
} from "@/types/alphastream";


const API_URL =
  process.env.NEXT_PUBLIC_ALPHASTREAM_API ||
  "https://YOUR-CORE-SERVICE.run.app";


const api = axios.create({

  baseURL: API_URL,

  timeout: 10000,

});



export async function getStatus(): Promise<AlphaStreamStatus> {

  const res = await api.get("/status");

  return res.data;

}



export async function getPositions(): Promise<
  AlphaStreamPosition[]
> {

  const res = await api.get("/positions");

  return res.data;

}



export async function triggerScan(): Promise<AlphaStreamScanResult> {

  const res = await api.post("/admin/scan");

  return res.data;

}



export async function triggerHardFlat(): Promise<
  AlphaStreamActionResponse
> {

  const res = await api.post("/admin/hard-flat");

  return res.data;

}



export async function clearBlacklist(): Promise<
  AlphaStreamActionResponse
> {

  const res = await api.post("/admin/clear-blacklist");

  return res.data;

}
