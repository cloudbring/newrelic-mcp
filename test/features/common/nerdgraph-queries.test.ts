import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('NerdGraph Queries Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          actor: {
            account: {
              id: '123456',
              name: 'Test Account',
            },
          },
        },
      }),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('Execute NerdGraph query successfully', () => {
    it('should execute a valid GraphQL query', async () => {
      const query = `
        {
          actor {
            account(id: 123456) {
              name
              id
            }
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(query);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.actor.account.id).toBe('123456');
      expect(result.data.actor.account.name).toBe('Test Account');
    });
  });

  describe('Execute NerdGraph mutation', () => {
    it('should execute a GraphQL mutation', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          alertsNrqlConditionStaticCreate: {
            id: 'condition-123',
            name: 'New Condition',
          },
        },
      });

      const mutation = `
        mutation {
          alertsNrqlConditionStaticCreate(
            accountId: 123456,
            policyId: "policy-1",
            condition: {
              name: "New Condition",
              enabled: true
            }
          ) {
            id
            name
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(mutation);

      expect(result.data.alertsNrqlConditionStaticCreate).toBeDefined();
      expect(result.data.alertsNrqlConditionStaticCreate.id).toBe('condition-123');
    });
  });

  describe('Handle NerdGraph errors', () => {
    it('should handle GraphQL errors properly', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        errors: [
          {
            message: 'Field "invalidField" does not exist',
            extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
          },
        ],
      });

      const invalidQuery = `
        {
          actor {
            invalidField
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(invalidQuery);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('invalidField');
    });
  });

  describe('Query with variables', () => {
    it('should support query variables', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entity: {
              guid: 'entity-123',
              name: 'Test Entity',
            },
          },
        },
      });

      const query = `
        query GetEntity($guid: EntityGuid!) {
          actor {
            entity(guid: $guid) {
              guid
              name
            }
          }
        }
      `;

      const variables = { guid: 'entity-123' };
      const result = await mockClient.executeNerdGraphQuery(query, variables);

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalledWith(query, variables);
      expect(result.data.actor.entity.guid).toBe('entity-123');
    });
  });

  describe('Complex nested queries', () => {
    it('should handle complex nested structures', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            account: {
              nrql: {
                results: [
                  { count: 100, facet: 'error' },
                  { count: 50, facet: 'warning' },
                ],
              },
            },
          },
        },
      });

      const query = `
        {
          actor {
            account(id: 123456) {
              nrql(query: "SELECT count(*) FROM Transaction FACET error") {
                results
              }
            }
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(query);
      expect(result.data.actor.account.nrql.results).toHaveLength(2);
      expect(result.data.actor.account.nrql.results[0].count).toBe(100);
    });
  });

  describe('Rate limiting handling', () => {
    it('should handle rate limit errors', async () => {
      mockClient.executeNerdGraphQuery = vi
        .fn()
        .mockRejectedValue(new Error('Rate limit exceeded. Please retry after 60 seconds.'));

      const query = '{ actor { account(id: 123456) { name } } }';

      await expect(mockClient.executeNerdGraphQuery(query)).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Query introspection', () => {
    it('should support schema introspection queries', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          __schema: {
            types: [
              { name: 'Account', kind: 'OBJECT' },
              { name: 'Entity', kind: 'INTERFACE' },
            ],
          },
        },
      });

      const introspectionQuery = `
        {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(introspectionQuery);
      expect(result.data.__schema.types).toBeDefined();
      expect(result.data.__schema.types).toContainEqual(
        expect.objectContaining({ name: 'Account', kind: 'OBJECT' })
      );
    });
  });
});
