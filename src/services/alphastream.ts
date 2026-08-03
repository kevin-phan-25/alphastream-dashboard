/**
 * -----------------------------------------------------------------------------
 * Date: 2026-08-03
 * File: src/services/alphastream.ts
 *
 * Description:
 * AlphaStream Core API service layer.
 *
 * Changes:
 * • Added missing dashboard API functions
 * • Added scan trigger
 * • Added hard-flat trigger
 * • Added blacklist clearing
 * • Added status fetching
 * • Added logs fetching
 * • Added typed API wrapper
 * • Compatible with Cloudflare Pages deployment
 * -----------------------------------------------------------------------------
 */

import axios from "axios";
import type { AlphaStreamStatus } from "@/types/alphastream";

const API_URL =
  process.env.NEXT_PUBLIC_ALPHASTREAM_API ||
  "http://localhost:8080";


const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});


// ---------------------------------------------------------
// GET STATUS
// ---------------------------------------------------------

export async function getStatus(): Promise<AlphaStreamStatus> {
  const response = await client.get("/status");

  return response.data;
}


// ---------------------------------------------------------
// GET LOGS
// ---------------------------------------------------------

export async function getLogs(): Promise<string[]> {
  const response = await client.get("/logs");

  return response.data.logs ?? [];
}


// ---------------------------------------------------------
// TRIGGER SCAN
// Matches Go Core:
// POST /admin/scan
// ---------------------------------------------------------

export async function triggerScan() {
  const response = await client.post("/admin/scan");

  return response.data;
}


// Alias for older dashboard code
export const scan = triggerScan;


// ---------------------------------------------------------
// HARD FLAT
// Matches Go Core:
// POST /admin/hard-flat
// ---------------------------------------------------------

export async function triggerHardFlat() {
  const response = await client.post("/admin/hard-flat");

  return response.data;
}


// Alias for older dashboard code
export const hardFlat = triggerHardFlat;


// ---------------------------------------------------------
// CLEAR BLACKLIST
// Matches Go Core:
// POST /admin/clear-blacklist
// ---------------------------------------------------------

export async function clearBlacklist() {
  const response = await client.post(
    "/admin/clear-blacklist"
  );

  return response.data;
}


// ---------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------

export async function health() {
  const response = await client.get("/health");

  return response.data;
}


// ---------------------------------------------------------
// GENERIC FETCH
// ---------------------------------------------------------

export async function apiGet<T>(
  path: string
): Promise<T> {

  const response = await client.get(path);

  return response.data;
}


export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {

  const response = await client.post(
    path,
    body
  );

  return response.data;
}
