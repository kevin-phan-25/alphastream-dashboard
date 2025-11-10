// app/api/sse/route.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const data = globalThis.latestData || { type: 'INIT' };
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };
      send();
      const interval = setInterval(send, 3000);
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
