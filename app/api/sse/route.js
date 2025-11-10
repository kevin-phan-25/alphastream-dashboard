// app/api/sse/route.js
import { latestData } from './webhook/route.js'; // Not directly importable, so we use global

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(`data: ${JSON.stringify(globalThis.latestData || { type: 'INIT' })}\n\n`);
      const interval = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify(globalThis.latestData || { type: 'INIT' })}\n\n`);
      }, 3000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  globalThis.latestData = globalThis.latestData || { type: 'INIT' };

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
