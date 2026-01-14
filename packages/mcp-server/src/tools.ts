import { exec } from 'child_process'
import { promisify } from 'util'
import * as automation from './automation/index.js'
import { APP_NAME } from './types.js'

const execAsync = promisify(exec)

// Tool definitions for MCP
export const toolDefinitions = [
  {
    name: 'request_permissions',
    description:
      'Open macOS System Preferences to grant required permissions (Accessibility, Screen Recording, Automation). Call this if you get permission errors.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        permission: {
          type: 'string',
          enum: ['accessibility', 'screen_recording', 'automation', 'all'],
          default: 'all',
          description: 'Which permission to request'
        }
      }
    }
  },
  {
    name: 'screenshot',
    description: 'Capture a screenshot of the entire screen. Returns the image as base64 PNG.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        format: {
          type: 'string',
          enum: ['png', 'jpeg'],
          default: 'png',
          description: 'Image format (currently only png is supported)'
        }
      }
    }
  },
  {
    name: 'click',
    description: 'Click at screen coordinates. Coordinates are in pixels from top-left.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        x: { type: 'number', description: 'X coordinate in pixels' },
        y: { type: 'number', description: 'Y coordinate in pixels' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          default: 'left',
          description: 'Mouse button to click'
        },
        clicks: {
          type: 'number',
          default: 1,
          description: 'Number of clicks (1 for single, 2 for double)'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'type_text',
    description: 'Type text at the current cursor position.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Text to type' }
      },
      required: ['text']
    }
  },
  {
    name: 'key_press',
    description:
      'Press a keyboard key with optional modifiers. For shortcuts like Cmd+S, use modifiers.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        key: {
          type: 'string',
          description: 'Key to press (e.g., "a", "Enter", "Tab", "F1")'
        },
        modifiers: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['ctrl', 'alt', 'shift', 'meta', 'cmd']
          },
          description: 'Modifier keys to hold while pressing'
        }
      },
      required: ['key']
    }
  },
  {
    name: 'scroll',
    description: 'Scroll in a direction at the current mouse position.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        direction: {
          type: 'string',
          enum: ['up', 'down', 'left', 'right'],
          description: 'Direction to scroll'
        },
        amount: {
          type: 'number',
          default: 3,
          description: 'Amount to scroll (in scroll units)'
        }
      },
      required: ['direction']
    }
  },
  {
    name: 'move_mouse',
    description: 'Move the mouse cursor to screen coordinates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        x: { type: 'number', description: 'X coordinate in pixels' },
        y: { type: 'number', description: 'Y coordinate in pixels' }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'get_mouse_position',
    description: 'Get the current mouse cursor position.',
    inputSchema: {
      type: 'object' as const,
      properties: {}
    }
  },
  {
    name: 'focus_app',
    description: 'Bring an application to the foreground.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        app: {
          type: 'string',
          description: 'Application name (e.g., "Safari", "Visual Studio Code", "Chrome")'
        }
      },
      required: ['app']
    }
  },
  {
    name: 'open_app',
    description: 'Launch an application.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        app: {
          type: 'string',
          description: 'Application name or path (e.g., "Safari", "Google Chrome")'
        }
      },
      required: ['app']
    }
  },
  {
    name: 'list_windows',
    description: 'List all open windows with their app names and titles.',
    inputSchema: {
      type: 'object' as const,
      properties: {}
    }
  },
  {
    name: 'wait',
    description: 'Wait for a specified duration before continuing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ms: {
          type: 'number',
          description: 'Milliseconds to wait'
        }
      },
      required: ['ms']
    }
  }
]

interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image'
  data: string
  mimeType: string
}

// Tool call handler
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: (TextContent | ImageContent)[] }> {
  try {
    switch (name) {
      case 'request_permissions': {
        const permission = (args.permission as string) || 'all'

        // Open System Preferences to the appropriate pane
        if (permission === 'accessibility' || permission === 'all') {
          await execAsync(
            'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"'
          )
        }
        if (permission === 'screen_recording' || permission === 'all') {
          await execAsync(
            'open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"'
          )
        }
        if (permission === 'automation' || permission === 'all') {
          await execAsync(
            'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"'
          )
        }

        const instructions = `
System Preferences has been opened. Please:

1. **Accessibility**: Find "${APP_NAME}" (or Terminal/iTerm if running from terminal) in the list and enable it.

2. **Screen Recording**: Find "${APP_NAME}" (or Terminal/iTerm) and enable it.

3. **Automation**: Find "${APP_NAME}" (or Terminal/iTerm) and enable access to "System Events" and other apps you want to control.

After granting permissions, you may need to restart Claude Code for changes to take effect.
`.trim()

        return {
          content: [{ type: 'text', text: instructions }]
        }
      }

      case 'screenshot': {
        const buffer = await automation.screenshot()
        const base64 = buffer.toString('base64')
        return {
          content: [
            {
              type: 'image',
              data: base64,
              mimeType: 'image/png'
            }
          ]
        }
      }

      case 'click': {
        const x = args.x as number
        const y = args.y as number
        const button = (args.button as 'left' | 'right' | 'middle') || 'left'
        const clicks = (args.clicks as number) || 1
        await automation.click(x, y, button, clicks)
        return {
          content: [{ type: 'text', text: `Clicked at (${x}, ${y}) with ${button} button` }]
        }
      }

      case 'type_text': {
        const text = args.text as string
        await automation.typeText(text)
        return {
          content: [{ type: 'text', text: `Typed: "${text}"` }]
        }
      }

      case 'key_press': {
        const key = args.key as string
        const modifiers = (args.modifiers as string[]) || []
        await automation.keyPress(key, modifiers)
        const modStr = modifiers.length > 0 ? `${modifiers.join('+')}+` : ''
        return {
          content: [{ type: 'text', text: `Pressed: ${modStr}${key}` }]
        }
      }

      case 'scroll': {
        const direction = args.direction as 'up' | 'down' | 'left' | 'right'
        const amount = (args.amount as number) || 3
        await automation.scroll(direction, amount)
        return {
          content: [{ type: 'text', text: `Scrolled ${direction} by ${amount}` }]
        }
      }

      case 'move_mouse': {
        const x = args.x as number
        const y = args.y as number
        await automation.moveMouse(x, y)
        return {
          content: [{ type: 'text', text: `Moved mouse to (${x}, ${y})` }]
        }
      }

      case 'get_mouse_position': {
        const pos = await automation.getMousePosition()
        return {
          content: [{ type: 'text', text: JSON.stringify(pos) }]
        }
      }

      case 'focus_app': {
        const app = args.app as string
        await automation.focusApp(app)
        return {
          content: [{ type: 'text', text: `Focused app: ${app}` }]
        }
      }

      case 'open_app': {
        const app = args.app as string
        await automation.openApp(app)
        return {
          content: [{ type: 'text', text: `Opened app: ${app}` }]
        }
      }

      case 'list_windows': {
        const windows = await automation.listWindows()
        return {
          content: [{ type: 'text', text: JSON.stringify(windows, null, 2) }]
        }
      }

      case 'wait': {
        const ms = args.ms as number
        await automation.wait(ms)
        return {
          content: [{ type: 'text', text: `Waited ${ms}ms` }]
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: 'text', text: `Error: ${message}` }]
    }
  }
}
