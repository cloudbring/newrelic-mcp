import { evalite } from 'evalite';
import { Levenshtein } from 'autoevals';
import { NewRelicMCPServer } from '../../src/server';
import { vi } from 'vitest';

const createMockClient = () => ({
  validateCredentials: vi.fn().mockResolvedValue(true),
  getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
  listApmApplications: vi.fn().mockResolvedValue([
    {
      guid: 'app-1',
      name: 'Production API',
      language: 'nodejs',
      reporting: true,
      alertSeverity: 'NOT_ALERTING',
      tags: { environment: 'production', team: 'backend' }
    },
    {
      guid: 'app-2',
      name: 'Staging API',
      language: 'java',
      reporting: false,
      alertSeverity: 'WARNING',
      tags: { environment: 'staging', team: 'backend' }
    }
  ]),
  executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} })
});

evalite('APM Applications Tool Response Validation', {
  data: async () => [
    {
      input: {
        tool: 'list_apm_applications',
        params: { target_account_id: '123456' }
      },
      expected: JSON.stringify([
        {
          guid: 'app-1',
          name: 'Production API',
          language: 'nodejs',
          reporting: true,
          alertSeverity: 'NOT_ALERTING',
          tags: { environment: 'production', team: 'backend' }
        },
        {
          guid: 'app-2',
          name: 'Staging API',
          language: 'java',
          reporting: false,
          alertSeverity: 'WARNING',
          tags: { environment: 'staging', team: 'backend' }
        }
      ])
    },
    {
      input: {
        tool: 'list_apm_applications',
        params: { target_account_id: '999999' }
      },
      expected: JSON.stringify([])
    }
  ],
  task: async (input) => {
    const mockClient = createMockClient() as any;
    
    // Adjust mock for different account IDs
    if (input.params.target_account_id === '999999') {
      mockClient.listApmApplications = vi.fn().mockResolvedValue([]);
    }
    
    const server = new NewRelicMCPServer(mockClient);
    
    try {
      const result = await server.executeTool(input.tool, input.params);
      return JSON.stringify(result);
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  },
  scorers: [
    Levenshtein,
    {
      name: 'APM Schema Validation',
      description: 'Validates APM application response structure',
      scorer: ({ output }) => {
        try {
          const parsed = JSON.parse(output);
          
          if (!Array.isArray(parsed)) return 0;
          if (parsed.length === 0) return 1; // Empty array is valid
          
          let score = 0;
          const requiredFields = ['guid', 'name', 'language', 'reporting'];
          
          parsed.forEach((app: any) => {
            const fieldScore = requiredFields.every(field => field in app) ? 0.25 : 0;
            score += fieldScore;
            
            // Check field types
            if (typeof app.guid === 'string') score += 0.1;
            if (typeof app.name === 'string') score += 0.1;
            if (typeof app.language === 'string') score += 0.1;
            if (typeof app.reporting === 'boolean') score += 0.1;
            if (typeof app.tags === 'object') score += 0.1;
          });
          
          return Math.min(score / parsed.length, 1);
        } catch {
          return 0;
        }
      }
    },
    {
      name: 'Language Validation',
      description: 'Validates programming language values',
      scorer: ({ output }) => {
        try {
          const parsed = JSON.parse(output);
          if (!Array.isArray(parsed)) return 0;
          if (parsed.length === 0) return 1;
          
          const validLanguages = ['nodejs', 'java', 'python', 'ruby', 'go', 'dotnet', 'php', 'unknown'];
          let validCount = 0;
          
          parsed.forEach((app: any) => {
            if (validLanguages.includes(app.language?.toLowerCase())) {
              validCount++;
            }
          });
          
          return validCount / parsed.length;
        } catch {
          return 0;
        }
      }
    }
  ]
});