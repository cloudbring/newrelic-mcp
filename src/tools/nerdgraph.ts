import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { NewRelicClient } from '../client/newrelic-client';

export class NerdGraphTool {
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
  }

  getQueryTool(): Tool {
    return {
      name: 'run_nerdgraph_query',
      description: 'Execute a custom NerdGraph GraphQL query',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The GraphQL query to execute',
          },
          variables: {
            type: 'object',
            description: 'Optional GraphQL variables to supply to the query',
          },
        },
        required: ['query'],
      },
    };
  }

  async execute(input: unknown): Promise<unknown> {
    // Validate input with Zod for consistency
    const schema = z.object({
      query: z.string().min(1, 'Invalid or empty GraphQL query provided'),
      variables: z.record(z.any()).optional(),
    });

    const { query, variables } = schema.parse(input);

    return await this.client.executeNerdGraphQuery(query, variables);
  }
}
