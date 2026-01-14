# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Servo?

Servo is an MCP (Model Context Protocol) server that gives AI agents the ability to see and control your desktop. It enables Claude Code to take screenshots, click buttons, type text, and verify work - all running locally on macOS or Windows.

**Key points:**
- Free and open source (MIT License)
- Fully local - no telemetry, no cloud, no data sharing
- Built for agentic workflows, primarily verifying software after implementation
- Packaged as a macOS .app bundle (using Node.js SEA) for proper permission handling
- Author: d11r (Dragos Strugar) - github.com/d11r/servo

## Repository Structure

This is a **pnpm monorepo** containing:

```
getservo/
├── apps/
│   └── web/              # Marketing website (getservo.app) - Next.js 16
├── packages/
│   ├── mcp-server/       # MCP server (pure Node.js, builds to standalone binary)
│   └── shared/           # Shared constants
├── pnpm-workspace.yaml
└── turbo.json
```

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Run all apps in dev mode
pnpm dev:web          # Run website only (http://localhost:3000)
pnpm dev:mcp          # Run MCP server in dev mode

# Build
pnpm build            # Build all
pnpm build:web        # Build website
pnpm build:mcp        # Build MCP server (bundled JS)
pnpm build:mcp:sea    # Build MCP server as standalone binary (Node.js SEA)
pnpm build:mcp:app    # Build macOS .app bundle

# Lint
pnpm lint             # Lint all packages
```

## Website (apps/web)

Next.js 16 with React 19 and Tailwind CSS 4.

**Key files:**
- `app/page.tsx` - Landing page
- `app/download/page.tsx` - Download page with platform detection
- `app/globals.css` - Tailwind v4 styles with `@import "tailwindcss"` and `@theme inline`
- `components/` - Reusable components (Hero, Features, Footer, etc.)

**Path alias:** `@/*` maps to project root.

## MCP Server (packages/mcp-server)

Pure Node.js MCP server that builds to a standalone binary using Node.js Single Executable Application (SEA) feature, then wrapped in a macOS .app bundle.

**Tech stack:**
- Pure Node.js (no Electron)
- Node.js SEA for standalone binary
- @modelcontextprotocol/sdk for MCP protocol
- esbuild for bundling

**Key directories:**
- `src/index.ts` - Entry point
- `src/server.ts` - MCP server setup
- `src/tools.ts` - Tool definitions and handlers
- `src/automation/` - Platform-specific automation (macOS, Windows)
- `scripts/build-sea.js` - Build standalone binary
- `scripts/build-app.js` - Create macOS .app bundle
- `install-local.sh` - Quick install script

### MCP Tools

| Tool | Description |
|------|-------------|
| `screenshot` | Capture screen (returns base64 image) |
| `click` | Click at x,y (left/right/double) |
| `type_text` | Type text at cursor |
| `key_press` | Press key combo (e.g., Cmd+S) |
| `scroll` | Scroll up/down/left/right |
| `move_mouse` | Move cursor to x,y |
| `get_mouse_position` | Get cursor position |
| `focus_app` | Bring app to foreground |
| `open_app` | Launch application |
| `list_windows` | List open windows |
| `wait` | Wait milliseconds |
| `request_permissions` | Open System Preferences for permissions |

### Claude Code Configuration

Add to `~/.claude.json` or project `.mcp.json`:
```json
{
  "mcpServers": {
    "servo": {
      "command": "/Applications/Servo.app/Contents/MacOS/Servo"
    }
  }
}
```

### Automation Architecture

The automation layer uses **native platform APIs only** (no external dependencies):

**macOS (`src/automation/macos.ts`):**
- Screenshots: `screencapture` CLI (built-in)
- Mouse/keyboard: Python + Quartz CGEventPost (built-in)
- Window management: AppleScript via `osascript`

**Windows (`src/automation/windows.ts`):**
- Screenshots: .NET System.Drawing via PowerShell
- Mouse/keyboard: user32.dll via PowerShell
- Window management: PowerShell + Win32 APIs

### Why a .app Bundle?

macOS requires explicit user permission for:
- **Accessibility** - clicking, typing, scrolling
- **Screen Recording** - screenshots

A proper app bundle appears in System Preferences, allowing users to grant these permissions. The app is built using Node.js SEA (Single Executable Application) which embeds Node.js into a standalone binary.

---

## Development

### Running the MCP Server Locally

```bash
# Install dependencies (from repo root)
pnpm install

# Run in dev mode (uses tsx for hot reload)
pnpm dev:mcp

# Or from packages/mcp-server directly:
cd packages/mcp-server
pnpm dev
```

### Building the .app Bundle

```bash
# Full build process:
pnpm install
pnpm build:mcp          # Bundle with esbuild
pnpm build:mcp:sea      # Create standalone binary with Node.js SEA
pnpm build:mcp:app      # Create .app bundle

# Or all at once from packages/mcp-server:
cd packages/mcp-server
pnpm build && pnpm build:sea && node scripts/build-app.js
```

### Installing the .app

```bash
# Quick install (from packages/mcp-server)
./install-local.sh

# Or manually:
cp -r packages/mcp-server/build/Servo.app /Applications/

# Grant permissions in System Settings > Privacy & Security:
# - Accessibility
# - Screen Recording
# - Automation (for System Events)
```

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Monorepo structure | ✅ Complete |
| MCP server (12 tools) | ✅ Complete |
| macOS automation | ✅ Complete |
| Windows automation | ✅ Complete |
| Node.js SEA build | ✅ Complete |
| .app bundle generator | ✅ Complete |
| Website (landing page) | ✅ Complete |
| GitHub Actions CI | ✅ Complete |
| Code signing & notarization | ⏳ Not started |

## Verification Checklist

**MCP Server:**
1. Build: `pnpm build:mcp && pnpm build:mcp:sea && pnpm build:mcp:app`
2. Install: `cp -r packages/mcp-server/build/Servo.app /Applications/`
3. Grant permissions in System Settings
4. Add to Claude Code config
5. Test: Ask Claude to take a screenshot
