// CreativeClaw Host Script
// This runs in the ExtendScript (Not Node.js) context of Premiere Pro

function createSequence(name) {
    var project = app.project;
    if (!project) return "No project open";
    
    // Create a new sequence
    var seqName = name || "CreativeClaw Sequence";
    project.createNewSequence(seqName, "id_placeholder"); // Placeholder ID, usually needs a preset path or similar. 
    // In newer PPro versions, we might create standard sequence.
    return "Sequence created (mock)";
}

function helloWorld() {
    alert("CreativeClaw Connected to Premiere Pro 2026!");
}
