export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        controller.enqueue(`data: ${JSON.stringify(globalThis.latestData || { type: 'INIT' })}\n\n`);
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
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
