import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient, NrqlQueryResult } from '../client/newrelic-client';
import { z } from 'zod';
import { withToolSpan, addSpanAttributes } from '../instrumentation/otel-setup';
import { createChildLogger } from '../logger/winston-logger';
import { logger } from '../logger/winston-logger';

const NrqlInputSchema = z.object({
  nrql: z.string().min(1),
  target_account_id: z.string().optional()
});

export class NrqlTool {
  name = 'run_nrql_query';
  description = 'Execute NRQL queries against New Relic data to analyze metrics and events';
  private client: NewRelicClient;
  private logger: typeof logger;

  constructor(client: NewRelicClient) {
    this.client = client;
    this.logger = createChildLogger(logger, 'NrqlTool');
  }

  getToolDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.getInputSchema()
    };
  }

  getInputSchema() {
    return {
      type: 'object' as const,
      properties: {
        nrql: {
          type: 'string',
          description: 'The NRQL query to execute'
        },
        target_account_id: {
          type: 'string',
          description: 'Optional New Relic account ID to query'
        }
      },
      required: ['nrql']
    };
  }

  async execute(input: any): Promise<NrqlQueryResult> {
    return withToolSpan(
      'nrql',
      'execute',
      async () => {
        this.logger.info('Executing NRQL query', {
          query: input.nrql,
          accountId: input.target_account_id,
        });

        // Validate input
        if (!input.nrql || typeof input.nrql !== 'string' || input.nrql.trim() === '') {
          const error = new Error('Invalid or empty NRQL query provided');
          this.logger.error('NRQL validation failed', { error: error.message });
          throw error;
        }

        if (!input.target_account_id) {
          const error = new Error('Account ID must be provided');
          this.logger.error('Account ID missing', { error: error.message });
          throw error;
        }

        if (input.target_account_id && !/^\d+$/.test(input.target_account_id)) {
          const error = new Error('Invalid account ID format');
          this.logger.error('Invalid account ID format', { 
            accountId: input.target_account_id,
            error: error.message 
          });
          throw error;
        }

        // Add span attributes
        addSpanAttributes({
          'nrql.query': input.nrql,
          'nrql.account_id': input.target_account_id,
        });

        const startTime = Date.now();
        const result = await this.client.runNrqlQuery({
          nrql: input.nrql,
          accountId: input.target_account_id
        });

        const duration = Date.now() - startTime;
        this.logger.info('NRQL query completed', {
          duration,
          resultCount: result.results?.length || 0,
          metadata: result.metadata,
        });

        // Add result attributes to span
        addSpanAttributes({
          'nrql.result_count': result.results?.length || 0,
          'nrql.duration_ms': duration,
        });

        return result;
      },
      {
        'tool.name': 'nrql',
        'tool.operation': 'execute_query',
      }
    );
  }
}