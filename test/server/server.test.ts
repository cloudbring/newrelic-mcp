import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NewRelicMCPServer } from '../../src/server';
import { NewRelicClient } from '../../src/client/newrelic-client';

describe('NewRelic MCP Server', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      runNrqlQuery: vi.fn().mockResolvedValue({ results: [], metadata: {} }),
      listApmApplications: vi.fn().mockResolvedValue([]),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} })
    } as any;
    
    server = new NewRelicMCPServer(mockClient);
  });

  describe('Server Initialization', () => {
    it('should create a new MCP server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(NewRelicMCPServer);
    });

    it('should have required server metadata', () => {
      const metadata = server.getMetadata();
      expect(metadata.name).toBe('newrelic-mcp');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toContain('New Relic');
    });

    it('should register all required tools', () => {
      const tools = server.getRegisteredTools();
      
      // Core tools that should be registered
      const expectedTools = [
        'list_apm_applications',
        'run_nrql_query',
        'run_nerdgraph_query',
        'get_account_details',
        'search_entities',
        'get_entity_details',
        'list_alert_policies',
        'list_open_incidents',
        'acknowledge_incident',
        'list_synthetics_monitors',
        'create_browser_monitor'
      ];

      expectedTools.forEach(toolName => {
        expect(tools).toContain(toolName);
      });
    });

    it('should validate New Relic API credentials on start', async () => {
      await server.start();
      expect(mockClient.validateCredentials).toHaveBeenCalled();
    });

    it('should throw error if API credentials are invalid', async () => {
      mockClient.validateCredentials = vi.fn().mockResolvedValue(false);
      await expect(server.start()).rejects.toThrow('Invalid New Relic API credentials');
    });
  });

  describe('Tool Registration', () => {
    it('should register NRQL query tool with correct schema', () => {
      const tool = server.getTool('run_nrql_query');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('run_nrql_query');
      expect(tool.description).toContain('NRQL');
      expect(tool.inputSchema).toHaveProperty('properties.nrql');
      expect(tool.inputSchema.properties.nrql.type).toBe('string');
      expect(tool.inputSchema.required).toContain('nrql');
    });

    it('should register APM applications tool with correct schema', () => {
      const tool = server.getTool('list_apm_applications');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('list_apm_applications');
      expect(tool.description).toContain('APM');
      expect(tool.inputSchema).toHaveProperty('properties.target_account_id');
    });

    it('should register entity search tool with correct schema', () => {
      const tool = server.getTool('search_entities');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('search_entities');
      expect(tool.inputSchema).toHaveProperty('properties.query');
      expect(tool.inputSchema).toHaveProperty('properties.entity_types');
    });
  });

  describe('Environment Configuration', () => {
    it('should require NEW_RELIC_API_KEY environment variable', () => {
      const originalEnv = process.env.NEW_RELIC_API_KEY;
      delete process.env.NEW_RELIC_API_KEY;
      
      expect(() => new NewRelicMCPServer()).toThrow('NEW_RELIC_API_KEY is required');
      
      process.env.NEW_RELIC_API_KEY = originalEnv;
    });

    it('should use NEW_RELIC_ACCOUNT_ID if provided', () => {
      process.env.NEW_RELIC_ACCOUNT_ID = '789012';
      const serverWithAccount = new NewRelicMCPServer();
      expect(serverWithAccount.getDefaultAccountId()).toBe('789012');
    });

    it('should allow account ID override in tool calls', async () => {
      const result = await server.executeTool('run_nrql_query', {
        nrql: 'SELECT count(*) FROM Transaction',
        target_account_id: '999999'
      });
      
      expect(mockClient.runNrqlQuery).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: '999999' })
      );
    });
  });
});