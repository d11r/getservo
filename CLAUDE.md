# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Servo?

Servo is an MCP (Model Context Protocol) server that gives AI agents the ability to see and control your desktop. It enables Claude Code to take screenshots, click buttons, type text, and verify work - all running locally on macOS or Windows.

**Key points:**
- Free and open source (MIT License)
- Fully local - no telemetry, no cloud, no data sharing
- Built for agentic workflows, primarily verifying software after implementation
- Distributed as an npm package (`servo-mcp`)
- Author: d11r (Dragos Strugar) - github.com/d11r/servo-mcp

## Repository Structure

This is a **pnpm monorepo** containing:

```
servo-mcp/
├── apps/
│   └── web/              # Marketing website (servo-mcp.com) - Next.js 16
├── packages/
│   ├── mcp-server/       # MCP server (npm package: servo-mcp)
│   │   ├── src/          # TypeScript source
│   │   ├── native/       # Native binary source code
│   │   │   ├── macos/    # Swift source for macOS
│   │   │   └── windows/  # C# source for Windows
│   │   └── bin/          # Compiled native binaries
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
pnpm build:mcp        # Build MCP server (native binaries + JS bundle)

# Lint
pnpm lint             # Lint all packages

# Publish to npm
cd packages/mcp-server
npm publish
```

## Website (apps/web)

Next.js 16 with React 19 and Tailwind CSS 4.

**Key files:**
- `app/page.tsx` - Landing page
- `app/globals.css` - Tailwind v4 styles with `@import "tailwindcss"` and `@theme inline`
- `components/` - Reusable components (Hero, Features, Footer, etc.)

**Path alias:** `@/*` maps to project root.

## MCP Server (packages/mcp-server)

Node.js MCP server with native binaries for automation.

**Tech stack:**
- Node.js + @modelcontextprotocol/sdk for MCP protocol
- Swift (macOS) and C# (Windows) native binaries for automation
- esbuild for JS bundling

**Key directories:**
- `src/index.ts` - Entry point
- `src/server.ts` - MCP server setup
- `src/tools.ts` - Tool definitions and handlers
- `src/automation/native.ts` - Native binary wrapper
- `native/macos/` - Swift source for macOS binary
- `native/windows/` - C# source for Windows binary
- `bin/` - Compiled native binaries

### MCP Tools

#### Coordinate-based tools
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

#### Accessibility-based tools (NEW)
| Tool | Description |
|------|-------------|
| `list_ui_elements` | List UI elements (buttons, fields, etc.) with labels and bounds |
| `click_element` | Click element by title/role/identifier (no coordinates needed) |
| `get_element_text` | Read text content from an element |
| `focus_element` | Focus an element (e.g., a text field) |

**Accessibility tools are faster and more reliable** than screenshot + vision for UI automation.

### Claude Code Configuration

After running `npx servo-mcp --setup`, this is added to `~/.claude.json`:
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

### Automation Architecture

The automation layer uses **pre-built native binaries** bundled with the npm package:

**macOS (`native/macos/`):**
- Swift binary using CoreGraphics, AppKit, and Accessibility APIs
- Single binary `servo-helper-darwin-arm64` or `servo-helper-darwin-x64`
- No Python, no AppleScript dependencies

**Windows (`native/windows/`):**
- C# binary using Win32 APIs and UI Automation
- Single binary `servo-helper-win32-x64.exe`
- No PowerShell dependencies at runtime

**Binary communication:**
- Node.js spawns the binary with command-line arguments
- Binary returns JSON to stdout
- Fast, reliable, no intermediate interpreters

### macOS Permissions

On macOS, users must grant permissions to their **terminal app** (Terminal, iTerm, VS Code, Cursor, etc.) - not to servo-mcp itself. Child processes inherit permissions from the parent app.

Required permissions in **System Settings > Privacy & Security**:
- **Accessibility** - for clicking, typing, scrolling, UI element access
- **Screen Recording** - for screenshots

---

## Development

### Running the MCP Server Locally

```bash
# Install dependencies (from repo root)
pnpm install

# Build native binaries first
cd packages/mcp-server
pnpm build:native

# Run in dev mode (uses tsx for hot reload)
pnpm dev

# Or from repo root:
pnpm dev:mcp
```

### Building and Testing Locally

```bash
# Build the package (native + JS)
cd packages/mcp-server
pnpm build

# Link for local testing
npm link

# Test the setup command
servo-mcp --setup

# Or run directly
servo-mcp
```

### Testing Native Binaries

```bash
# Test macOS binary directly
./bin/servo-helper-darwin-arm64 windows
./bin/servo-helper-darwin-arm64 position
./bin/servo-helper-darwin-arm64 list-elements
./bin/servo-helper-darwin-arm64 click-element --title "OK" --role button
```

---

## CI/CD & Releases

### npm Publishing

The release workflow (`.github/workflows/release.yml`) publishes to npm when a version tag is pushed.

**Note:** Native binaries must be built on each platform. The CI workflow builds on macOS and Windows runners.

### Creating a Release

```bash
# 1. Update version in packages/mcp-server/package.json
# 2. Commit all changes
git add -A && git commit -m "Release v0.x.x"

# 3. Create a version tag
git tag v0.x.x

# 4. Push commit and tag
git push origin main --tags
```

The workflow will:
1. Build native binaries on macOS and Windows
2. Build the JS bundle
3. Publish to npm
4. Create a GitHub Release

### Website Deployment

The website (`apps/web`) deploys to Vercel automatically on push to `main`. No manual deployment needed.

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Monorepo structure | Done |
| MCP server (16 tools) | Done |
| macOS native binary (Swift) | Done |
| Windows native binary (C#) | Done |
| Accessibility API support | Done |
| npm package publishing | Done |
| Website (landing page) | Done |
| GitHub Actions CI | Done |

## Verification Checklist

**MCP Server:**
1. Install: `npm install -g servo-mcp`
2. Setup: `npx servo-mcp --setup`
3. Grant permissions to your terminal app (macOS only)
4. Restart Claude Code
5. Test: Ask Claude to take a screenshot
6. Test accessibility: Ask Claude to list UI elements
