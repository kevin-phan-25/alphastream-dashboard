// app/api/sse/route.ts
import { NextRequest } from 'next/server';

// In-memory store (use Redis in prod)
const clients: Set<WritableStreamDefaultWriter> = new Set();

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Heartbeat
      const interval = setInterval(() => {
        send({ type: 'HEARTBEAT', data: {}, t: new Date().toISOString() });
      }, 30000);

      // Store client
      const writer = { send, close: () => clearInterval(interval) };
      clients.add(writer as any);

      request.signal.addEventListener('abort', () => {
        clients.delete(writer as any);
        clearInterval(interval);
        controller.close();
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

// Broadcast function (call from POST webhook)
export function broadcast(event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = new TextEncoder().encode(data);
  clients.forEach(client => {
    try {
      client.send(encoded);
    } catch (err) {
      clients.delete(client);
    }
  });
}
