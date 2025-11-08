// /api/refresh.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), "public", "data");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
    const data = {};

    for (const f of files) {
      const content = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      data[f.replace(".json", "")] = content.data || content;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Failed to read data" });
  }
}
