import { ApiKeyAuthProvider, type AuthProvider } from './auth';

/**
 * New Relic data center region identifier.
 * Supports US (United States) and EU (Europe) regions.
 */
type Region = 'US' | 'EU';

/**
 * Returns the appropriate NerdGraph API endpoint URL based on the specified region.
 *
 * @param region - The New Relic data center region ('US' or 'EU')
 * @returns The NerdGraph GraphQL API endpoint URL for the specified region
 */
function getNerdGraphUrl(region: Region): string {
  return region === 'EU'
    ? 'https://api.eu.newrelic.com/graphql'
    : 'https://api.newrelic.com/graphql';
}

const NERDGRAPH_URL = getNerdGraphUrl(
  (process.env.NEW_RELIC_REGION?.toUpperCase() as Region) || 'US'
);

type GraphQLError = { message: string; [key: string]: unknown };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

export interface NrqlQueryResult {
  results: Array<Record<string, unknown>>;
  metadata: {
    eventTypes?: string[];
    timeWindow?: {
      begin: number;
      end: number;
    };
    facets?: string[];
    timeSeries?: boolean;
  };
}

export interface AccountDetails {
  accountId: string;
  name: string;
  region?: string;
}

export interface ApmApplication {
  guid: string;
  name: string;
  language: string;
  reporting: boolean;
  alertSeverity?: string;
  tags?: Record<string, string>;
}

export class NewRelicClient {
  private auth: AuthProvider;
  private defaultAccountId?: string;

  constructor(apiKeyOrAuth?: string | AuthProvider, defaultAccountId?: string) {
    this.auth =
      typeof apiKeyOrAuth === 'object'
        ? apiKeyOrAuth
        : new ApiKeyAuthProvider(apiKeyOrAuth || process.env.NEW_RELIC_API_KEY || '');
    this.defaultAccountId = defaultAccountId || process.env.NEW_RELIC_ACCOUNT_ID;
  }

