/**
 * macOS automation implementation using native APIs.
 *
 * Uses:
 * - screencapture CLI for screenshots
 * - AppleScript via osascript for mouse, keyboard, and window management
 * - System Events for UI automation
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { PlatformAutomation } from './types.js'
import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

const execFileAsync = promisify(execFile)

/**
 * Execute AppleScript code.
 */
async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execFileAsync('osascript', ['-e', script])
  return stdout.trim()
}

export const macos: PlatformAutomation = {
  async screenshot(): Promise<Buffer> {
    const tempPath = join(tmpdir(), `servo-screenshot-${Date.now()}.png`)

    try {
      // -x: no sound, -t png: format
      await execFileAsync('screencapture', ['-x', '-t', 'png', tempPath])
      const buffer = await readFile(tempPath)
      return buffer
    } finally {
      // Clean up temp file
      try {
        await unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  },

  async click(
    x: number,
    y: number,
    button: 'left' | 'right' | 'middle' = 'left',
    clicks = 1
  ): Promise<void> {
    // Use AppleScript with System Events for clicking
    // Note: This requires Accessibility permission
    const clickType = button === 'right' ? 'right' : 'left'

    // First move the mouse, then click
    const script = `
      tell application "System Events"
        set mousePosition to {${Math.round(x)}, ${Math.round(y)}}
        do shell script "
          /usr/bin/python3 -c '
import Quartz
import time

def click(x, y, button, clicks):
    # Move mouse
    move = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, (x, y), 0)
    Quartz.CGEventPost(Quartz.kCGHIDEventTap, move)
    time.sleep(0.01)

    # Determine button type
    if button == \"right\":
        down_type = Quartz.kCGEventRightMouseDown
        up_type = Quartz.kCGEventRightMouseUp
        btn = Quartz.kCGMouseButtonRight
    else:
        down_type = Quartz.kCGEventLeftMouseDown
        up_type = Quartz.kCGEventLeftMouseUp
        btn = Quartz.kCGMouseButtonLeft

    for _ in range(clicks):
        down = Quartz.CGEventCreateMouseEvent(None, down_type, (x, y), btn)
        up = Quartz.CGEventCreateMouseEvent(None, up_type, (x, y), btn)
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, down)
        Quartz.CGEventPost(Quartz.kCGHIDEventTap, up)
        time.sleep(0.01)

click(${x}, ${y}, \"${clickType}\", ${clicks})
'"
      end tell
    `
    await runAppleScript(script)
  },

  async typeText(text: string): Promise<void> {
    // Escape special characters for AppleScript
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')

    const script = `
      tell application "System Events"
        keystroke "${escapedText}"
      end tell
    `
    await runAppleScript(script)
  },

  async keyPress(key: string, modifiers: string[] = []): Promise<void> {
    // Map modifiers to AppleScript format
    const modifierMap: Record<string, string> = {
      cmd: 'command down',
      command: 'command down',
      meta: 'command down',
      ctrl: 'control down',
      control: 'control down',
      alt: 'option down',
      option: 'option down',
      shift: 'shift down'
    }

    // Map special keys to key codes
    const keyCodeMap: Record<string, number> = {
      return: 36,
      enter: 36,
      tab: 48,
      space: 49,
      delete: 51,
      backspace: 51,
      escape: 53,
      esc: 53,
      left: 123,
      right: 124,
      down: 125,
      up: 126,
      f1: 122,
      f2: 120,
      f3: 99,
      f4: 118,
      f5: 96,
      f6: 97,
      f7: 98,
      f8: 100,
      f9: 101,
      f10: 109,
      f11: 103,
      f12: 111
    }

    const modifierStr = modifiers
      .map((m) => modifierMap[m.toLowerCase()])
      .filter(Boolean)
      .join(', ')

    const lowerKey = key.toLowerCase()

    let script: string
    if (keyCodeMap[lowerKey] !== undefined) {
      // Use key code for special keys
      const keyCode = keyCodeMap[lowerKey]
      script = modifierStr
        ? `tell application "System Events" to key code ${keyCode} using {${modifierStr}}`
        : `tell application "System Events" to key code ${keyCode}`
    } else {
      // Use keystroke for regular characters
      script = modifierStr
        ? `tell application "System Events" to keystroke "${key}" using {${modifierStr}}`
        : `tell application "System Events" to keystroke "${key}"`
    }

    await runAppleScript(script)
  },

  async scroll(direction: ScrollDirection, amount = 3): Promise<void> {
    // Use Python with Quartz for scrolling
    const deltaY = direction === 'up' ? amount * 10 : direction === 'down' ? -amount * 10 : 0
    const deltaX = direction === 'left' ? amount * 10 : direction === 'right' ? -amount * 10 : 0

    const script = `
      do shell script "
        /usr/bin/python3 -c '
import Quartz

scroll = Quartz.CGEventCreateScrollWheelEvent(None, Quartz.kCGScrollEventUnitLine, 2, ${deltaY}, ${deltaX})
Quartz.CGEventPost(Quartz.kCGHIDEventTap, scroll)
'"
    `
    await runAppleScript(script)
  },

  async moveMouse(x: number, y: number): Promise<void> {
    const script = `
      do shell script "
        /usr/bin/python3 -c '
import Quartz

move = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, (${x}, ${y}), 0)
Quartz.CGEventPost(Quartz.kCGHIDEventTap, move)
'"
    `
    await runAppleScript(script)
  },

  async getMousePosition(): Promise<MousePosition> {
    const script = `
      do shell script "
        /usr/bin/python3 -c '
import Quartz
loc = Quartz.NSEvent.mouseLocation()
# Convert from bottom-left to top-left coordinate system
screen_height = Quartz.CGDisplayPixelsHigh(Quartz.CGMainDisplayID())
print(int(loc.x), int(screen_height - loc.y))
'"
    `
    const result = await runAppleScript(script)
    const [x, y] = result.split(' ').map(Number)
    return { x, y }
  },

  async focusApp(appName: string): Promise<void> {
    const script = `tell application "${appName}" to activate`
    await runAppleScript(script)
  },

  async openApp(appName: string): Promise<void> {
    await execFileAsync('open', ['-a', appName])
  },

  async listWindows(): Promise<WindowInfo[]> {
    const script = `
      set output to ""
      tell application "System Events"
        repeat with proc in (every process whose background only is false)
          set procName to name of proc
          try
            repeat with win in (every window of proc)
              set winTitle to name of win
              set winPos to position of win
              set winSize to size of win
              set output to output & procName & "|" & winTitle & "|" & (item 1 of winPos) & "|" & (item 2 of winPos) & "|" & (item 1 of winSize) & "|" & (item 2 of winSize) & "\\n"
            end repeat
          end try
        end repeat
      end tell
      return output
    `

    try {
      const result = await runAppleScript(script)
      const lines = result.split('\n').filter((line) => line.trim())

      return lines.map((line) => {
        const [app, title, x, y, width, height] = line.split('|')
        return {
          app: app || '',
          title: title || '',
          bounds: {
            x: parseInt(x) || 0,
            y: parseInt(y) || 0,
            width: parseInt(width) || 0,
            height: parseInt(height) || 0
          },
          focused: false
        }
      })
    } catch {
      return []
    }
  },

  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
