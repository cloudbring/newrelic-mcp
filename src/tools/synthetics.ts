import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { NewRelicClient } from '../client/newrelic-client';

export class SyntheticsTool {
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
  }

  getListMonitorsTool(): Tool {
    return {
      name: 'list_synthetics_monitors',
      description: 'List all Synthetics monitors in your New Relic account',
      inputSchema: {
        type: 'object',
        properties: {
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID',
          },
          monitor_type: {
            type: 'string',
            enum: ['SIMPLE', 'BROWSER', 'SCRIPT_API', 'SCRIPT_BROWSER'],
            description: 'Filter by monitor type',
          },
        },
      },
    };
  }

  getCreateMonitorTool(): Tool {
    return {
      name: 'create_browser_monitor',
      description: 'Create a new browser-based Synthetics monitor',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the monitor',
          },
          url: {
            type: 'string',
            description: 'URL to monitor',
          },
          frequency: {
            type: 'number',
            enum: [1, 5, 10, 15, 30, 60],
            description: 'Check frequency in minutes',
          },
          locations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Location codes for monitoring',
          },
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID',
          },
        },
        required: ['name', 'url', 'frequency', 'locations'],
      },
    };
  }

  async listSyntheticsMonitors(input: any): Promise<any> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
    }

    let query = `domain = 'SYNTH' AND accountId = '${accountId}'`;
    if (input.monitor_type) {
      query += ` AND monitorType = '${input.monitor_type}'`;
    }

    const graphqlQuery = `{
      actor {
        entitySearch(query: "${query}") {
          results {
            entities {
              ... on SyntheticMonitorEntityOutline {
                guid
                name
                monitorType
                period
                monitoredUrl
                tags {
                  key
                  values
                }
              }
            }
          }
        }
      }
    }`;

    const response = await this.client.executeNerdGraphQuery(graphqlQuery);
    return response.data?.actor?.entitySearch?.results?.entities || [];
  }

  async createBrowserMonitor(input: any): Promise<any> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
    }

    const mutation = `
      mutation {
        syntheticsCreateSimpleBrowserMonitor(
          accountId: ${accountId}
          monitor: {
            name: "${input.name}"
            uri: "${input.url}"
            period: ${this.frequencyToPeriod(input.frequency)}
            status: ENABLED
            locations: {
              public: ${JSON.stringify(input.locations)}
            }
          }
        ) {
          monitor {
            id
            name
            uri
            period
            status
          }
          errors {
            type
            description
          }
        }
      }
    `;

    const response = await this.client.executeNerdGraphQuery(mutation);
    const result = response.data?.syntheticsCreateSimpleBrowserMonitor;

    if (result?.errors && result.errors.length > 0) {
      throw new Error(`Failed to create monitor: ${result.errors[0].description}`);
    }

    return result?.monitor || null;
  }

  private frequencyToPeriod(frequency: number): string {
    const periodMap: { [key: number]: string } = {
      1: 'EVERY_MINUTE',
      5: 'EVERY_5_MINUTES',
      10: 'EVERY_10_MINUTES',
      15: 'EVERY_15_MINUTES',
      30: 'EVERY_30_MINUTES',
      60: 'EVERY_HOUR',
    };
    return periodMap[frequency] || 'EVERY_5_MINUTES';
  }
}
