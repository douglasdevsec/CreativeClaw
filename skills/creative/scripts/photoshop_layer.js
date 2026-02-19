import WebSocket from 'ws';

const BRIDGE_URL = 'ws://localhost:8081';

// Parse args
const args = process.argv.slice(2);
let name = 'New Layer';
let color = 'red';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') name = args[i+1];
    if (args[i] === '--color') color = args[i+1];
}

console.log(`[CreativeClaw] Connecting to Bridge at ${BRIDGE_URL}...`);
const ws = new WebSocket(BRIDGE_URL);

ws.on('open', () => {
    console.log('[CreativeClaw] Connected. Registering as agent...');
    ws.send(JSON.stringify({ target: 'agent', command: 'register' }));

    // Wait a bit or send command immediately?
    // In real implementation, we should wait for ack.
    setTimeout(() => {
        console.log(`[CreativeClaw] Sending create_layer command for '${name}'...`);
        const command = {
            target: 'uxp',
            command: 'create_layer',
            id: 'req-' + Date.now(),
            payload: { name, color }
        };
        ws.send(JSON.stringify(command));
    }, 100);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.payload && msg.payload.status === 'success') {
        console.log(`[CreativeClaw] Success! Layer created. ID: ${msg.payload.layerId}`);
        process.exit(0);
    } else if (msg.error) {
        console.error(`[CreativeClaw] Error from Adobe: ${msg.error}`);
        process.exit(1);
    }
});

ws.on('error', (err) => {
    console.error('[CreativeClaw] Bridge connection error:', err.message);
    process.exit(1);
});
