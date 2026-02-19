// This runs inside Photoshop/Illustrator UXP environment
// UXP environment supports standard WebSocket API globally.

let socket;

function connect() {
    console.log("Connecting to CreativeClaw Bridge...");
    socket = new WebSocket("ws://localhost:8081");

    socket.onopen = () => {
        console.log("Connected to Bridge");
        // Register as UXP client
        socket.send(JSON.stringify({ target: "uxp", command: "register" }));
        document.querySelector(".status").innerText = "Connected to Bridge";
        document.querySelector(".status").style.color = "#4caf50";
    };

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("Received command:", msg);
        handleCommand(msg);
    };

    socket.onclose = () => {
        console.log("Disconnected. Reconnecting...");
        document.querySelector(".status").innerText = "Disconnected (Retrying...)";
        document.querySelector(".status").style.color = "#f44336";
        setTimeout(connect, 3000);
    };

    socket.onerror = (err) => {
        console.error("WebSocket error", err);
    };
}

async function handleCommand(msg) {
    if (msg.target !== "uxp") return;

    try {
        let result;
        const host = require("uxp").host.name;
        
        if (host === "Photoshop") {
            const app = require("photoshop").app;
            switch (msg.command) {
                case "create_layer":
                    await require("photoshop").core.executeAsModal(async () => {
                        const doc = app.activeDocument;
                        if (!doc) await app.documents.add({ width: 800, height: 600 });
                        await app.activeDocument.createLayer({ name: msg.payload.name || "New Layer" });
                    }, { commandName: "Create Layer via AI" });
                    result = { status: "success", app: "Photoshop" }; 
                    break;
                default:
                    console.warn("Unknown command:", msg.command);
            }
        } else if (host === "Illustrator") {
            // Illustrator UXP Scripting (simplified)
            // Note: Illustrator UXP API is slightly different, often using standard DOM or 'app' global if available
            // For this scaffold we'll use a basic alerting mechanism or standard DOM if available
            // As of 2024/2025, Illustrator UXP has `require('illustrator')` or `app`
            
            const app = require("illustrator").app;
            switch (msg.command) {
                case "create_layer":
                    const doc = app.activeDocument; // OR app.documents.add()
                    if (!doc) app.documents.add();
                    
                    const layer = app.activeDocument.layers.add();
                    layer.name = msg.payload.name || "AI Layer";
                    
                    // Optional: Draw a rectangle to prove it works
                    // const rect = layer.pathItems.rectangle(100, 100, 200, 100);
                    // rect.fillColor = app.activeDocument.swatches.getByName('Black').color;
                    
                    result = { status: "success", app: "Illustrator" };
                    break;
                default:
                    console.warn("Unknown command:", msg.command);
            }
        }

        // Send result back to agent
        if (msg.id && result) {
            socket.send(JSON.stringify({
                target: "agent",
                id: msg.id,
                payload: result
            }));
        }

    } catch (err) {
        console.error("Execution error", err);
        if (msg.id) {
            socket.send(JSON.stringify({
                target: "agent",
                id: msg.id,
                error: err.message
            }));
        }
    }
}

// Start connection
document.addEventListener("DOMContentLoaded", connect);
