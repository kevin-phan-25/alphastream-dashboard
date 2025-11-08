// api/refresh.js
export default async function handler(req, res) {
  try {
    // Fetch patterns JSON dynamically from the public folder
    const baseUrl = process.env.BASE_URL || 'https://alphastream-dashboard.vercel.app';
    const patternsRes = await fetch(`${baseUrl}/data/patterns.json`);
    
    if (!patternsRes.ok) {
      throw new Error(`Failed to fetch patterns.json: ${patternsRes.status}`);
    }

    const patterns = await patternsRes.json();

    // Example: Do something with patterns
    // Replace this with your actual logic
    const scanResult = patterns.map(p => ({
      name: p.name,
      value: p.value * 2
    }));

    res.status(200).json({
      success: true,
      data: scanResult
    });

  } catch (err) {
    console.error(err); // logs visible in Vercel
    res.status(500).json({ error: err.message });
  }
}
