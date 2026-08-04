import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

export async function getHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function getMetrics() {
  const { data } = await api.get("/metrics");
  return data;
}

export async function getPositions() {
  const { data } = await api.get("/positions");
  return data;
}

export async function getTrades() {
  const { data } = await api.get("/trades");
  return data;
}
