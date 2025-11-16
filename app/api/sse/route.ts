// app/api/sse/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Initialize global SSE clients
      if (!globalThis.sseClients) globalThis.sseClients = [];
      globalThis.sseClients.push(controller);

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', data: { up: true } })}\n\n`);
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const index = globalThis.sseClients.indexOf(controller);
        if (index > -1) globalThis.sseClients.splice(index, 1);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
