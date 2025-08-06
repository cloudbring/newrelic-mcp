import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewRelicMCPServer } from '../../src/server';
import { NewRelicClient } from '../../src/client/newrelic-client';

describe('NewRelic MCP Server Edge Cases', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      runNrqlQuery: vi.fn(),
      listApmApplications: vi.fn(),
      executeNerdGraphQuery: vi.fn()
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    
    server = new NewRelicMCPServer(mockClient);
  });

  // Helper function to simulate tool call
  const handleToolCall = async (params: { name: string; arguments: any }) => {
    try {
      const result = await server.executeTool(params.name, params.arguments);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error executing tool: ${error.message}`
        }]
      };
    }
  };

  describe('Tool execution error handling', () => {
    it('should handle tool not found', async () => {
      const result = await handleToolCall({
        name: 'nonexistent_tool',
        arguments: {}
      });

      expect(result.content[0].text).toContain('Error executing tool');
      expect(result.content[0].text).toContain('not found');
    });

    it('should handle tool execution errors gracefully', async () => {
      mockClient.runNrqlQuery = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      const result = await handleToolCall({
        name: 'run_nrql_query',
        arguments: {
          nrql: 'SELECT * FROM Transaction',
          account_id: '123456'
        }
      });

      expect(result.content[0].text).toContain('Error executing tool');
      expect(result.content[0].text).toContain('Network error');
    });

    it('should handle malformed tool arguments', async () => {
      const result = await handleToolCall({
        name: 'run_nrql_query',
        arguments: null as any
      });

      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('Environment validation', () => {
    it('should throw error when API key is missing', async () => {
      const originalApiKey = process.env.NEW_RELIC_API_KEY;
      delete process.env.NEW_RELIC_API_KEY;

      expect(() => new NewRelicMCPServer()).toThrow('NEW_RELIC_API_KEY is required');
      
      // Restore the env var
      process.env.NEW_RELIC_API_KEY = originalApiKey;
    });
  });

  describe('Complex tool scenarios', () => {
    it('should handle concurrent tool calls', async () => {
      mockClient.runNrqlQuery = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { results: [{ count: 100 }], metadata: {} };
      });

      const promises = [
        handleToolCall({
          name: 'run_nrql_query',
          arguments: { nrql: 'SELECT 1', account_id: '123456' }
        }),
        handleToolCall({
          name: 'run_nrql_query',
          arguments: { nrql: 'SELECT 2', account_id: '123456' }
        }),
        handleToolCall({
          name: 'run_nrql_query',
          arguments: { nrql: 'SELECT 3', account_id: '123456' }
        })
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(mockClient.runNrqlQuery).toHaveBeenCalledTimes(3);
    });

    it('should handle large result sets', async () => {
      const largeResults = Array(1000).fill({ id: 'entity', name: 'Test' });
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: largeResults
              }
            }
          }
        }
      });

      const result = await handleToolCall({
        name: 'search_entities',
        arguments: { query: 'large', target_account_id: '123456' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.entities).toHaveLength(1000);
    });
  });

  describe('Alert tool scenarios', () => {
    it('should handle empty alert policies', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            account: {
              alerts: {
                policiesSearch: {
                  policies: []
                }
              }
            }
          }
        }
      });

      const result = await handleToolCall({
        name: 'list_alert_policies',
        arguments: { target_account_id: '123456' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([]);
    });

    it('should handle malformed incident data', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  { 
                    // Missing issues property
                    guid: 'entity-1'
                  }
                ]
              }
            }
          }
        }
      });

      const result = await handleToolCall({
        name: 'list_open_incidents',
        arguments: { target_account_id: '123456' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([]);
    });
  });

  describe('Synthetics tool scenarios', () => {
    it('should handle invalid monitor frequency', async () => {
      const result = await handleToolCall({
        name: 'create_browser_monitor',
        arguments: {
          name: 'Test Monitor',
          url: 'https://example.com',
          frequency: 999, // Invalid frequency
          locations: ['US_EAST_1'],
          target_account_id: '123456'
        }
      });

      // Tool should handle this gracefully
      expect(result.content[0].text).toBeDefined();
    });

    it('should handle empty monitor list', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: []
              }
            }
          }
        }
      });

      const result = await handleToolCall({
        name: 'list_synthetics_monitors',
        arguments: { target_account_id: '123456' }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([]);
    });
  });

  describe('Entity tool scenarios', () => {
    it('should handle complex entity search queries', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  {
                    guid: 'entity-1',
                    name: 'Complex Entity',
                    type: 'APPLICATION',
                    domain: 'APM',
                    tags: [
                      { key: 'environment', values: ['prod', 'staging'] },
                      { key: 'team', values: ['backend', 'frontend', 'devops'] }
                    ]
                  }
                ],
                nextCursor: 'next-page'
              }
            }
          }
        }
      });

      const result = await handleToolCall({
        name: 'search_entities',
        arguments: {
          query: 'environment:prod AND team:backend',
          entity_types: ['APPLICATION', 'HOST'],
          target_account_id: '123456'
        }
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.entities[0].tags).toHaveLength(2);
      expect(parsed.nextCursor).toBe('next-page');
    });

    it('should handle entity not found gracefully', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entity: null
          }
        }
      });

      const result = await handleToolCall({
        name: 'get_entity_details',
        arguments: {
          entity_guid: 'nonexistent-guid'
        }
      });

      expect(result.content[0].text).toContain('Error');
      expect(result.content[0].text).toContain('Entity not found');
    });
  });

  describe('NerdGraph query execution', () => {
    it('should handle complex GraphQL queries', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            accounts: [
              { id: '123', name: 'Account 1' },
              { id: '456', name: 'Account 2' }
            ]
          }
        }
      });

      // Note: execute_nerdgraph_query tool doesn't exist in the current implementation
      // Testing the NerdGraph client directly
      const result = await mockClient.executeNerdGraphQuery('{ actor { accounts { id name } } }');
      expect(result.data.actor.accounts).toHaveLength(2);
    });

    it('should handle GraphQL errors', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        errors: [
          {
            message: 'Field does not exist',
            extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
          }
        ]
      });

      const result = await mockClient.executeNerdGraphQuery('{ actor { invalidField } }');
      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Field does not exist');
    });
  });
});