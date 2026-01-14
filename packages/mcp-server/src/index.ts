/**
 * Servo MCP Server
 *
 * A pure Node.js MCP server for desktop automation.
 * Provides tools for screenshots, clicking, typing, and window management.
 */

import { startMcpServer } from './server.js'

startMcpServer().catch((error) => {
  console.error('Failed to start MCP server:', error)
  process.exit(1)
})
