// app/api/webhook/route.js
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");

function load(file) {
  const path = join(DATA_DIR, file);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST() {
  const scan = load("scan.json");
  const stats = load("stats.json") || { open: 0, pnl: 0, trades: 0 };
  const init = load("init.json");

  return new Response(
    JSON.stringify({
      signals: scan?.signals || [],
      stats,
      initMsg: init?.msg || "LIVE",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function GET() {
  return POST();
}
