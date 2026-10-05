// TCP forwarder from this Mac's tailnet address to the loopback-only verify
// server, so the T3 preview browser, which reaches this Mac over Tailscale,
// can load the page. Bytes pass through untouched: Origin is not rewritten.
//   bun tailnet-forward.ts <tailnet-ip> <port> --identity html-plan-host:verify-forwarder@<ref>
import { connect, createServer } from "node:net";

const [bindHost, port] = [process.argv[2], Number(process.argv[3])];
createServer((client) => {
  const upstream = connect(port, "127.0.0.1");
  client.pipe(upstream).pipe(client);
  client.on("error", () => upstream.destroy());
  upstream.on("error", () => client.destroy());
}).listen(port, bindHost, () => console.log(`forwarding ${bindHost}:${port} -> 127.0.0.1:${port}`));
