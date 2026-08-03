import axios from "axios";

import type {
  AlphaStreamStatus,
  AlphaStreamLog,
  Trade,
  Position,
} from "@/types/alphastream";


const API_URL =
  process.env.NEXT_PUBLIC_ALPHASTREAM_API ||
  "/api";


const client = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});



export async function getStatus(): Promise<AlphaStreamStatus> {

  const response = await client.get("/health");

  return response.data;

}



export async function getLogs(): Promise<AlphaStreamLog[]> {

  const response = await client.get("/metrics");

  return response.data.logs ?? [];

}



export async function getPositions(): Promise<Position[]> {

  const response = await client.get("/positions");

  return response.data.positions ?? [];

}



export async function getTrades(): Promise<Trade[]> {

  const response = await client.get("/trades");

  return response.data.trades ?? [];

}



export async function triggerHardFlat(): Promise<void> {

  await client.post("/admin/hard-flat");

}



export async function clearBlacklist(): Promise<void> {

  await client.post("/admin/clear-blacklist");

}
