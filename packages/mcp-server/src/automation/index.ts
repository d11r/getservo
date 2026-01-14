/**
 * Platform automation abstraction layer.
 *
 * Uses native pre-built binaries for all automation tasks.
 * Provides both coordinate-based and accessibility-based automation.
 */

import { native, accessibility } from './native.js'
import type { PlatformAutomation } from './types.js'
import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

// Export unified API using native implementation

export async function screenshot(): Promise<Buffer> {
  return native.screenshot()
}

export async function click(
  x: number,
  y: number,
  button: 'left' | 'right' | 'middle' = 'left',
  clicks = 1
): Promise<void> {
  return native.click(x, y, button, clicks)
}

export async function typeText(text: string): Promise<void> {
  return native.typeText(text)
}

export async function keyPress(key: string, modifiers: string[] = []): Promise<void> {
  return native.keyPress(key, modifiers)
}

export async function scroll(direction: ScrollDirection, amount = 3): Promise<void> {
  return native.scroll(direction, amount)
}

export async function moveMouse(x: number, y: number): Promise<void> {
  return native.moveMouse(x, y)
}

export async function getMousePosition(): Promise<MousePosition> {
  return native.getMousePosition()
}

export async function focusApp(appName: string): Promise<void> {
  return native.focusApp(appName)
}

export async function openApp(appName: string): Promise<void> {
  return native.openApp(appName)
}

export async function listWindows(): Promise<WindowInfo[]> {
  return native.listWindows()
}

export async function wait(ms: number): Promise<void> {
  return native.wait(ms)
}

// Export accessibility-based automation
export { accessibility }

// Export types
export type { PlatformAutomation } from './types.js'

// UI Element type for accessibility
export interface UIElement {
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
