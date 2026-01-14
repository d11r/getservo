import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

/**
 * Platform automation interface.
 * Each platform (macOS, Windows) implements this interface.
 */
export interface PlatformAutomation {
  /** Capture a screenshot of the entire screen */
  screenshot(): Promise<Buffer>

  /** Click at screen coordinates */
  click(x: number, y: number, button?: 'left' | 'right' | 'middle', clicks?: number): Promise<void>

  /** Type text at the current cursor position */
  typeText(text: string): Promise<void>

  /** Press a key with optional modifiers */
  keyPress(key: string, modifiers?: string[]): Promise<void>

  /** Scroll in a direction */
  scroll(direction: ScrollDirection, amount?: number): Promise<void>

  /** Move the mouse cursor to coordinates */
  moveMouse(x: number, y: number): Promise<void>

  /** Get the current mouse position */
  getMousePosition(): Promise<MousePosition>

  /** Focus an application by name */
  focusApp(appName: string): Promise<void>

  /** Open/launch an application */
  openApp(appName: string): Promise<void>

  /** List all open windows */
  listWindows(): Promise<WindowInfo[]>

  /** Wait for a specified duration */
  wait(ms: number): Promise<void>
}
