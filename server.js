import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { PATTERNS } from "./public/patterns.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO_OWNER = "kevin-phan-25";
const REPO_NAME = "alphastream-dashboard";

const app = express();

async function fetchPatternCommits() {
  if (!GITHUB_TOKEN) return [];
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=50`,
      {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        timeout: 10000
      }
    );
    const results = [];
    for (const c of data) {
      const msg = (c.commit?.message || "").toLowerCase();
      const matched = PATTERNS.find(p => p.keywords.some(k => msg.includes(k)));
      if (matched) {
        results.push({
          name: matched.name,
          message: c.commit.message,
          date: (c.commit.author?.date || "").split("T")[0],
          url: c.html_url,
          sha: (c.sha || "").substring(0, 7)
        });
      }
    }
    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
}

app.get("/patterns", async (req, res) => {
  const items = await fetchPatternCommits();
  res.setHeader("Cache-Control", "no-store");
  res.json({ count: items.length, patterns: items });
});

export default app;
