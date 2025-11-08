// /api/webhook.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const secret = req.headers["x-webhook-secret"];
  if (secret !== "alphastream-bot-secure-2025!x7k9") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const { type, data } = JSON.parse(req.body || "{}");
    if (!type || !data) {
      return res.status(400).json({ error: "Missing type or data" });
    }

    const dir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${type.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ type, data }, null, 2));

    console.log(`✅ Updated ${filePath}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
