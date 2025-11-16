// app/api/scan/route.js
export async function POST(req) {
  const GAS_WEBHOOK = 'https://script.google.com/macros/s/YOUR_GAS_WEB_APP_ID/exec'; // Replace with your GAS web app URL (deploy GAS as web app)
  try {
    const response = await fetch(GAS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scan' })
    });
    if (response.ok) {
      return new Response('Scan triggered', { status: 200 });
    }
    return new Response('Error triggering scan', { status: 500 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
