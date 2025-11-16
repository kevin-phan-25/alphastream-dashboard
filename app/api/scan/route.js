// app/api/scan/route.js
export async function POST(req) {
  const GAS_URL = 'https://script.google.com/macros/s/132UO_KDxDIP43XQdEjYX3edZnRd2gUMec2AQDizEfu8/exec'; // Replace with your GAS web app URL (deploy GAS as web app below)
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scan' })
    });
    if (response.ok) {
      return new Response('Scan triggered', { status: 200 });
    }
    return new Response('Error', { status: 500 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
