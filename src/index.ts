import server from "./app.ts";
import { initSchema } from "./db.ts";

await initSchema();

console.log(`html-plan-host listening on ${server.hostname}:${server.port}`);

export default server;
