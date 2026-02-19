import { WebSocketServer, WebSocket } from "ws";

const PORT = 8081;

interface BridgeMessage {
  target: "agent" | "uxp";
  command?: string;
  payload?: any;
  id?: string;
}

const wss = new WebSocketServer({ port: PORT });

let agentSocket: WebSocket | null = null;
let uxpSocket: WebSocket | null = null;

console.log(`[AdobeBridge] Listening on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("[AdobeBridge] New connection");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as BridgeMessage;
      
      // Registration mechanism (simplistic for now)
      if (msg.target === "agent" && msg.command === "register") {
        agentSocket = ws;
        console.log("[AdobeBridge] Agent registered");
        return;
      }
      if (msg.target === "uxp" && msg.command === "register") {
        uxpSocket = ws;
        console.log("[AdobeBridge] UXP registered");
        return;
      }

      // Routing
      if (msg.target === "uxp" && uxpSocket) {
        if (uxpSocket.readyState === WebSocket.OPEN) {
          uxpSocket.send(raw.toString());
        } else {
          console.warn("[AdobeBridge] UXP socket not open");
        }
      } else if (msg.target === "agent" && agentSocket) {
        if (agentSocket.readyState === WebSocket.OPEN) {
          agentSocket.send(raw.toString());
        } else {
          console.warn("[AdobeBridge] Agent socket not open");
        }
      } else {
        console.warn(`[AdobeBridge] No route for target: ${msg.target}`);
      }

    } catch (err) {
      console.error("[AdobeBridge] Invalid message", err);
    }
  });

  ws.on("close", () => {
    if (ws === agentSocket) {
        console.log("[AdobeBridge] Agent disconnected");
        agentSocket = null;
    }
    if (ws === uxpSocket) {
        console.log("[AdobeBridge] UXP disconnected");
        uxpSocket = null;
    }
  });
});
