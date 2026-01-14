# servo-mcp

A desktop MCP server that gives AI agents the ability to see and control your desktop.

**[getservo.app](https://getservo.app)** - Installation instructions and documentation

## What is Servo?

Servo is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that enables Claude Code and other AI agents to:

- Take screenshots of your screen
- Click buttons and interact with UI elements
- Type text and press keyboard shortcuts
- Scroll and navigate applications
- Verify that changes actually work

**Key features:**
- 100% local - no cloud, no telemetry, no data sharing
- Works on macOS and Windows
- Pure Node.js with native platform APIs (no Electron, no external dependencies)
- Simple npm install

## Installation

Install via npm (macOS and Windows):

```bash
npm install -g servo-mcp
npx servo-mcp --setup
```

### macOS Permissions

Grant permissions to your **terminal app** (Terminal, iTerm, VS Code, Cursor, etc.) in **System Settings > Privacy & Security**:

- **Accessibility** - for mouse clicks and keyboard input
- **Screen Recording** - for taking screenshots

Child processes like servo-mcp inherit permissions from the parent terminal app.

### Windows

No special permissions required. Windows may prompt for access when servo-mcp runs.

## Setup with Claude Code

After running `npx servo-mcp --setup`, your `~/.claude.json` will be configured:

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

## Development

```bash
pnpm install
pnpm dev:mcp          # Run MCP server in dev mode
pnpm dev:web          # Run website

# Build
pnpm build:mcp        # Bundle with esbuild
```

## Architecture

Servo is a pure Node.js MCP server that uses:
- **Native platform APIs** for automation (no Electron)
- macOS: `screencapture`, AppleScript, Python/Quartz
- Windows: PowerShell, .NET, user32.dll

## Links

- **Website:** [getservo.app](https://getservo.app)
- **npm:** [npmjs.com/package/servo-mcp](https://www.npmjs.com/package/servo-mcp)
- **GitHub:** [github.com/d11r/getservo](https://github.com/d11r/getservo)

## License

MIT License

## Author

Created by [Dragos Strugar](https://github.com/d11r)
