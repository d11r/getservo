# Servo

A desktop MCP server that gives AI agents the ability to see and control your desktop.

**[getservo.app](https://getservo.app)** - Download, documentation, and more info

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
- Simple setup with Claude Code

## Installation

Download the latest release from **[getservo.app/download](https://getservo.app/download)**

Or build from source:
```bash
pnpm install
pnpm build:mcp:sea    # Build standalone binary
pnpm build:mcp:app    # Create .app bundle
cp -r packages/mcp-server/build/Servo.app /Applications/
```

After installing, grant the required permissions (macOS only):
- **Accessibility** - for mouse clicks and keyboard input
- **Screen Recording** - for taking screenshots
- **Automation** - for controlling System Events

## Setup with Claude Code

Add to your `~/.claude.json` or project `.mcp.json`:

```json
{
  "mcpServers": {
    "servo": {
      "command": "/Applications/Servo.app/Contents/MacOS/Servo"
    }
  }
}
```

For Windows:
```json
{
  "mcpServers": {
    "servo": {
      "command": "C:\\Program Files\\Servo\\Servo.exe"
    }
  }
}
```

See **[getservo.app](https://getservo.app)** for detailed setup instructions.

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
pnpm build:mcp:sea    # Build standalone binary (Node.js SEA)
pnpm build:mcp:app    # Create macOS .app bundle
```

## Architecture

Servo is a pure Node.js MCP server that uses:
- **Node.js SEA** (Single Executable Application) to create a standalone binary
- **Native platform APIs** for automation (no Electron)
- macOS: `screencapture`, AppleScript, Python/Quartz
- Windows: PowerShell, .NET, user32.dll

The .app bundle is required on macOS for proper permission handling in System Preferences.

## Links

- **Website:** [getservo.app](https://getservo.app)
- **Download:** [getservo.app/download](https://getservo.app/download)
- **GitHub:** [github.com/d11r/getservo](https://github.com/d11r/getservo)

## License

MIT License

## Author

Created by [Dragos Strugar](https://github.com/d11r)
