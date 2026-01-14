/**
 * Windows automation implementation using native APIs.
 *
 * Uses:
 * - PowerShell for screenshots, window management
 * - .NET interop for mouse and keyboard via PowerShell
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { PlatformAutomation } from './types.js'
import type { MousePosition, ScrollDirection, WindowInfo } from '../types.js'

const execAsync = promisify(exec)

/**
 * Execute PowerShell command.
 */
async function runPowerShell(script: string): Promise<string> {
  // Use -NoProfile for faster startup, -NonInteractive for headless
  const { stdout } = await execAsync(
    `powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '\\"')}"`
  )
  return stdout.trim()
}

export const windows: PlatformAutomation = {
  async screenshot(): Promise<Buffer> {
    const tempPath = join(tmpdir(), `servo-screenshot-${Date.now()}.png`)

    try {
      // Use .NET to capture screen
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen
        $bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
        $bitmap.Save('${tempPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics.Dispose()
        $bitmap.Dispose()
      `
      await runPowerShell(script)
      const buffer = await readFile(tempPath)
      return buffer
    } finally {
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
    // Use user32.dll via PowerShell for mouse control
    const clickEvents = Array(clicks)
      .fill(null)
      .map(() => {
        if (button === 'right') {
          return `[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0); [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)`
        } else if (button === 'middle') {
          return `[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0); [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0)`
        } else {
          return `[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0); [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)`
        }
      })
      .join('; Start-Sleep -Milliseconds 10; ')

    const script = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern bool SetCursorPos(int X, int Y);
          [DllImport("user32.dll")]
          public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
          public const uint MOUSEEVENTF_LEFTDOWN = 0x02;
          public const uint MOUSEEVENTF_LEFTUP = 0x04;
          public const uint MOUSEEVENTF_RIGHTDOWN = 0x08;
          public const uint MOUSEEVENTF_RIGHTUP = 0x10;
          public const uint MOUSEEVENTF_MIDDLEDOWN = 0x20;
          public const uint MOUSEEVENTF_MIDDLEUP = 0x40;
        }
'@
      [Mouse]::SetCursorPos(${Math.round(x)}, ${Math.round(y)})
      Start-Sleep -Milliseconds 10
      ${clickEvents}
    `
    await runPowerShell(script)
  },

  async typeText(text: string): Promise<void> {
    // Use SendKeys for typing
    const escapedText = text
      .replace(/[+^%~(){}[\]]/g, '{$&}') // Escape special SendKeys characters
      .replace(/\n/g, '{ENTER}')

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait('${escapedText.replace(/'/g, "''")}')
    `
    await runPowerShell(script)
  },

  async keyPress(key: string, modifiers: string[] = []): Promise<void> {
    // Map keys to SendKeys format
    const keyMap: Record<string, string> = {
      enter: '{ENTER}',
      return: '{ENTER}',
      tab: '{TAB}',
      space: ' ',
      backspace: '{BACKSPACE}',
      delete: '{DELETE}',
      escape: '{ESC}',
      esc: '{ESC}',
      up: '{UP}',
      down: '{DOWN}',
      left: '{LEFT}',
      right: '{RIGHT}',
      home: '{HOME}',
      end: '{END}',
      pageup: '{PGUP}',
      pagedown: '{PGDN}',
      f1: '{F1}',
      f2: '{F2}',
      f3: '{F3}',
      f4: '{F4}',
      f5: '{F5}',
      f6: '{F6}',
      f7: '{F7}',
      f8: '{F8}',
      f9: '{F9}',
      f10: '{F10}',
      f11: '{F11}',
      f12: '{F12}'
    }

    const lowerKey = key.toLowerCase()
    let sendKey = keyMap[lowerKey] || key

    // Add modifiers
    const modifierPrefix = modifiers
      .map((m) => {
        const lower = m.toLowerCase()
        if (lower === 'ctrl' || lower === 'control') return '^'
        if (lower === 'alt' || lower === 'option') return '%'
        if (lower === 'shift') return '+'
        if (lower === 'meta' || lower === 'cmd' || lower === 'win') return '^{ESC}' // Win key is complex
        return ''
      })
      .join('')

    // Wrap in parentheses if using modifiers
    if (modifierPrefix) {
      sendKey = `${modifierPrefix}(${sendKey})`
    }

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait('${sendKey.replace(/'/g, "''")}')
    `
    await runPowerShell(script)
  },

  async scroll(direction: ScrollDirection, amount = 3): Promise<void> {
    // Use mouse_event for scrolling
    const wheelDelta = (direction === 'up' ? 1 : direction === 'down' ? -1 : 0) * 120 * amount

    if (direction === 'up' || direction === 'down') {
      const script = `
        Add-Type -TypeDefinition @'
          using System;
          using System.Runtime.InteropServices;
          public class Mouse {
            [DllImport("user32.dll")]
            public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
            public const uint MOUSEEVENTF_WHEEL = 0x0800;
          }
'@
        [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_WHEEL, 0, 0, ${wheelDelta}, 0)
      `
      await runPowerShell(script)
    } else {
      // Horizontal scroll
      const hWheelDelta = (direction === 'left' ? -1 : 1) * 120 * amount
      const script = `
        Add-Type -TypeDefinition @'
          using System;
          using System.Runtime.InteropServices;
          public class Mouse {
            [DllImport("user32.dll")]
            public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
            public const uint MOUSEEVENTF_HWHEEL = 0x1000;
          }
'@
        [Mouse]::mouse_event([Mouse]::MOUSEEVENTF_HWHEEL, 0, 0, ${hWheelDelta}, 0)
      `
      await runPowerShell(script)
    }
  },

  async moveMouse(x: number, y: number): Promise<void> {
    const script = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern bool SetCursorPos(int X, int Y);
        }
'@
      [Mouse]::SetCursorPos(${Math.round(x)}, ${Math.round(y)})
    `
    await runPowerShell(script)
  },

  async getMousePosition(): Promise<MousePosition> {
    const script = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")]
          public static extern bool GetCursorPos(out POINT lpPoint);
          [StructLayout(LayoutKind.Sequential)]
          public struct POINT { public int X; public int Y; }
        }
'@
      $point = New-Object Mouse+POINT
      [Mouse]::GetCursorPos([ref]$point) | Out-Null
      Write-Output "$($point.X) $($point.Y)"
    `
    const result = await runPowerShell(script)
    const [x, y] = result.split(' ').map(Number)
    return { x, y }
  },

  async focusApp(appName: string): Promise<void> {
    const script = `
      $proc = Get-Process -Name "${appName}" -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($proc) {
        Add-Type -TypeDefinition @'
          using System;
          using System.Runtime.InteropServices;
          public class Window {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          }
'@
        [Window]::ShowWindow($proc.MainWindowHandle, 9) | Out-Null
        [Window]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
      }
    `
    await runPowerShell(script)
  },

  async openApp(appName: string): Promise<void> {
    await execAsync(`start "" "${appName}"`)
  },

  async listWindows(): Promise<WindowInfo[]> {
    const script = `
      Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class Window {
          [DllImport("user32.dll")]
          public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
          [StructLayout(LayoutKind.Sequential)]
          public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        }
'@
      Get-Process | Where-Object { $_.MainWindowTitle } | ForEach-Object {
        $rect = New-Object Window+RECT
        [Window]::GetWindowRect($_.MainWindowHandle, [ref]$rect) | Out-Null
        $width = $rect.Right - $rect.Left
        $height = $rect.Bottom - $rect.Top
        "$($_.ProcessName)|$($_.MainWindowTitle)|$($rect.Left)|$($rect.Top)|$width|$height"
      }
    `

    try {
      const result = await runPowerShell(script)
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
