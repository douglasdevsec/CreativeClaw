---
name: adobe-mcp
description: "Adobe Express Developer MCP Server integration via mcporter. Provides access to Adobe Express documentation, add-on development resources, and code examples. Use when users ask about building Adobe Express add-ons."
metadata:
  {
    "openclaw":
      {
        "emoji": "🎨",
        "requires": { "bins": ["npx", "mcporter", "npm"] },
        "install":
          [
            {
              "id": "npm",
              "kind": "npm",
              "package": "@adobe/express-developer-mcp",
              "bins": [],
              "label": "Adobe Express Developer MCP",
            },
            {
              "id": "cli",
              "kind": "npm",
              "package": "@adobe/create-ccweb-add-on",
              "bins": [],
              "label": "Adobe Express Add-on CLI",
            },
          ],
      },
  }
---

# Adobe Express Developer MCP Skill

This skill allows the agent to interact with the **Adobe Express Developer MCP Server** to retrieve documentation and resources for building Adobe Express add-ons. It also guides the use of standard Adobe CLI tools for project creation.

## How to use

The agent should use the `mcporter` tool to call the MCP server for **information retrieval** (docs, snippets) and standard `npx` commands for **project scaffolding**.

### 1. Retrieve Documentation (MCP)

Use `mcporter` to query the Adobe Express Developer MCP server. This server provides semantic search over the documentation.

**Start Server & Query Resources**

```bash
# List available resources/prompts/tools
mcporter call --stdio "npx -y @adobe/express-developer-mcp@latest --yes" list_resources

# Get a specific resource doc
mcporter call --stdio "npx -y @adobe/express-developer-mcp@latest --yes" read_resource uri=<resource_uri>

# OPTIONAL: Ask a general question (if supported by a specific 'ask' tool on the server)
# Check 'mcporter list' output for exact tool names first.
```

**Common MCP Tools**:

- `mcp.list_resources`: Discover available documentation.
- `mcp.get_resource`: Read documentation content.
- `mcp.list_prompts`: View templates for common coding tasks.

### 2. Create New Add-on (CLI)

Use the official CLI to scaffold new projects. **Do not use `fs.mkdir` manually for the project root.**

```bash
# Create a new project interactively (or with defaults if supported)
npx @adobe/create-ccweb-add-on my-add-on-name
```

### 3. Debugging & Local Dev

**Local Server**
To run the add-on locally:

```bash
cd my-add-on-name
npm run start
```

_Note: This runs on `https://localhost:5241`. You must accept the self-signed certificate warning in the browser._

**VS Code Configuration**
When asked to setup debugging, create `.vscode/launch.json` with the "Debug(Chrome) Add-On" configuration pointing to `https://express.adobe.com/new/`.

**Known Issues**

- **Chrome Permission Prompt**: First load may prompt "Look for and connect to any device on your local network". You MUST advise the user to click **Allow**.
- **Firefox/Safari**: Not fully supported for local debugging; recommend Chrome/Edge.

## Resources

- **Developer Site**: [developer.adobe.com/express/add-ons](https://developer.adobe.com/express/add-ons)
- **API Reference**: [developer.adobe.com/apis](https://developer.adobe.com/apis)
