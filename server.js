// server.js
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

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// --- GitHub Pattern Fetcher ---
async function fetchPatternCommits() {
  if (!GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN not set - returning empty patterns");
    return [];
  }

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=50`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
      timeout: 10000
    });

    const results = [];
    for (const c of data) {
      const message = (c.commit?.message || "").toLowerCase();
      const matched = PATTERNS.find(p => p.keywords.some(k => message.includes(k)));
      if (matched) {
        results.push({
          name: matched.name,
          message: c.commit.message,
          date: c.commit.author?.date?.split("T")[0] || "",
          url: c.html_url,
          sha: c.sha?.substring(0, 7) || ""
        });
      }
    }
    return results;
  } catch (err) {
    console.error("GitHub fetch failed:", (err && err.message) || err);
    return [];
  }
}

// REST endpoint: /patterns
app.get("/patterns", async (req, res) => {
  const items = await fetchPatternCommits();
  res.setHeader("Content-Type", "application/json");
  res.json({ count: items.length, patterns: items });
});

// fallback to index.html for SPA (optional)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export the express app for Vercel
export default app;
