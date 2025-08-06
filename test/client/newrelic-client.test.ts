import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewRelicClient } from '../../src/client/newrelic-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('NewRelicClient', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      const client = new NewRelicClient();
      expect(client).toBeDefined();
    });

    it('should initialize with provided parameters', () => {
      const client = new NewRelicClient('custom-key', 'custom-account');
      expect(client).toBeDefined();
    });
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              user: {
                id: 'user-123',
                email: 'test@example.com'
              }
            }
          }
        })
      });

      const result = await client.validateCredentials();
      expect(result).toBe(true);
    });

    it('should return false for invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await client.validateCredentials();
      expect(result).toBe(false);
    });
  });

  describe('getAccountDetails', () => {
    it('should return account details', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              account: {
                id: '123456',
                name: 'Test Account'
              }
            }
          }
        })
      });

      const result = await client.getAccountDetails('123456');
      expect(result.accountId).toBe('123456');
      expect(result.name).toBe('Test Account');
    });

    it('should throw error when account not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {}
          }
        })
      });

      await expect(client.getAccountDetails('999999'))
        .rejects.toThrow('Account 999999 not found');
    });

    it('should use default account ID when not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              account: {
                id: '123456',
                name: 'Default Account'
              }
            }
          }
        })
      });

      const result = await client.getAccountDetails();
      expect(result.accountId).toBe('123456');
    });
  });

  describe('runNrqlQuery', () => {
    it('should execute NRQL query successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              account: {
                nrql: {
                  results: [{ count: 100 }],
                  metadata: {
                    eventTypes: ['Transaction'],
                    facets: [],
                    timeSeries: false
                  }
                }
              }
            }
          }
        })
      });

      const result = await client.runNrqlQuery({
        nrql: 'SELECT count(*) FROM Transaction',
        accountId: '123456'
      });

      expect(result.results).toEqual([{ count: 100 }]);
      expect(result.metadata.eventTypes).toContain('Transaction');
    });

    it('should validate NRQL query input', async () => {
      await expect(client.runNrqlQuery({
        nrql: '',
        accountId: '123456'
      })).rejects.toThrow('Invalid or empty NRQL query provided');
    });

    it('should validate account ID format', async () => {
      await expect(client.runNrqlQuery({
        nrql: 'SELECT * FROM Transaction',
        accountId: 'invalid'
      })).rejects.toThrow('Invalid account ID format');
    });

    it('should handle NRQL syntax errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{
            message: 'NRQL Syntax error: invalid query'
          }]
        })
      });

      await expect(client.runNrqlQuery({
        nrql: 'INVALID QUERY',
        accountId: '123456'
      })).rejects.toThrow('NRQL Syntax error: invalid query');
    });
  });

  describe('listApmApplications', () => {
    it('should list APM applications', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              entitySearch: {
                results: {
                  entities: [
                    {
                      guid: 'app-1',
                      name: 'App 1',
                      language: 'Node.js',
                      reporting: true,
                      alertSeverity: 'NOT_ALERTING',
                      tags: [
                        { key: 'env', values: ['prod'] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        })
      });

      const result = await client.listApmApplications('123456');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('App 1');
      expect(result[0].language).toBe('Node.js');
      expect(result[0].tags.env).toBe('prod');
    });

    it('should handle empty results', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              entitySearch: {
                results: {
                  entities: []
                }
              }
            }
          }
        })
      });

      const result = await client.listApmApplications('123456');
      expect(result).toEqual([]);
    });
  });

  describe('executeNerdGraphQuery', () => {
    it('should execute query with variables', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { result: 'success' }
        })
      });

      const result = await client.executeNerdGraphQuery(
        'query ($id: ID!) { entity(id: $id) { name } }',
        { id: '123' }
      );

      expect(result.data.result).toBe('success');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.newrelic.com/graphql',
        expect.objectContaining({
          body: expect.stringContaining('variables')
        })
      );
    });

    it('should throw error for missing API key', async () => {
      const clientNoKey = new NewRelicClient('', '123456');
      
      await expect(clientNoKey.executeNerdGraphQuery('{ actor { user { id } } }'))
        .rejects.toThrow('NEW_RELIC_API_KEY environment variable is not set');
    });

    it('should handle 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(client.executeNerdGraphQuery('{ actor { user { id } } }'))
        .rejects.toThrow('Unauthorized: Invalid API key');
    });

    it('should handle other API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(client.executeNerdGraphQuery('{ actor { user { id } } }'))
        .rejects.toThrow('NerdGraph API error: 500 Internal Server Error');
    });
  });

  describe('parseTags', () => {
    it('should parse tags correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              entitySearch: {
                results: {
                  entities: [
                    {
                      guid: 'entity-1',
                      name: 'Entity 1',
                      tags: [
                        { key: 'env', values: ['production', 'staging'] },
                        { key: 'team', values: ['backend'] },
                        { key: 'empty', values: [] },
                        { key: null, values: ['ignored'] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        })
      });

      const result = await client.listApmApplications('123456');
      expect(result[0].tags).toEqual({
        env: 'production',
        team: 'backend'
      });
    });

    it('should handle missing tags', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            actor: {
              entitySearch: {
                results: {
                  entities: [
                    {
                      guid: 'entity-1',
                      name: 'Entity 1'
                    }
                  ]
                }
              }
            }
          }
        })
      });

      const result = await client.listApmApplications('123456');
      expect(result[0].tags).toEqual({});
    });
  });
});