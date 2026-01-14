# servo-mcp

A desktop MCP server that gives AI agents the ability to see and control your desktop. Works on **macOS** and **Windows**.

[![npm version](https://img.shields.io/npm/v/servo-mcp.svg)](https://www.npmjs.com/package/servo-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install -g servo-mcp
npx servo-mcp --setup
```

## macOS Permissions

Grant permissions to your **terminal app** (Terminal, iTerm, VS Code, Cursor) in **System Settings > Privacy & Security**:

- **Accessibility** - for mouse clicks and keyboard input
- **Screen Recording** - for taking screenshots

Child processes like servo-mcp inherit permissions from the parent terminal app.

## Windows

No special permissions required.

## What it does

Servo is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that enables Claude Code and other AI agents to:

- Take screenshots of your screen
- Click buttons and interact with UI elements
- Type text and press keyboard shortcuts
- Scroll and navigate applications
- Verify that code changes actually work

## Available Tools

| Tool | Description |
|------|-------------|
| `screenshot` | Capture screen |
| `click` | Click at x,y coordinates |
| `type_text` | Type text at cursor |
| `key_press` | Press key combo (e.g., Cmd+S) |
| `scroll` | Scroll up/down/left/right |
| `move_mouse` | Move cursor to x,y |
| `get_mouse_position` | Get cursor position |
| `focus_app` | Bring app to foreground |
| `open_app` | Launch application |
| `list_windows` | List open windows |
| `wait` | Wait milliseconds |
| `request_permissions` | Open System Preferences |

## Configuration

After running `npx servo-mcp --setup`, your `~/.claude.json` will contain:

```json
{
  "mcpServers": {
    "servo": {
      "command": "npx",
      "args": ["servo-mcp"]
    }
  }
}
```

Restart Claude Code and test with: "take a screenshot"

## Links

- **Website:** [getservo.app](https://getservo.app)
- **GitHub:** [github.com/d11r/getservo](https://github.com/d11r/getservo)

## License

MIT
