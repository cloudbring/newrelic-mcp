import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient, NrqlQueryResult } from '../client/newrelic-client';
import { z } from 'zod';

const NrqlInputSchema = z.object({
  nrql: z.string().min(1),
  target_account_id: z.string().optional()
});

export class NrqlTool {
  name = 'run_nrql_query';
  description = 'Execute NRQL queries against New Relic data to analyze metrics and events';
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
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
    // Validate input
    if (!input.nrql || typeof input.nrql !== 'string' || input.nrql.trim() === '') {
      throw new Error('Invalid or empty NRQL query provided');
    }

    if (!input.target_account_id) {
      throw new Error('Account ID must be provided');
    }

    if (input.target_account_id && !/^\d+$/.test(input.target_account_id)) {
      throw new Error('Invalid account ID format');
    }

    const result = await this.client.runNrqlQuery({
      nrql: input.nrql,
      accountId: input.target_account_id
    });

    return result;
  }
}