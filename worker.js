export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const [client, server] = new WebSocketPair();
    server.accept();

    const connections = env.CHATROOM.get('connections') || [];

    server.addEventListener('message', async (event) => {
      const message = event.data;

      // Broadcast message to all connected clients
      for (const conn of connections) {
        try {
          conn.send(message);
        } catch {
          connections.splice(connections.indexOf(conn), 1); // Remove broken connections
        }
      }
    });

    connections.push(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
