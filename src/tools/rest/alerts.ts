import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicRestClient, type Region } from '../../client/rest-client';

type ListPoliciesArgs = {
  filter_name?: string;
  page?: number;
  auto_paginate?: boolean;
  region?: Region;
};

type ListIncidentsArgs = {
  page?: number;
  auto_paginate?: boolean;
  only_open?: boolean; // client-side filter
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; // client-side filter
  region?: Region;
};

export class RestAlertsTool {
  private restFor(region?: Region): NewRelicRestClient {
    const apiKey = process.env.NEW_RELIC_API_KEY as string;
    return new NewRelicRestClient({ apiKey, region: region ?? 'US' });
  }

  getListPoliciesTool(): Tool {
    return {
      name: 'list_alert_policies_rest',
      description: 'List alert policies via REST v2.',
      inputSchema: {
        type: 'object',
        properties: {
          filter_name: { type: 'string' },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
      },
    };
  }

  async listPolicies(args: ListPoliciesArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = '/alerts_policies';
    const query: Record<string, unknown> = {};
    if (args.filter_name) query['filter[name]'] = args.filter_name;
    if (args.page) query.page = args.page;
    const res = await client.get<unknown>(path, query);
    return res;
  }

  getListIncidentsTool(): Tool {
    return {
      name: 'list_open_incidents_rest',
      description: 'List alert incidents via REST v2 (client-side filtering of open/priority).',
      inputSchema: {
        type: 'object',
        properties: {
          only_open: { type: 'boolean' },
          priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
      },
    };
  }

  async listIncidents(args: ListIncidentsArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = '/alerts_incidents';
    const query: Record<string, unknown> = {};
    if (args.page) query.page = args.page;

    const results: any[] = [];
    let nextUrl: string | undefined;
    let page = args.page;
    do {
      const res = await client.get<any>(path, page ? { ...query, page } : query);
      results.push(res.data);
      const next = res.links?.next;
      if (args.auto_paginate && next) {
        const u = new URL(next);
        const p = u.searchParams.get('page');
        page = p ? Number(p) : undefined;
        nextUrl = next;
      } else {
        nextUrl = undefined;
      }
    } while (args.auto_paginate && nextUrl);

    const combined = args.auto_paginate ? results.flat() : results[0];
    // Apply client-side filters if requested
    let items = combined;
    if (Array.isArray(combined)) {
      items = combined.filter((inc) => {
        let ok = true;
        if (args.only_open === true) {
          ok = ok && (!inc.closed_at || inc.closed_at === 0);
        }
        if (args.priority) {
          ok = ok && inc.priority === args.priority;
        }
        return ok;
      });
    }
    return { items, page };
  }
}
