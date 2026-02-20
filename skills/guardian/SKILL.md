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

## Responsibilities — Social Media (Phase 2)

4.  **Social Media Approval**: Any call to `facebook_post`, `instagram_post`, or
    `content_pipeline` MUST be confirmed by the user before execution.
    - Present the action summary: platform, message, image path.
    - Wait for explicit "yes" / "confirmar" from the user.
    - If the user does not confirm within the session, abort and log the refusal.

5.  **Session Key Check**: Warn if `CREATIVECLAW_SESSION_KEY` is not set when
    browser scripts are invoked. Plaintext sessions are blocked in production.

## Usage

This skill is invoked automatically by the Gateway middleware when a high-risk tool is called.
