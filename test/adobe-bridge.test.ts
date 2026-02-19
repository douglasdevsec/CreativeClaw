import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server } from 'http';

const BRIDGE_PORT = 8082;

describe('Adobe Bridge', () => {
  let bridgeServer: WebSocketServer;
  let httpServer: Server;

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      httpServer = createServer();
      bridgeServer = new WebSocketServer({ server: httpServer });
      
      let agentSocket: WebSocket | null = null;
      let uxpSocket: WebSocket | null = null;

      bridgeServer.on('connection', (ws) => {
          ws.on('message', (raw) => {
              const msg = JSON.parse(raw.toString());
              if (msg.target === 'agent' && msg.command === 'register') {
                  agentSocket = ws;
                  return;
              }
              if (msg.target === 'uxp' && msg.command === 'register') {
                  uxpSocket = ws;
                  return;
              }

              if (msg.target === 'uxp' && uxpSocket) {
                  uxpSocket.send(raw.toString());
              } else if (msg.target === 'agent' && agentSocket) {
                  agentSocket.send(raw.toString());
              }
          });
      });

      httpServer.listen(BRIDGE_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    bridgeServer.close();
    return new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('routes messages from Agent to UXP', async () => {
    return new Promise<void>((resolve, reject) => {
        const agent = new WebSocket(`ws://localhost:${BRIDGE_PORT}`);
        const uxp = new WebSocket(`ws://localhost:${BRIDGE_PORT}`);
        let agentReady = false;
        let uxpReady = false;

        const checkStart = () => {
            if (agentReady && uxpReady) {
               // Give server time to process registrations
               setTimeout(() => {
                   agent.send(JSON.stringify({ target: 'uxp', command: 'create_layer', payload: { name: 'Test' } }));
               }, 100);
            }
        };

        agent.on('open', () => {
            agent.send(JSON.stringify({ target: 'agent', command: 'register' }));
            agentReady = true;
            checkStart();
        });

        uxp.on('open', () => {
            uxp.send(JSON.stringify({ target: 'uxp', command: 'register' }));
            uxpReady = true;
            checkStart();
        });

        uxp.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            try {
                if (msg.command === 'create_layer') {
                    expect(msg.payload.name).toBe('Test');
                    agent.close();
                    uxp.close();
                    resolve();
                }
            } catch (e) {
                reject(e);
            }
        });
        
        agent.on('error', reject);
        uxp.on('error', reject);
    });
  });
});
