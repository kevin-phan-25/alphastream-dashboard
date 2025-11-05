import axios from "axios";
import { PATTERNS } from "./public/patterns.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "kevin-phan-25";
const REPO_NAME = "alphastream-dashboard";

export async function getPatternCommits() {
  const commitsResp = await axios.get(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=50`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
  );

  const commits = commitsResp.data;
  const results = [];

  for (const c of commits) {
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
}
