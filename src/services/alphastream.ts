/**
 * ---------------------------------------------------------
 * Date: 2026-08-03
 * File: src/services/alphastream.ts
 *
 * Changes:
 * - Added compatibility aliases for trading components
 * - Added triggerScan()
 * - Added triggerHardFlat()
 * - Preserved existing Core API methods
 * ---------------------------------------------------------
 */

import axios from "axios";


const API_URL =
  process.env.NEXT_PUBLIC_ALPHASTREAM_API ||
  "https://alphastream-core.example.com";



const client = axios.create({

  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },

});




export async function getStatus() {

  const response =
    await client.get("/status");


  return response.data;

}





export async function getLogs() {

  const response =
    await client.get("/admin/logs");


  return response.data;

}





export async function scan() {

  const response =
    await client.post("/admin/scan");


  return response.data;

}





export async function hardFlat() {

  const response =
    await client.post("/admin/hard-flat");


  return response.data;

}





export async function health() {

  const response =
    await client.get("/health");


  return response.data;

}




// ---------------------------------------------------------
// Compatibility exports
// Used by ActionPanel.tsx
// ---------------------------------------------------------


export async function triggerScan() {

  return scan();

}





export async function triggerHardFlat() {

  return hardFlat();

}
