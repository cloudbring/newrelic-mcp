import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { NewRelicClient } from '../client/newrelic-client';

export class AlertTool {
  private client: NewRelicClient;

  constructor(client: NewRelicClient) {
    this.client = client;
  }

  getPoliciesTool(): Tool {
    return {
      name: 'list_alert_policies',
      description: 'List all alert policies in your New Relic account',
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

  getIncidentsTool(): Tool {
    return {
      name: 'list_open_incidents',
      description: 'List all open incidents in your New Relic account',
      inputSchema: {
        type: 'object',
        properties: {
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID',
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Filter by incident priority',
          },
        },
      },
    };
  }

  getAcknowledgeTool(): Tool {
    return {
      name: 'acknowledge_incident',
      description: 'Acknowledge an open incident',
      inputSchema: {
        type: 'object',
        properties: {
          incident_id: {
            type: 'string',
            description: 'The ID of the incident to acknowledge',
          },
        },
        required: ['incident_id'],
      },
    };
  }

  async listAlertPolicies(input: {
    target_account_id?: string;
  }): Promise<Array<Record<string, unknown>>> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
    }
    if (!/^\d+$/.test(accountId)) {
      throw new Error('Invalid account ID format');
    }

    const query = `{
      actor {
        account(id: ${accountId}) {
          alerts {
            policiesSearch {
              policies {
                id
                name
                incidentPreference
                conditions {
                  id
                  name
                  enabled
                }
              }
            }
          }
        }
      }
    }`;

    const response = await this.client.executeNerdGraphQuery<{
      actor?: {
        account?: { alerts?: { policiesSearch?: { policies?: Array<Record<string, unknown>> } } };
      };
    }>(query);
    return response.data?.actor?.account?.alerts?.policiesSearch?.policies || [];
  }

  async listOpenIncidents(input: {
    target_account_id?: string;
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<Record<string, unknown>[]> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
    }
    if (!/^\d+$/.test(accountId)) {
      throw new Error('Invalid account ID format');
    }

    let filter = `accountId = '${accountId}' AND state = 'OPEN'`;
    if (input.priority) {
      filter += ` AND priority = '${input.priority}'`;
    }

    const query = `{
      actor {
        entitySearch(query: "${filter}") {
          results {
            entities {
              ... on AiIssuesEntity {
                issues {
                  issues {
                    issueId
                    title
                    priority
                    state
                    createdAt
                    sources
                  }
                }
              }
            }
          }
        }
      }
    }`;

    const response = await this.client.executeNerdGraphQuery<{
      actor?: {
        entitySearch?: {
          results?: { entities?: Array<{ issues?: { issues?: Record<string, unknown>[] } }> };
        };
      };
    }>(query);
    const entities = (response.data?.actor?.entitySearch?.results?.entities || []) as Array<{
      issues?: { issues?: Record<string, unknown>[] };
    }>;

    const incidents: Record<string, unknown>[] = [];
    entities.forEach((entity) => {
      if (entity.issues?.issues) {
        incidents.push(...entity.issues.issues);
      }
    });

    return incidents;
  }

  async acknowledgeIncident(input: {
    incident_id: string;
    comment?: string;
  }): Promise<Record<string, unknown> | null> {
    const mutation = `
      mutation {
        aiIssuesAcknowledge(
          issueIds: ["${input.incident_id}"]
          ${input.comment ? `, comment: "${input.comment}"` : ''}
        ) {
          issues {
            issueId
            state
            acknowledgedAt
            acknowledgedBy
            ${input.comment ? 'comment' : ''}
          }
          errors {
            type
            description
          }
        }
      }
    `;

    const response = await this.client.executeNerdGraphQuery<{
      aiIssuesAcknowledge?: {
        issues?: Record<string, unknown>[];
        errors?: Array<{ description?: string }>;
      };
    }>(mutation);
    const result = response.data?.aiIssuesAcknowledge;

    if (result?.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].description);
    }

    return result?.issues?.[0] || null;
  }

  async acknowledgeIncidents(input: {
    incident_ids: string[];
  }): Promise<Record<string, unknown>[]> {
    const mutation = `
      mutation {
        aiIssuesAcknowledge(
          issueIds: ${JSON.stringify(input.incident_ids)}
        ) {
          issues {
            issueId
            state
          }
          errors {
            type
            description
          }
        }
      }
    `;

    const response = await this.client.executeNerdGraphQuery<{
      aiIssuesAcknowledge?: {
        issues?: Record<string, unknown>[];
        errors?: Array<{ description?: string }>;
      };
    }>(mutation);
    const result = response.data?.aiIssuesAcknowledge;

    if (result?.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].description);
    }

    return result?.issues || [];
  }
}
