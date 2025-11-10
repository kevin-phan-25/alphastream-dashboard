// app/api/sse/route.js
let latest = {};

export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        controller.enqueue(`data: ${JSON.stringify(latest)}\n\n`);
      };
      send();
      const interval = setInterval(send, 5000);
      request.signal.addEventListener('abort', () => clearInterval(interval));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Update latest on webhook
export async function POST(request) {
  // reuse webhook logic here if you want
  return new Response('OK');
}
