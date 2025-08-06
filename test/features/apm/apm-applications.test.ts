import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewRelicMCPServer } from '../../../src/server';
import { NewRelicClient } from '../../../src/client/newrelic-client';

describe('APM Applications Feature', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      listApmApplications: vi.fn().mockResolvedValue([
        {
          guid: 'app-guid-1',
          name: 'My App 1',
          language: 'nodejs',
          reporting: true,
          alertSeverity: 'NOT_ALERTING',
          tags: { env: 'production' }
        },
        {
          guid: 'app-guid-2',
          name: 'My App 2',
          language: 'java',
          reporting: true,
          alertSeverity: 'WARNING',
          tags: { env: 'staging' }
        }
      ]),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} })
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    
    server = new NewRelicMCPServer(mockClient);
  });

  describe('List APM applications successfully', () => {
    it('should return a list of APM applications with required fields', async () => {
      const result = await server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      
      result.forEach((app: any) => {
        expect(app).toHaveProperty('guid');
        expect(app).toHaveProperty('name');
        expect(app).toHaveProperty('language');
        expect(app).toHaveProperty('reporting');
        expect(app).toHaveProperty('alertSeverity');
        expect(app).toHaveProperty('tags');
      });
    });
  });

  describe('List APM applications with specific account', () => {
    it('should query applications from specified account', async () => {
      await server.executeTool('list_apm_applications', {
        target_account_id: '789012'
      });

      expect(mockClient.listApmApplications).toHaveBeenCalledWith('789012');
    });
  });

  describe('Handle no APM applications', () => {
    it('should return empty array when no applications exist', async () => {
      mockClient.listApmApplications = vi.fn().mockResolvedValue([]);
      
      const result = await server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      });

      expect(result).toEqual([]);
    });
  });

  describe('Handle missing account ID', () => {
    it('should throw error when account ID is not provided', async () => {
      delete process.env.NEW_RELIC_ACCOUNT_ID;
      const serverNoAccount = new NewRelicMCPServer(mockClient);
      
      await expect(serverNoAccount.executeTool('list_apm_applications', {}))
        .rejects.toThrow('Account ID must be provided');
    });
  });

  describe('Handle API errors', () => {
    it('should propagate API errors', async () => {
      mockClient.listApmApplications = vi.fn().mockRejectedValue(
        new Error('API Error: Rate limit exceeded')
      );

      await expect(server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      })).rejects.toThrow('API Error: Rate limit exceeded');
    });
  });

  describe('APM application details', () => {
    it('should include all required application details', async () => {
      const result = await server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      });

      const app = result[0];
      expect(app.guid).toBe('app-guid-1');
      expect(app.name).toBe('My App 1');
      expect(app.language).toBe('nodejs');
      expect(app.reporting).toBe(true);
      expect(app.alertSeverity).toBe('NOT_ALERTING');
      expect(app.tags).toEqual({ env: 'production' });
    });
  });

  describe('APM application language information', () => {
    it('should return valid programming language for each app', async () => {
      const result = await server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      });

      const validLanguages = ['nodejs', 'java', 'python', 'ruby', 'go', 'dotnet', 'php', 'unknown'];
      result.forEach((app: any) => {
        expect(validLanguages).toContain(app.language.toLowerCase());
      });
    });
  });

  describe('APM application tags', () => {
    it('should return properly structured tags', async () => {
      const result = await server.executeTool('list_apm_applications', {
        target_account_id: '123456'
      });

      result.forEach((app: any) => {
        expect(typeof app.tags).toBe('object');
        Object.entries(app.tags).forEach(([key, value]) => {
          expect(typeof key).toBe('string');
          expect(typeof value).toBe('string');
        });
      });
    });
  });
});