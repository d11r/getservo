/**
 * Setup command for servo-mcp
 *
 * Configures Claude Code to use servo-mcp as an MCP server.
 * Run with: npx servo-mcp --setup
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

interface ClaudeConfig {
  mcpServers?: Record<string, { command: string; args?: string[] }>
  [key: string]: unknown
}

export async function runSetup(): Promise<void> {
  const platform = os.platform()
  const configPath = path.join(os.homedir(), '.claude.json')

  // Use npx to run servo-mcp - works for both global and local installs
  const command = 'npx'
  const args = ['servo-mcp']

  // Read existing config or create new
  let config: ClaudeConfig = {}
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8')
      config = JSON.parse(content)
    } catch {
      // Invalid JSON - backup and start fresh
      const backupPath = `${configPath}.backup`
      fs.copyFileSync(configPath, backupPath)
      console.log(`Backed up existing config to: ${backupPath}`)
    }
  }

  // Add/update MCP server config
  if (!config.mcpServers) {
    config.mcpServers = {}
  }
  config.mcpServers.servo = {
    command,
    args
  }

  // Write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')

  // Print success message
  console.log('')
  console.log('\x1b[32m%s\x1b[0m', 'servo-mcp configured for Claude Code!')
  console.log('')

  if (platform === 'darwin') {
    console.log('\x1b[1mIMPORTANT: Grant permissions to your terminal app\x1b[0m')
    console.log('')
    console.log('Open System Settings > Privacy & Security and enable your terminal')
    console.log('(Terminal, iTerm, VS Code, Cursor, etc.) for:')
    console.log('')
    console.log('  1. \x1b[1mAccessibility\x1b[0m - allows clicking and typing')
    console.log('  2. \x1b[1mScreen Recording\x1b[0m - allows screenshots')
    console.log('')
    console.log('Child processes (like servo-mcp) inherit permissions from the parent app.')
    console.log('')
    console.log('Then restart Claude Code and test with: "take a screenshot"')
    console.log('')
  } else if (platform === 'win32') {
    console.log('Next steps:')
    console.log('')
    console.log('1. Restart Claude Code')
    console.log('')
    console.log('2. Test with: "take a screenshot"')
    console.log('')
    console.log('Note: Windows may prompt for permissions when servo-mcp runs.')
    console.log('')
  } else {
    console.log('Next steps:')
    console.log('')
    console.log('1. Restart Claude Code')
    console.log('')
    console.log('2. Test with: "take a screenshot"')
    console.log('')
  }
}
