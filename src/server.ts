import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient } from './client/newrelic-client';
import { NrqlTool } from './tools/nrql';
import { ApmTool } from './tools/apm';
import { EntityTool } from './tools/entity';
import { AlertTool } from './tools/alert';
import { SyntheticsTool } from './tools/synthetics';
import { NerdGraphTool } from './tools/nerdgraph';

export class NewRelicMCPServer {
  private server: Server;
  private client: NewRelicClient;
  private tools: Map<string, Tool>;
  private defaultAccountId?: string;

  constructor(client?: NewRelicClient) {
    if (!process.env.NEW_RELIC_API_KEY) {
      throw new Error('NEW_RELIC_API_KEY is required');
    }

    this.defaultAccountId = process.env.NEW_RELIC_ACCOUNT_ID;
    this.client = client || new NewRelicClient(
      process.env.NEW_RELIC_API_KEY,
      this.defaultAccountId
    );
    
    this.server = new Server(
      {
        name: 'newrelic-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.registerTools();
    this.setupHandlers();
  }

  private registerTools(): void {
    const nrqlTool = new NrqlTool(this.client);
    const apmTool = new ApmTool(this.client);
    const entityTool = new EntityTool(this.client);
    const alertTool = new AlertTool(this.client);
    const syntheticsTool = new SyntheticsTool(this.client);
    const nerdGraphTool = new NerdGraphTool(this.client);

    // Register all tools
    const tools = [
      nrqlTool.getToolDefinition(),
      apmTool.getListApplicationsTool(),
      entityTool.getSearchTool(),
      entityTool.getDetailsTool(),
      alertTool.getPoliciesTool(),
      alertTool.getIncidentsTool(),
      alertTool.getAcknowledgeTool(),
      syntheticsTool.getListMonitorsTool(),
      syntheticsTool.getCreateMonitorTool(),
      nerdGraphTool.getQueryTool(),
      {
        name: 'get_account_details',
        description: 'Get New Relic account details',
        inputSchema: {
          type: 'object' as const,
          properties: {
            target_account_id: {
              type: 'string' as const,
              description: 'Optional account ID to get details for'
            }
          }
        }
      }
    ];

    tools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values())
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.get(request.params.name);
      
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool ${request.params.name} not found`
        );
      }

      try {
        const result = await this.executeTool(
          request.params.name,
          request.params.arguments || {}
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          error.message || 'Tool execution failed'
        );
      }
    });
  }

  async start(): Promise<void> {
    const isValid = await this.client.validateCredentials();
    if (!isValid) {
      throw new Error('Invalid New Relic API credentials');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('New Relic MCP Server started');
  }

  async executeTool(name: string, args: any): Promise<any> {
    const accountId = args.target_account_id || this.defaultAccountId;
    
    if (!accountId && this.requiresAccountId(name)) {
      throw new Error('Account ID must be provided');
    }

    switch (name) {
      case 'run_nrql_query':
        return await new NrqlTool(this.client).execute({
          ...args,
          target_account_id: accountId
        });
      case 'list_apm_applications':
        return await new ApmTool(this.client).execute({
          ...args,
          target_account_id: accountId
        });
      case 'get_account_details':
        return await this.client.getAccountDetails(accountId);
      default:
        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }
        // Execute tool through respective handler
        return await this.executeToolHandler(name, args);
    }
  }

  private requiresAccountId(toolName: string): boolean {
    const accountRequiredTools = [
      'run_nrql_query',
      'list_apm_applications',
      'search_entities',
      'get_account_details'
    ];
    return accountRequiredTools.includes(toolName);
  }

  private async executeToolHandler(name: string, args: any): Promise<any> {
    // Delegate to specific tool handlers
    throw new Error(`Tool handler for ${name} not implemented`);
  }

  getMetadata() {
    return {
      name: 'newrelic-mcp',
      version: '1.0.0',
      description: 'MCP server for New Relic observability platform integration'
    };
  }

  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getDefaultAccountId(): string | undefined {
    return this.defaultAccountId;
  }
}

// Main entry point
if (require.main === module) {
  const server = new NewRelicMCPServer();
  server.start().catch(console.error);
}