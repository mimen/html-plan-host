// TCP forwarder from this Mac's tailnet address to the loopback-only verify server,
// so a preview browser that reaches this machine over Tailscale can load the page.
const [bindHost, port] = [process.argv[2], Number(process.argv[3])];
type Pair = { peer?: import("bun").Socket<Pair>; queue: Uint8Array[] };
Bun.listen<Pair>({
  hostname: bindHost,
  port,
  socket: {
    open(client) {
      client.data = { queue: [] };
      Bun.connect<Pair>({
        hostname: "127.0.0.1",
        port,
        socket: {
          open(upstream) {
            upstream.data = { peer: client, queue: [] };
            client.data.peer = upstream;
            for (const chunk of client.data.queue) upstream.write(chunk);
          },
          data(upstream, chunk) { upstream.data.peer?.write(chunk); },
          close(upstream) { upstream.data.peer?.end(); },
          error(upstream) { upstream.data.peer?.end(); },
        },
      }).catch(() => client.end());
    },
    data(client, chunk) {
      if (client.data.peer) client.data.peer.write(chunk);
      else client.data.queue.push(new Uint8Array(chunk));
    },
    close(client) { client.data.peer?.end(); },
    error(client) { client.data.peer?.end(); },
  },
});
console.log(`forwarding ${bindHost}:${port} -> 127.0.0.1:${port}`);
