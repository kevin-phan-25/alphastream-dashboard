// app/api/webhook/route.js
import fs from "fs";
import path from "path";

let STATE = {
  signals: [],
  trades: [],
  stats: { open: 0, pnl: 0, trades: 0 },
  backtests: [],
  equityCurve: [],
};

export async function POST(req) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  let type, data;
  try {
    const body = await req.json();
    type = body.type;
    data = body.data;
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  if (!type) return new Response(JSON.stringify({ error: "Missing type" }), { status: 400 });

  try {
    switch (type) {
      case "SCAN":
        STATE.signals = (data.signals || []).slice(0, 5);
        break;
      case "TRADE":
        STATE.trades.push({ ...data, time: new Date().toISOString() });
        STATE.stats.trades += 1;
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
        return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
    }

    // Backup to public/data/
    const dir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${type.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ type, data, t: new Date().toISOString() }, null, 2));
    console.log(`Updated ${filePath}`);

    return new Response(JSON.stringify({ ok: true, state: STATE }), { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
