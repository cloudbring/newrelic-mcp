import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { NewRelicClient } from '../client/newrelic-client';

export class EntityTool {
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
  }

  getSearchTool(): Tool {
    return {
      name: 'search_entities',
      description: 'Search for entities in New Relic by name, type, or tags',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for entities',
          },
          entity_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by entity types (e.g., APPLICATION, HOST)',
          },
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID',
          },
        },
        required: ['query'],
      },
    };
  }

  getDetailsTool(): Tool {
    return {
      name: 'get_entity_details',
      description: 'Get detailed information about a specific entity',
      inputSchema: {
        type: 'object',
        properties: {
          entity_guid: {
            type: 'string',
            description: 'The GUID of the entity',
          },
        },
        required: ['entity_guid'],
      },
    };
  }

  async searchEntities(input: any): Promise<any> {
    const accountId = input.target_account_id;
    let query = input.query;

    if (accountId) {
      query += ` AND accountId = '${accountId}'`;
    }

    if (input.entity_types && input.entity_types.length > 0) {
      const types = input.entity_types.map((t: string) => `'${t}'`).join(',');
      query += ` AND type IN (${types})`;
    }

    const graphqlQuery = `{
      actor {
        entitySearch(query: "${query}") {
          results {
            entities {
              guid
              name
              type
              domain
              tags {
                key
                values
              }
            }
            nextCursor
          }
        }
      }
    }`;

    const response = await this.client.executeNerdGraphQuery(graphqlQuery);
    return response.data?.actor?.entitySearch?.results || { entities: [] };
  }

  async getEntityDetails(input: any): Promise<any> {
    const graphqlQuery = `{
      actor {
        entity(guid: "${input.entity_guid}") {
          guid
          name
          type
          domain
          entityType
          reporting
          tags {
            key
            values
          }
          ... on AlertableEntity {
            alertSeverity
            recentAlertViolations {
              alertSeverity
              violationId
              openedAt
              closedAt
              violationUrl
            }
          }
          ... on ApmApplicationEntity {
            language
            settings {
              apdexTarget
            }
          }
          relationships {
            type
            target {
              entities {
                guid
                name
              }
            }
          }
          goldenMetrics {
            metrics {
              name
              value
              unit
            }
          }
        }
      }
    }`;

    const response = await this.client.executeNerdGraphQuery(graphqlQuery);
    const entity = response.data?.actor?.entity;

    if (!entity) {
      throw new Error('Entity not found');
    }

    return entity;
  }
}
