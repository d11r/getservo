# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Servo?

Servo is an MCP (Model Context Protocol) server that gives AI agents the ability to see and control your desktop. It enables Claude Code to take screenshots, click buttons, type text, and verify work - all running locally on macOS or Windows.

**Key points:**
- Free and open source (MIT License)
- Fully local - no telemetry, no cloud, no data sharing
- Built for agentic workflows, primarily verifying software after implementation
- Packaged as a desktop app to handle macOS/Windows permission requirements
- Author: d11r (Dragos Strugar) - github.com/d11r/servo

## Repository Structure

This is a **pnpm monorepo** containing:

```
getservo/
├── apps/
│   ├── web/          # Marketing website (getservo.app) - Next.js 16
│   └── desktop/      # Electron desktop app with MCP server
├── packages/
│   └── shared/       # Shared types and constants
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
pnpm dev:desktop      # Run desktop app only

# Build
pnpm build            # Build all
pnpm build:web        # Build website
pnpm build:desktop    # Build desktop app for current platform

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

## Desktop App (apps/desktop)

Electron app that runs in two modes:
- **GUI Mode** (default): Status window, system tray, permission management
- **MCP Mode** (`--mcp` flag): Headless stdio server for Claude Code

**Tech stack:**
- Electron 28+ with electron-vite
- electron-updater for auto-updates
- @nut-tree/nut-js for cross-platform automation
- @modelcontextprotocol/sdk for MCP protocol

**Key directories:**
- `src/main/` - Electron main process (window, tray, permissions)
- `src/renderer/` - React UI for status/permissions
- `src/mcp/` - MCP server and tool implementations
- `src/mcp/platform/` - macOS and Windows specific code

### MCP Tools

| Tool | Description |
|------|-------------|
| `screenshot` | Capture screen or window (returns base64 image) |
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

### Claude Code Configuration

Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "servo": {
      "command": "/Applications/Servo.app/Contents/MacOS/Servo",
      "args": ["--mcp"]
    }
  }
}
```

### Why a Desktop App?

macOS requires explicit user permission for:
- **Accessibility** - clicking, typing, scrolling
- **Screen Recording** - screenshots

A proper app bundle appears in System Preferences, allowing users to grant these permissions elegantly.

---

# Implementation Plan

## Phases

### Phase 1: Monorepo Setup
1. Move current Next.js app to `apps/web/`
2. Create `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
3. Create `packages/shared/` with types
4. Update root `package.json` with workspace scripts

### Phase 2: Website Update
5. Create landing page components (Hero, Features, Footer)
6. Implement download page with platform detection
7. Update styling and branding
8. Add author credit (d11r / Dragos Strugar)

### Phase 3: Desktop App Foundation
9. Initialize Electron app in `apps/desktop/`
10. Set up electron-vite build config
11. Create main window and system tray
12. Implement permission checking (macOS)
13. Create permission request UI

### Phase 4: MCP Server Implementation
14. Set up MCP SDK with stdio transport
15. Implement core tools: `screenshot`, `click`, `type_text`, `key_press`, `scroll`, `move_mouse`, `get_mouse_position`
16. Implement app tools: `focus_app`, `open_app`, `list_windows`, `wait`

### Phase 5: Platform Implementation
17. macOS automation (screencapture, Accessibility API)
18. Windows automation (Win32 APIs / robotjs)

### Phase 6: Build & Release
19. Configure electron-builder for both platforms
20. Set up GitHub Actions for releases
21. macOS code signing and notarization
22. Configure electron-updater for auto-updates

## Website Content

**Landing page sections:**
1. Hero - "Give AI the ability to see and control your desktop"
2. How It Works (3 steps)
3. Features Grid
4. Open Source Banner - "100% local, no telemetry, no cloud"
5. Quick Setup code snippet
6. Footer with GitHub link

**Download page:**
- Auto-detect platform (Mac Intel/ARM, Windows)
- Setup instructions with Claude Code config

## Configuration

- **Package manager**: pnpm
- **Code signing**: Apple Developer account available
- **GitHub**: d11r/servo
- **Auto-update**: Yes, via electron-updater

## Verification

**Test MCP:** Build desktop app → Add to Claude Code config → Ask Claude to take screenshot

**Test Website:** Run `pnpm dev:web` → Check landing page → Test platform detection

**Test Desktop:** Open in GUI mode → Check permissions → Grant permissions → Verify tray works