  getAuthProvider(): AuthProvider {
    return this.auth;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      if (this.auth.mode === 'system-identity') {
        // A system identity is not a user, so actor.user is empty for it.
        const res = (await this.executeNerdGraphQuery<{ actor?: { accounts?: unknown[] } }>(
          '{ actor { accounts { id } } }'
        )) as GraphQLResponse<{ actor?: { accounts?: unknown[] } }>;
        return !res.errors?.length && Array.isArray(res.data?.actor?.accounts);
      }
      type UserResponse = { actor?: { user?: { id?: string; email?: string } } };
      const query = `{
        actor {
          user {
            id
            email
          }
        }
      }`;

      const response = (await this.executeNerdGraphQuery<UserResponse>(
        query
      )) as GraphQLResponse<UserResponse>;
      return !!response.data?.actor?.user;
    } catch (_error) {
      return false;
    }
  }

  async getAccountDetails(accountId?: string): Promise<AccountDetails> {
    const id = accountId || this.defaultAccountId;
    if (!id) {
      throw new Error('Account ID must be provided');
    }

    type AccountResponse = { actor?: { account?: { id: string; name: string } } };
    const query = `{
      actor {
        account(id: ${id}) {
          id
          name
        }
      }
    }`;

    const response = (await this.executeNerdGraphQuery<AccountResponse>(
      query
    )) as GraphQLResponse<AccountResponse>;

    if (!response.data?.actor?.account) {
      throw new Error(`Account ${id} not found`);
    }

    return {
      accountId: response.data.actor.account.id,
      name: response.data.actor.account.name,
    };
  }

  async runNrqlQuery(params: { nrql: string; accountId: string }): Promise<NrqlQueryResult> {
    if (!params.nrql || typeof params.nrql !== 'string') {
      throw new Error('Invalid or empty NRQL query provided');
    }

    if (!params.accountId || !/^\d+$/.test(params.accountId)) {
      throw new Error('Invalid account ID format');
    }

    const query = `{
      actor {
        account(id: ${params.accountId}) {
          nrql(query: "${params.nrql.replace(/"/g, '\\"')}") {
            results
            metadata {
              eventTypes
              timeWindow {
                begin
                end
              }
              facets
            }
          }
        }
      }
    }`;

    try {
      type NrqlResponse = {
        actor?: {
          account?: {
            nrql?: {
              results?: Array<Record<string, unknown>>;
              metadata?: {
                eventTypes?: string[];
                timeWindow?: { begin: number; end: number };
                facets?: string[];
              };
            };
          };
        };
      };
      const response = (await this.executeNerdGraphQuery<NrqlResponse>(
        query
      )) as GraphQLResponse<NrqlResponse>;

      if (response.errors) {
        const errorMessage = response.errors[0]?.message || 'NRQL query failed';
        throw new Error(errorMessage);
      }

      const nrqlResult = response.data?.actor?.account?.nrql;

      if (!nrqlResult) {
        throw new Error('No results returned from NRQL query');
      }

      // Detect if it's a time series query
      const isTimeSeries = params.nrql.toLowerCase().includes('timeseries');

      return {
        results: nrqlResult.results || [],
        metadata: {
          ...nrqlResult.metadata,
          timeSeries: isTimeSeries,
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Syntax error')) {
        throw new Error(`NRQL Syntax error: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async listApmApplications(accountId?: string): Promise<ApmApplication[]> {
    const id = accountId || this.defaultAccountId;
    if (!id) {
      throw new Error('Account ID must be provided');
    }

    const query = `{
      actor {
        entitySearch(query: "domain = 'APM' AND type = 'APPLICATION' AND accountId = '${id}'") {
          results {
            entities {
              guid
              name
              ... on ApmApplicationEntityOutline {
                language
                reporting
                alertSeverity
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

    type EntitySearchResponse = {
      actor?: {
        entitySearch?: {
          results?: {
            entities?: Array<{
              guid: string;
              name: string;
              language?: string;
              reporting?: boolean;
              alertSeverity?: string;
              tags?: Array<{ key?: string; values?: string[] }>;
            }>;
          };
        };
      };
    };
    const response = (await this.executeNerdGraphQuery<EntitySearchResponse>(
      query
    )) as GraphQLResponse<EntitySearchResponse>;
    const entities = (response.data?.actor?.entitySearch?.results?.entities || []) as Array<{
      guid: string;
      name: string;
      language?: string;
      reporting?: boolean;
      alertSeverity?: string;
      tags?: Array<{ key?: string; values?: string[] }>;
    }>;

    return entities.map((entity) => ({
      guid: entity.guid,
      name: entity.name,
      language: entity.language || 'unknown',
      reporting: entity.reporting || false,
      alertSeverity: entity.alertSeverity,
      tags: this.parseTags(entity.tags),
    }));
  }

  private parseTags(tags?: Array<{ key?: string; values?: string[] }>): Record<string, string> {
    if (!tags) return {};

    const result: Record<string, string> = {};
    tags.forEach((tag) => {
      const values = Array.isArray(tag.values) ? tag.values : [];
      if (tag.key && values.length > 0) {
        result[tag.key] = values[0] as string;
      }
    });
    return result;
  }

  async executeNerdGraphQuery<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> {
    if (this.auth.mode === 'none') {
      throw new Error('NEW_RELIC_API_KEY environment variable is not set');
    }

    const send = async (): Promise<Response> =>
      fetch(NERDGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await this.auth.getHeaders()) },
        body: JSON.stringify({ query, variables }),
      });

    let response = await send();
    if (response.status === 401 && this.auth.mode === 'system-identity') {
      this.auth.invalidate();
      response = await send();
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          this.auth.mode === 'system-identity'
            ? 'Unauthorized: system identity token rejected'
            : 'Unauthorized: Invalid API key'
        );
      }
      throw new Error(`NerdGraph API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GraphQLResponse<T>;
  }
}
