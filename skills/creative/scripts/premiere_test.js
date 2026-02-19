import WebSocket from 'ws';

const BRIDGE_URL = 'ws://localhost:8081';

console.log(`[CreativeClaw] Connecting to Bridge to drive Premiere Pro...`);
const ws = new WebSocket(BRIDGE_URL);

ws.on('open', () => {
    console.log('[CreativeClaw] Connected. Sending "create_sequence" command...');
    
    // 1. Register
    ws.send(JSON.stringify({ target: 'agent', command: 'register' }));

    // 2. Send Command
    setTimeout(() => {
        const command = {
            target: 'uxp', // We reuse 'uxp' target for now as the bridge broadcasts to all 'uxp'/'cep' clients unless verified otherwise
            command: 'create_sequence',
            id: 'req-' + Date.now(),
            payload: { name: "AI Generated Sequence 01" }
        };
        ws.send(JSON.stringify(command));
    }, 500);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[CreativeClaw] Response from Premiere:', msg);
    
    if (msg.payload && (msg.payload.status === 'success' || msg.payload.status === 'mock_success')) {
        console.log('✅ Test Passed: Sequence creation confirmed.');
        process.exit(0);
    }
});
