import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { APP_NAME, VERSION } from './types.js'
import { toolDefinitions, handleToolCall } from './tools.js'

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: APP_NAME.toLowerCase(),
      version: VERSION
    },
    {
      capabilities: {
        tools: {}
      }
    }
  )

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolDefinitions
    }
  })

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    return handleToolCall(name, args || {})
  })

  // Connect via stdio
  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await server.close()
    process.exit(0)
  })
}
