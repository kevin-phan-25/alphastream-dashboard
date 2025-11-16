import { writeFile, readFile } from "fs/promises";
import path from "path";

const SECRET = "alphastream-bot-secure-2025!x7k9";
const DATA_FILE = path.join(process.cwd(), "public", "data.json");

export async function POST(req) {
  if (req.headers.get("x-webhook-secret") !== SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();

    // Load current state
    let state = {
      equity: 99998.93,
      positions: 0,
      dailyLoss: 0,
      lastScan: null,
      winRate: 0,
      trades: [],
      logs: ["Waiting for data..."],
    };

    try {
      const txt = await readFile(DATA_FILE, "utf8");
      state = JSON.parse(txt);
    } catch {}

    // Update based on type
    switch (body.type) {
      case "HEARTBEAT":
        state.lastScan = new Date(body.t).toLocaleTimeString();
        state.logs.unshift(`[${new Date().toLocaleTimeString()}] Bot live`);
        break;
      case "TRADE":
        state.trades.unshift(body.data);
        state.positions = Math.min(state.positions + 1, 3);
        state.winRate =
          state.trades.length
            ? ((state.trades.filter((t) => t.pnl > 0).length / state.trades.length) *
                100
              ).toFixed(1)
            : 0;
        break;
      case "EXIT":
        state.trades = state.trades.map((t) =>
          t.symbol === body.data.symbol ? { ...t, pnl: body.data.pnl } : t
        );
        state.positions = Math.max(state.positions - 1, 0);
        state.dailyLoss = Math.max(state.dailyLoss + (body.data.pnl || 0), 0);
        break;
      case "INIT":
        Object.assign(state, body.data);
        break;
      default:
        state.logs.unshift(
          `[${new Date().toLocaleTimeString()}] ${body.type}: ${JSON.stringify(
            body.data
          )}`
        );
    }

    state.logs = state.logs.slice(0, 50);
    state.trades = state.trades.slice(0, 20);

    await writeFile(DATA_FILE, JSON.stringify(state, null, 2));
    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
