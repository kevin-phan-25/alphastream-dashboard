// server.js
import axios from "axios";
import express from "express";
import { PATTERNS } from "./public/patterns.js";

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "kevin-phan-25";
const REPO_NAME = "alphastream-dashboard";

const app = express();
app.use(express.static("public"));

// --- GitHub Pattern Fetcher ---
async function fetchPatternCommits() {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=30`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );

    const results = [];
    for (const c of data) {
      const message = c.commit.message.toLowerCase();
      const matched = PATTERNS.find(p =>
        p.keywords.some(k => message.includes(k))
      );
      if (matched) {
        results.push({
          name: matched.name,
          message: c.commit.message,
          date: c.commit.author.date.split("T")[0],
          url: c.html_url,
          sha: c.sha.substring(0, 7)
        });
      }
    }

    return results;
  } catch (err) {
    console.error("⚠️ GitHub fetch failed:", err.message);
    return [];
  }
}

// --- REST Endpoint for Patterns ---
app.get("/patterns", async (req, res) => {
  const data = await fetchPatternCommits();
  res.json({ count: data.length, patterns: data });
});

// --- Start Server (Vercel handles the listener) ---
export default app;
