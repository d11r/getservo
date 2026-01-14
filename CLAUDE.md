# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Servo?

Servo is an MCP (Model Context Protocol) server that gives AI agents the ability to see and control your desktop. It enables Claude Code to take screenshots, click buttons, type text, and verify work - all running locally on macOS or Windows.

**Key points:**
- Free and open source (MIT License)
- Fully local - no telemetry, no cloud, no data sharing
- Built for agentic workflows, primarily verifying software after implementation
- Distributed as an npm package (`servo-mcp`)
- Author: d11r (Dragos Strugar) - github.com/d11r/servo

## Repository Structure

This is a **pnpm monorepo** containing:

```
getservo/
├── apps/
│   └── web/              # Marketing website (getservo.app) - Next.js 16
├── packages/
│   ├── mcp-server/       # MCP server (npm package: servo-mcp)
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
pnpm build:mcp        # Build MCP server (bundled JS for npm)

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
- `app/download/page.tsx` - Installation page (npm instructions)
- `app/globals.css` - Tailwind v4 styles with `@import "tailwindcss"` and `@theme inline`
- `components/` - Reusable components (Hero, Features, Footer, etc.)

**Path alias:** `@/*` maps to project root.

## MCP Server (packages/mcp-server)

Pure Node.js MCP server distributed as an npm package.

**Tech stack:**
- Pure Node.js (no Electron)
- @modelcontextprotocol/sdk for MCP protocol
- esbuild for bundling

**Key directories:**
- `src/index.ts` - Entry point
- `src/server.ts` - MCP server setup
- `src/tools.ts` - Tool definitions and handlers
- `src/automation/` - Platform-specific automation (macOS, Windows)

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

The automation layer uses **native platform APIs only** (no external dependencies):

**macOS (`src/automation/macos.ts`):**
- Screenshots: `screencapture` CLI (built-in)
- Mouse/keyboard: Python + Quartz CGEventPost (built-in)
- Window management: AppleScript via `osascript`

**Windows (`src/automation/windows.ts`):**
- Screenshots: .NET System.Drawing via PowerShell
- Mouse/keyboard: user32.dll via PowerShell
- Window management: PowerShell + Win32 APIs

### macOS Permissions

On macOS, users must grant permissions to their **terminal app** (Terminal, iTerm, VS Code, Cursor, etc.) - not to servo-mcp itself. Child processes inherit permissions from the parent app.

Required permissions in **System Settings > Privacy & Security**:
- **Accessibility** - for clicking, typing, scrolling
- **Screen Recording** - for screenshots

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

### Building and Testing Locally

```bash
# Build the package
cd packages/mcp-server
pnpm build

# Link for local testing
npm link

# Test the setup command
servo-mcp --setup

# Or run directly
servo-mcp
```

---

## CI/CD & Releases

### npm Publishing

The release workflow (`.github/workflows/release.yml`) publishes to npm when a version tag is pushed.

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
1. Build the package
2. Publish to npm
3. Create a GitHub Release

### Website Deployment

The website (`apps/web`) deploys to Vercel automatically on push to `main`. No manual deployment needed.

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Monorepo structure | Done |
| MCP server (12 tools) | Done |
| macOS automation | Done |
| Windows automation | Done |
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
