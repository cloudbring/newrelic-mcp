import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient } from '../client/newrelic-client';

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
            description: 'The GraphQL query to execute'
          }
        },
        required: ['query']
      }
    };
  }

  async execute(input: any): Promise<any> {
    if (!input.query || typeof input.query !== 'string') {
      throw new Error('Invalid or empty GraphQL query provided');
    }

    return await this.client.executeNerdGraphQuery(input.query);
  }
}