// api/webhook.js
import express from "express";

const app = express();
app.use(express.json());

// === SECURITY: Use a secret ===
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "dev-secret-change-me";

app.post("/", (req, res) => {
  const auth = req.headers["x-webhook-secret"];
  if (auth !== WEBHOOK_SECRET) {
    console.warn("Unauthorized webhook attempt");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { type, data } = req.body;
  if (!type || !data) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  console.log(`[WEBHOOK] ${type}`, data);

  // === BROADCAST TO FRONTEND (via global array + SSE) ===
  if (global.webhookEvents) {
    global.webhookEvents.push({ type, data, timestamp: new Date() });
  }

  res.json({ success: true, received: type });
});

// === SSE Endpoint for Live Updates ===
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send existing events
  if (global.webhookEvents) {
    global.webhookEvents.forEach(event => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  // Keep connection open
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// Initialize global event store
if (!global.webhookEvents) {
  global.webhookEvents = [];
}

export default app;
