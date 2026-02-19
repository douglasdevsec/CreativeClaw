import WebSocket from 'ws';

const BRIDGE_URL = 'ws://localhost:8081';

console.log(`[CreativeClaw] Connecting to Bridge to drive Illustrator...`);
const ws = new WebSocket(BRIDGE_URL);

ws.on('open', () => {
    console.log('[CreativeClaw] Connected. Sending command...');
    ws.send(JSON.stringify({ target: 'agent', command: 'register' }));

    setTimeout(() => {
        const command = {
            target: 'uxp',
            command: 'create_layer',
            id: 'req-' + Date.now(),
            payload: { name: "Vector Layer via AI" }
        };
        ws.send(JSON.stringify(command));
    }, 500);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[CreativeClaw] Response from Adobe:', msg);
    if (msg.payload && msg.payload.status === 'success') {
        process.exit(0);
    }
});
