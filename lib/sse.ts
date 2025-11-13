// lib/sse.ts
type Client = {
  send: (data: string) => void;
  close: () => void;
};

const clients = new Set<Client>();

export function broadcast(event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(client => {
    try {
      client.send(data);
    } catch {
      clients.delete(client);
    }
  });
}

export function addClient(send: (data: string) => void, close: () => void) {
  const client = { send, close };
  clients.add(client);
  return () => clients.delete(client);
}
