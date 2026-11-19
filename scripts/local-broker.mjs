// A tiny MQTT broker for local development and the end to end tests.
// The real app talks to a public MQTT broker over WebSockets; pointing
// NEXT_PUBLIC_MQTT_URL at ws://localhost:8883 swaps it for this one.
import { Aedes } from "aedes";
import { createServer } from "node:http";
import { WebSocketServer, createWebSocketStream } from "ws";

const port = Number(process.env.BROKER_PORT ?? 8883);
const aedes = await Aedes.createBroker();
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
  const stream = createWebSocketStream(socket);
  aedes.handle(stream, req);
});

server.listen(port, () => console.log(`[broker] ws://localhost:${port}`));
