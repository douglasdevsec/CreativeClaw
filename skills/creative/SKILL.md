---
name: creative
description: "Orchestrates Adobe Creative Cloud apps (Photoshop, After Effects) via scripts and MCP. Use for: creating layers, rendering queues, processing assets."
metadata:
  openclaw:
    emoji: "🎨"
    requires:
      bins: ["python3"]
---

# Creative Skill

This skill allows the agent to control Adobe applications.

## Tools

### `photoshop_layer` (Concept)

Creates a new layer in the active Photoshop document.

```bash
# Usage via shell (orchestration agent will call this)
node skills/creative/scripts/photoshop_layer.js --name "My Layer" --color "red"
```

### `aerender_queue` (Concept)

Adds a composition to the render queue and triggers aerender.

```python
# Usage via shell
python3 skills/creative/scripts/aerender_queue.py --comp "Comp 1" --output "render.mov"
```

## Security

All calls to these scripts are intercepted by the Gateway security middleware (`exec-approvals`). You MUST ask for user approval if the action is not in the allowlist.
