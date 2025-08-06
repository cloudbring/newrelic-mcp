import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Entity Search Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  {
                    guid: 'entity-1',
                    name: 'Production API',
                    type: 'APPLICATION',
                    domain: 'APM',
                    tags: [
                      { key: 'environment', values: ['production'] },
                      { key: 'team', values: ['backend'] },
                    ],
                  },
                  {
                    guid: 'entity-2',
                    name: 'Database Server',
                    type: 'HOST',
                    domain: 'INFRA',
                    tags: [
                      { key: 'environment', values: ['production'] },
                      { key: 'type', values: ['database'] },
                    ],
                  },
                ],
                nextCursor: null,
              },
            },
          },
        },
      }),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('Search entities successfully', () => {
    it('should return entities matching search query', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.searchEntities({
        query: 'production',
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
      expect(result.entities).toHaveLength(2);

      result.entities.forEach((entity: any) => {
        expect(entity).toHaveProperty('guid');
        expect(entity).toHaveProperty('name');
        expect(entity).toHaveProperty('type');
        expect(entity).toHaveProperty('domain');
        expect(entity).toHaveProperty('tags');
      });
    });
  });

  describe('Filter entities by type', () => {
    it('should filter entities by specified types', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);

      await entityTool.searchEntities({
        query: 'production',
        entity_types: ['APPLICATION', 'HOST'],
        target_account_id: '123456',
      });

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalled();
      const query = mockClient.executeNerdGraphQuery.mock.calls[0][0];
      expect(query).toContain('APPLICATION');
      expect(query).toContain('HOST');
    });
  });

  describe('Search with tags', () => {
    it('should include tags in search results', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.searchEntities({
        query: 'environment:production',
        target_account_id: '123456',
      });

      const entity = result.entities[0];
      expect(entity.tags).toBeDefined();
      expect(Array.isArray(entity.tags)).toBe(true);

      entity.tags.forEach((tag: any) => {
        expect(tag).toHaveProperty('key');
        expect(tag).toHaveProperty('values');
        expect(Array.isArray(tag.values)).toBe(true);
      });
    });
  });

  describe('Handle empty search results', () => {
    it('should return empty array when no entities match', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [],
                nextCursor: null,
              },
            },
          },
        },
      });

      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.searchEntities({
        query: 'nonexistent',
        target_account_id: '123456',
      });

      expect(result.entities).toEqual([]);
    });
  });

  describe('Pagination support', () => {
    it('should include pagination cursor when available', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: Array(250).fill({
                  guid: 'entity',
                  name: 'Entity',
                  type: 'APPLICATION',
                  domain: 'APM',
                  tags: [],
                }),
                nextCursor: 'next-page-cursor',
              },
            },
          },
        },
      });

      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.searchEntities({
        query: 'large-result-set',
        target_account_id: '123456',
      });

      expect(result.nextCursor).toBe('next-page-cursor');
    });
  });

  describe('Entity domain validation', () => {
    it('should return valid entity domains', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.searchEntities({
        query: 'production',
        target_account_id: '123456',
      });

      const validDomains = ['APM', 'INFRA', 'BROWSER', 'MOBILE', 'SYNTH'];
      result.entities.forEach((entity: any) => {
        expect(validDomains).toContain(entity.domain);
      });
    });
  });
});
