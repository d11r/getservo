/**
 * Platform automation abstraction layer.
 *
 * Provides a unified API for desktop automation across platforms.
 * Automatically selects the appropriate implementation based on the current platform.
 */

import { platform } from 'os'
import type { PlatformAutomation } from './types.js'
import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

// Lazy load platform implementations to avoid loading unnecessary code
let platformImpl: PlatformAutomation | null = null

async function getPlatform(): Promise<PlatformAutomation> {
  if (platformImpl) {
    return platformImpl
  }

  const currentPlatform = platform()

  if (currentPlatform === 'darwin') {
    const { macos } = await import('./macos.js')
    platformImpl = macos
  } else if (currentPlatform === 'win32') {
    const { windows } = await import('./windows.js')
    platformImpl = windows
  } else {
    throw new Error(`Unsupported platform: ${currentPlatform}. Servo only supports macOS and Windows.`)
  }

  return platformImpl
}

// Export unified API

export async function screenshot(): Promise<Buffer> {
  const impl = await getPlatform()
  return impl.screenshot()
}

export async function click(
  x: number,
  y: number,
  button: 'left' | 'right' | 'middle' = 'left',
  clicks = 1
): Promise<void> {
  const impl = await getPlatform()
  return impl.click(x, y, button, clicks)
}

export async function typeText(text: string): Promise<void> {
  const impl = await getPlatform()
  return impl.typeText(text)
}

export async function keyPress(key: string, modifiers: string[] = []): Promise<void> {
  const impl = await getPlatform()
  return impl.keyPress(key, modifiers)
}

export async function scroll(direction: ScrollDirection, amount = 3): Promise<void> {
  const impl = await getPlatform()
  return impl.scroll(direction, amount)
}

export async function moveMouse(x: number, y: number): Promise<void> {
  const impl = await getPlatform()
  return impl.moveMouse(x, y)
}

export async function getMousePosition(): Promise<MousePosition> {
  const impl = await getPlatform()
  return impl.getMousePosition()
}

export async function focusApp(appName: string): Promise<void> {
  const impl = await getPlatform()
  return impl.focusApp(appName)
}

export async function openApp(appName: string): Promise<void> {
  const impl = await getPlatform()
  return impl.openApp(appName)
}

export async function listWindows(): Promise<WindowInfo[]> {
  const impl = await getPlatform()
  return impl.listWindows()
}

export async function wait(ms: number): Promise<void> {
  const impl = await getPlatform()
  return impl.wait(ms)
}

// Re-export types
export type { PlatformAutomation } from './types.js'
