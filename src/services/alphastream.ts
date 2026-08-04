import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});


/**
 * Health / status endpoint
 */
export async function getStatus() {
  const response = await api.get("/health");

  return response.data;
}


/**
 * Metrics endpoint
 */
export async function getMetrics() {
  const response = await api.get("/metrics");

  return response.data;
}


/**
 * Open positions
 */
export async function getPositions() {
  const response = await api.get("/positions");

  return response.data;
}


/**
 * Trade history
 */
export async function getTrades() {
  const response = await api.get("/trades");

  return response.data;
}


/**
 * Logs placeholder
 *
 * Added because dashboard expects this.
 * Replace later when backend exposes /logs.
 */
export async function getLogs() {
  return [];
}


export default api;
