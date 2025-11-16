import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      if (!globalThis.sseClients) globalThis.sseClients = [];
      globalThis.sseClients.push(controller);

      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', data: { up: true } })}\n\n`);
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const index = globalThis.sseClients.indexOf(controller);
        if (index > -1) globalThis.sseClients.splice(index, 1);
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
