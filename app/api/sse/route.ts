// app/api/sse/route.ts
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      if (!globalThis.sseClients) globalThis.sseClients = [];
      globalThis.sseClients.push(controller);

      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', data: { up: true }, t: new Date().toISOString() })}\n\n`);
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        globalThis.sseClients = globalThis.sseClients.filter(c => c !== controller);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
