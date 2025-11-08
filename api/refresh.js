// api/refresh.js
import fetch from "node-fetch"; // add this if using Node 18+

export default async function handler(req, res) {
  try {
    // Call your GAS web app URL that runs `run()` and returns signals/stats/backtest
    const GAS_URL = "https://script.google.com/macros/s/132UO_KDxDIP43XQdEjYX3edZnRd2gUMec2AQDizEfu8/exec";

    const response = await fetch(GAS_URL);
    const data = await response.json();

    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch live data" });
  }
}
