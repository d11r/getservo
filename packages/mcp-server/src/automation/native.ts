/**
 * Native automation implementation using pre-built binaries.
 *
 * Uses servo-helper binary for all automation tasks:
 * - macOS: Swift binary using CoreGraphics and Accessibility APIs
 * - Windows: C# binary using Win32 and UI Automation APIs
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { platform, arch } from 'os'
import type { PlatformAutomation } from './types.js'
import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

const execFileAsync = promisify(execFile)

interface NativeResult {
  success: boolean
  data?: unknown
  error?: string
}

interface UIElement {
  role: string
  title: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  identifier?: string
  description?: string
  value?: string
  enabled?: boolean
}

/**
 * Get the path to the servo-helper binary for the current platform.
 */
function getBinaryPath(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const binDir = join(__dirname, '..', 'bin')

  const os = platform()
  const architecture = arch()

  let binaryName: string

  if (os === 'darwin') {
    binaryName = architecture === 'arm64' ? 'servo-helper-darwin-arm64' : 'servo-helper-darwin-x64'
  } else if (os === 'win32') {
    binaryName = 'servo-helper-win32-x64.exe'
  } else {
    throw new Error(`Unsupported platform: ${os}`)
  }

  const binaryPath = join(binDir, binaryName)

  // Fallback to native directory during development
  if (!existsSync(binaryPath)) {
    const devPath =
      os === 'darwin'
        ? join(__dirname, '..', 'native', 'macos', 'servo-helper')
        : join(__dirname, '..', 'native', 'windows', 'bin', 'Release', 'net6.0', 'win-x64', 'servo-helper.exe')

    if (existsSync(devPath)) {
      return devPath
    }

    throw new Error(`Binary not found: ${binaryPath}`)
  }

  return binaryPath
}

/**
 * Execute a command using the servo-helper binary.
 */
async function runHelper(command: string, ...args: string[]): Promise<NativeResult> {
  const binaryPath = getBinaryPath()

  try {
    const { stdout } = await execFileAsync(binaryPath, [command, ...args])
    return JSON.parse(stdout.trim()) as NativeResult
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

/**
 * Native automation implementation.
 */
export const native: PlatformAutomation = {
  async screenshot(): Promise<Buffer> {
    const result = await runHelper('screenshot')

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Screenshot failed')
    }

    const data = result.data as { base64: string }
    return Buffer.from(data.base64, 'base64')
  },

  async click(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left', clicks = 1): Promise<void> {
    const result = await runHelper('click', String(Math.round(x)), String(Math.round(y)), button, String(clicks))

    if (!result.success) {
      throw new Error(result.error || 'Click failed')
    }
  },

  async typeText(text: string): Promise<void> {
    const result = await runHelper('type', text)

    if (!result.success) {
      throw new Error(result.error || 'Type failed')
    }
  },

  async keyPress(key: string, modifiers: string[] = []): Promise<void> {
    const result = await runHelper('key', key, ...modifiers)

    if (!result.success) {
      throw new Error(result.error || 'Key press failed')
    }
  },

  async scroll(direction: ScrollDirection, amount = 3): Promise<void> {
    const result = await runHelper('scroll', direction, String(amount))

    if (!result.success) {
      throw new Error(result.error || 'Scroll failed')
    }
  },

  async moveMouse(x: number, y: number): Promise<void> {
    const result = await runHelper('move', String(Math.round(x)), String(Math.round(y)))

    if (!result.success) {
      throw new Error(result.error || 'Move mouse failed')
    }
  },

  async getMousePosition(): Promise<MousePosition> {
    const result = await runHelper('position')

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Get mouse position failed')
    }

    return result.data as MousePosition
  },

  async focusApp(appName: string): Promise<void> {
    const result = await runHelper('focus-app', appName)

    if (!result.success) {
      throw new Error(result.error || 'Focus app failed')
    }
  },

  async openApp(appName: string): Promise<void> {
    const result = await runHelper('open-app', appName)

    if (!result.success) {
      throw new Error(result.error || 'Open app failed')
    }
  },

  async listWindows(): Promise<WindowInfo[]> {
    const result = await runHelper('windows')

    if (!result.success || !result.data) {
      throw new Error(result.error || 'List windows failed')
    }

    return result.data as WindowInfo[]
  },

  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Accessibility-based automation functions.
 */
export const accessibility = {
  /**
   * List UI elements in the frontmost app or a specific app.
   */
  async listElements(options?: { appName?: string; role?: string }): Promise<UIElement[]> {
    const args: string[] = []
    if (options?.appName) {
      args.push('--app', options.appName)
    }
    if (options?.role) {
      args.push('--role', options.role)
    }

    const result = await runHelper('list-elements', ...args)

    if (!result.success) {
      throw new Error(result.error || 'List elements failed')
    }

    return (result.data as UIElement[]) || []
  },

  /**
   * Click a UI element by title, role, or identifier.
   */
  async clickElement(options: { title?: string; role?: string; identifier?: string }): Promise<void> {
    const args: string[] = []
    if (options.title) {
      args.push('--title', options.title)
    }
    if (options.role) {
      args.push('--role', options.role)
    }
    if (options.identifier) {
      args.push('--id', options.identifier)
    }

    const result = await runHelper('click-element', ...args)

    if (!result.success) {
      throw new Error(result.error || 'Click element failed')
    }
  },

  /**
   * Get the text content of a UI element.
   */
  async getElementText(options: { title?: string; role?: string; identifier?: string }): Promise<string> {
    const args: string[] = []
    if (options.title) {
      args.push('--title', options.title)
    }
    if (options.role) {
      args.push('--role', options.role)
    }
    if (options.identifier) {
      args.push('--id', options.identifier)
    }

    const result = await runHelper('get-text', ...args)

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Get element text failed')
    }

    return (result.data as { text: string }).text
  },

  /**
   * Focus a UI element by title, role, or identifier.
   */
  async focusElement(options: { title?: string; role?: string; identifier?: string }): Promise<void> {
    const args: string[] = []
    if (options.title) {
      args.push('--title', options.title)
    }
    if (options.role) {
      args.push('--role', options.role)
    }
    if (options.identifier) {
      args.push('--id', options.identifier)
    }

    const result = await runHelper('focus-element', ...args)

    if (!result.success) {
      throw new Error(result.error || 'Focus element failed')
    }
  }
}
