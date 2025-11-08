// api/webhook.js
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------
   In-memory store – survives the lifetime of a single Vercel instance.
   For production you would replace this with Vercel KV / Postgres.
------------------------------------------------------------------- */
let STATE = {
  signals: [],
  trades: [],
  stats: { open: 0, pnl: 0, trades: 0 },
  backtests: [],
  equityCurve: []          // {time, pnl}
};

/* ------------------------------------------------------------------
   Export the handler (Next.js API route style)
------------------------------------------------------------------- */
export default async function handler(req, res) {
  /* ---- 1. Secret check ------------------------------------------------ */
  const secret = req.headers["x-webhook-secret"];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  /* ---- 2. Parse body -------------------------------------------------- */
  let type, data;
  try {
    const body = JSON.parse(req.body || "{}");
    type = body.type;
    data = body.data;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (!type) {
    return res.status(400).json({ error: "Missing type" });
  }

  /* ---- 3. Handle incoming webhook types ------------------------------- */
  try {
    switch (type) {
      case "SCAN":
        STATE.signals = (data.signals || []).slice(0, 5);
        break;

      case "TRADE":
        STATE.trades.push({ ...data, time: new Date().toISOString() });
        STATE.stats.trades += 1;
        // simulate P&L (replace with real Alpaca position fetch in prod)
        const simPnL = Math.random() > 0.55 ? 18 + Math.random() * 12 : -(12 + Math.random() * 8);
        STATE.stats.pnl = Number((STATE.stats.pnl + simPnL).toFixed(2));
        STATE.equityCurve.push({ time: new Date().toISOString(), pnl: STATE.stats.pnl });
        break;

      case "BACKTEST":
        STATE.backtests = data.results || [];
        break;

      case "STATS":
        STATE.stats = { ...STATE.stats, ...data };
        break;

      case "INIT":
        console.log("[INIT]", data?.msg || "Dashboard initialised");
        break;

      default:
        return res.status(400).json({ error: "Unknown type" });
    }

    /* ---- 4. Persist to public/data/ (optional visual backup) ----------- */
    const dir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${type.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ type, data, t: new Date().toISOString() }, null, 2));
    console.log(`Updated ${filePath}`);

    /* ---- 5. Return current state (frontend polls this) ----------------- */
    return res.status(200).json({ ok: true, state: STATE });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* --------------------------------------------------------------------
   Vercel environment variable (add in Vercel dashboard)
   WEBHOOK_SECRET = alphastream-bot-secure-2025!x7k9
-------------------------------------------------------------------- */
