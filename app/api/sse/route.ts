// app/api/sse/route.ts
import { addClient } from '@/lib/sse';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Heartbeat every 30s
      const interval = setInterval(() => {
        send({ type: 'HEARTBEAT', data: {}, t: new Date().toISOString() });
      }, 30000);

      const removeClient = addClient(
        (data) => controller.enqueue(encoder.encode(data)),
        () => {
          clearInterval(interval);
          controller.close();
        }
      );

      // Cleanup on abort
      return () => {
        removeClient();
        clearInterval(interval);
      };
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
