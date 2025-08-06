import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient } from '../client/newrelic-client';

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
            description: 'Optional New Relic account ID'
          }
        }
      }
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
            description: 'Optional New Relic account ID'
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: 'Filter by incident priority'
          }
        }
      }
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
            description: 'The ID of the incident to acknowledge'
          }
        },
        required: ['incident_id']
      }
    };
  }

  async listAlertPolicies(input: any): Promise<any> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
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

    const response = await this.client.executeNerdGraphQuery(query);
    return response.data?.actor?.account?.alerts?.policiesSearch?.policies || [];
  }

  async listOpenIncidents(input: any): Promise<any> {
    const accountId = input.target_account_id;
    if (!accountId) {
      throw new Error('Account ID must be provided');
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

    const response = await this.client.executeNerdGraphQuery(query);
    const entities = response.data?.actor?.entitySearch?.results?.entities || [];
    
    const incidents: any[] = [];
    entities.forEach((entity: any) => {
      if (entity.issues?.issues) {
        incidents.push(...entity.issues.issues);
      }
    });
    
    return incidents;
  }

  async acknowledgeIncident(input: any): Promise<any> {
    const mutation = `
      mutation {
        aiIssuesAcknowledge(
          issueIds: ["${input.incident_id}"]
        ) {
          issues {
            issueId
            state
          }
        }
      }
    `;

    const response = await this.client.executeNerdGraphQuery(mutation);
    return response.data?.aiIssuesAcknowledge || { success: false };
  }
}