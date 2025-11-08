// /api/refresh.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const dataDir = path.join(process.cwd(), "public", "data");
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
    const payload = {};
    for (const f of files) {
      const full = path.join(dataDir, f);
      payload[f.replace(".json", "")] = JSON.parse(fs.readFileSync(full, "utf8"));
    }
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ error: "Unable to read data files" });
  }
}
