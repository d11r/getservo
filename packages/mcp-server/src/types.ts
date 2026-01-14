// Shared types for Servo MCP server

export interface ClickOptions {
  button?: 'left' | 'right' | 'middle'
  clicks?: number
}

export interface ScreenshotOptions {
  windowTitle?: string
  format?: 'png' | 'jpeg'
}

export interface WindowInfo {
  app: string
  title: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  focused: boolean
}

export interface PermissionStatus {
  accessibility: boolean
  screenRecording: boolean
}

export interface MousePosition {
  x: number
  y: number
}

export type ScrollDirection = 'up' | 'down' | 'left' | 'right'

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta' | 'cmd'

// Constants
export const APP_NAME = 'servo-mcp'
export const APP_ID = 'com.servo-mcp'
export const VERSION = '0.3.5'
