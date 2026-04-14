import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpTool, ScanContext } from '../tools/types';
import { owaspCheckTools } from '../tools';

@Injectable()
export class McpServerService implements OnModuleInit, OnModuleDestroy {
  private server: Server;
  private tools = new Map<string, McpTool>();

  public clientTransport: InMemoryTransport;
  private serverTransport: InMemoryTransport;

  constructor() {
    this.server = new Server(
      {
        name: 'aegiscode-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    this.clientTransport = clientTransport;
    this.serverTransport = serverTransport;

    this.setupHandlers();
  }

  async onModuleInit() {
    this.register(owaspCheckTools);
    await this.server.connect(this.serverTransport);
  }

  async onModuleDestroy() {
    await this.server.close();
  }

  register(tools: McpTool[]) {
    for (const tool of tools) {
      this.tools.set(tool.definition.name, tool);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map((t) => ({
        name: t.definition.name,
        description: t.definition.description,
        inputSchema: t.definition.inputSchema || {
          type: 'object',
          properties: {},
        },
      }));

      return { tools };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const name = request.params.name;
        const args = request.params.arguments ?? {};
        const tool = this.tools.get(name);

        if (!tool) {
          throw new Error(`MCP: unknown tool "${name}"`);
        }

        const ctx = request.params._meta?.ctx;

        if (!ctx) {
          throw new Error(`MCP: missing ScanContext for tool "${name}"`);
        }

        try {
          const result = await tool.handler(args, ctx);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: error instanceof Error ? error.message : String(error),
              },
            ],
          };
        }
      },
    );
  }
}
