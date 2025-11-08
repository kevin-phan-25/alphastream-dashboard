// /api/webhook.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = req.headers["x-webhook-secret"];
  const bypass = req.headers["x-vercel-protection-bypass"];
  if (secret !== "alphastream-bot-secure-2025!x7k9" || bypass !== "v1.bypass_token_pwzfqlw14d4954dsbc9awhudccwkpl") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { type, data, t } = req.body || {};
    const dataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const fileMap = {
      SCAN: "scan.json",
      BACKTEST: "backtest.json",
      STATS: "stats.json",
      INIT: "init.json",
    };

    const fileName = fileMap[type] || "misc.json";
    const filePath = path.join(dataDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify({ type, data, t }, null, 2));
    console.log(`[Webhook] Updated ${fileName}`);

    return res.status(200).json({ success: true, updated: fileName });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
