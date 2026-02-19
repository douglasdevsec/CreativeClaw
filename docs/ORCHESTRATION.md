# CreativeClaw Orchestration Agent

## Master Instruction

**Role:** Expert Systems Architect in Creative Software Automation and Autonomous Agents.

**Objective:** Adapt CreativeClaw into a professional AI-controlled graphic editing suite.

### 1. Analysis & Orchestration

The agent must continuously analyze the repository structure and orchestrate the implementation of new capabilities.

- **Context:** You are operating on a fork of OpenClaw, now CreativeClaw.
- **Goal:** Transform it from a personal assistant into a creative studio.

### 2. Architecture: The 6-Layer Core & Adobe MCP

CreativeClaw builds upon OpenClaw's 6-layer architecture, specialized for high-throughput media processing.

#### Adobe Integration Model (The 3-Tier Architecture)

To control Adobe Creative Cloud, we implement a specific 3-tier architecture:

1.  **Level 1 (MCP Integration)**: Python-based MCP servers exposing tools to the Agent.
2.  **Level 2 (The Bridge)**: A Node.js Proxy acting as a dual WebSocket bridge between the Agent/MCP and the Adobe Apps.
3.  **Level 3 (UXP/CEP Plugins)**: JavaScript plugins running _inside_ Adobe apps (Photoshop, Premiere, etc.) that execute the actual DOM manipulation commands sent by the bridge.

#### Gateway Implementation

- **Large File Handling**: `src/media/store.ts` supports files > 2GB using Node.js streams.
- **Security**: UUIDs are used for all file paths to prevent traversal attacks.
- **Media Previews**: WhatsApp and Telegram adapters support thumbnail previews (`jpegThumbnail`) for better UX.

### 3. Application-Specific Strategies

#### Photoshop & Illustrator (UXP)

- **Primary**: WebSocket connection to UXP plugin.
- **Capabilities**: Layer manipulation, text edition, filter application (Gaussian Blur), Smart Object updates.
- **Fallback**: COM/AppleScript automation for file opening/exporting if UXP is restricted.

#### After Effects (Aerender & JSON)

- **Template Engine**: Use `aerender` (CLI) for final output.
- **Dynamic Composition**: Manipulate `.aep` project structure via specific JSON descriptors (following `after-effects-automation` patterns) to update text/assets before rendering.

#### Premiere Pro (Hybrid)

- **CEP Panels**: For complex timeline operations.
- **Automation**: Use ExtendScript (via VS Code extension bridge) or AutoHotkey macros for rapid, repetitive cuts/effects.

### 4. Security & Sandboxing (Defense in Depth)

- **Layer 1 (Gateway Hardening)**: `src/infra` middleware (`exec-approvals`) intercepts all shell/tool commands. Default policy: **DENY**.
- **Layer 2 (Guardian Skill)**: A specific "Guardian" skill that evaluates the _intent_ of instructions before they reach the execution layer.
- **Identity**: Use authentication profiles for LLM keys (no plain env vars).
- **Allowlist**: Strict `allowFrom` in channel config to restrict control to the owner.

### 5. Cost Optimization

- **Formula**: $C = \sum (T_{in} \cdot P_{in} + T_{out} \cdot P_{out}) + C_{vps} + C_{adobe}$
- **Failover Strategy**:
  - **Routing/Logic**: Gemini Flash / GPT-4o-mini.
  - **Visual Analysis/Complex Reasoning**: Claude 3.5 Sonnet / Gemini 1.5 Pro.

### 6. Verification

- **Artifacts**: Generate proof of work (screenshots, logs).
- **Browser Testing**: Use Antigravity's browser tool to verify Web UIs.
- **Automated Flows**:
  1.  **Ingest**: Gateway receives large asset.
  2.  **Process**: Agent commands Photoshop (mock/real) to edit.
  3.  **Render**: Agent triggers AE render.
  4.  **Deliver**: Result sent back via WhatsApp/Telegram with preview.
