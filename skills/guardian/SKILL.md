---
name: guardian
description: "Security layer for intent analysis. Intercepts high-risk commands to Adobe apps or shell tools."
metadata:
  openclaw:
    emoji: "🛡️"
---

# Guardian Skill

The Guardian analyzes intent before execution.

## Responsibilities

1.  **Path Validation**: Ensure all file paths are within `~/.openclaw/media` or project roots.
2.  **Command Validation**: Block destructive shell commands (`rm -rf`, `mkfs`).
3.  **App Control**: Verify that Adobe commands match the user's explicit request.

## Usage

This skill is invoked automatically by the Gateway middleware when a high-risk tool is called.
