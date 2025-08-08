import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ApmApplication, NewRelicClient } from '../client/newrelic-client';

export class ApmTool {
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
  }

  getListApplicationsTool(): Tool {
    return {
      name: 'list_apm_applications',
      description: 'List all APM applications in your New Relic account',
      inputSchema: {
        type: 'object',
        properties: {
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID',
          },
        },
      },
    };
  }

  async execute(input: { target_account_id?: string }): Promise<ApmApplication[]> {
    if (!input.target_account_id) {
      throw new Error('Account ID must be provided');
    }

    const applications = await this.client.listApmApplications(input.target_account_id);
    return applications;
  }
}
